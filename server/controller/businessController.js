import crypto from "crypto";
import axios from "axios";
import Business from "../models/Business.js";
import ScrapingJob from "../models/ScrapingJob.js";

const MAX_ATTEMPTS = 3;
const BACKOFF_SECONDS = [30, 120, 600]; // 30s, 2m, 10m

/* ─────────────────────────────────────────────────────────────
   POST /api/business/register
   Body: { companyName, ownerName, email, websiteUrl }
───────────────────────────────────────────────────────────── */
export const registerBusiness = async (req, res) => {
  try {
    const { companyName, ownerName, email, websiteUrl } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (!companyName || !ownerName || !email || !websiteUrl) {
      return res.status(400).json({
        success: false,
        message: "companyName, ownerName, email, and websiteUrl are required",
      });
    }

    // ── Basic email format check ──────────────────────────────
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    // ── Prevent duplicate registrations ──────────────────────
    const existing = await Business.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A business with this email is already registered",
      });
    }

    // ── Generate unique IDs ───────────────────────────────────
    const businessId = "biz_" + crypto.randomBytes(6).toString("hex");
    const widgetToken = crypto.randomBytes(16).toString("hex");

    // ── Persist to MongoDB ────────────────────────────────────
    const business = await Business.create({
      companyName,
      ownerName,
      email: email.toLowerCase(),
      websiteUrl,
      businessId,
      widgetToken,
      knowledgeBaseStatus: "pending",
    });

    // ── Queue scraping job (processed by Vercel Cron via /process-queue) ──
    await ScrapingJob.create({ businessId, websiteUrl });
    console.log(`[Business] Scraping job queued for ${businessId}`);

    // ── Build embed code snippet ──────────────────────────────
    const embedCode = `<script src="${
      process.env.WIDGET_URL ||
      "https://grow-digitally-chatbot-6tky.vercel.app/widget.js"
    }" data-token="${widgetToken}" async></script>`;

    return res.status(201).json({
      success: true,
      message: "Business registered successfully",
      businessId,
      widgetToken,
      embedCode,
      companyName: business.companyName,
    });
  } catch (error) {
    console.error("[Business] Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /api/business/process-queue
   Called by Vercel Cron every minute. Picks up to 3 pending scraping
   jobs and fires them to n8n. Protected by x-n8n-secret header.
───────────────────────────────────────────────────────────── */
export const processScrapingQueue = async (req, res) => {
  // Accept Vercel Cron's automatic bearer token OR the manual n8n secret header
  const cronAuth = req.headers["authorization"];
  const n8nSecret = req.headers["x-n8n-secret"];
  const validCron =
    process.env.CRON_SECRET && cronAuth === `Bearer ${process.env.CRON_SECRET}`;
  const validManual =
    process.env.N8N_CALLBACK_SECRET && n8nSecret === process.env.N8N_CALLBACK_SECRET;

  if (!validCron && !validManual) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  if (!process.env.N8N_TRAIN_WEBHOOK) {
    return res.status(200).json({ success: true, processed: 0, message: "N8N_TRAIN_WEBHOOK not configured" });
  }

  const now = new Date();
  const jobs = await ScrapingJob.find({
    status: "pending",
    attempts: { $lt: MAX_ATTEMPTS },
    retryAfter: { $lte: now },
  })
    .sort({ createdAt: 1 })
    .limit(3);

  if (jobs.length === 0) {
    return res.status(200).json({ success: true, processed: 0 });
  }

  const results = await Promise.allSettled(
    jobs.map(async (job) => {
      await job.updateOne({ status: "processing", processedAt: now });
      await Business.findOneAndUpdate(
        { businessId: job.businessId },
        { knowledgeBaseStatus: "scraping" }
      );

      try {
        await axios.post(process.env.N8N_TRAIN_WEBHOOK, {
          businessId: job.businessId,
          websiteUrl: job.websiteUrl,
        });
        await job.updateOne({ status: "done" });
        console.log(`[Queue] Scraping triggered: ${job.businessId}`);
      } catch (err) {
        const nextAttempt = job.attempts + 1;
        const backoffSecs = BACKOFF_SECONDS[nextAttempt - 1] ?? 600;
        const retryAfter = new Date(Date.now() + backoffSecs * 1000);

        if (nextAttempt >= MAX_ATTEMPTS) {
          await job.updateOne({ status: "failed", attempts: nextAttempt, lastError: err.message });
          await Business.findOneAndUpdate(
            { businessId: job.businessId },
            { knowledgeBaseStatus: "failed" }
          );
          console.error(`[Queue] Job permanently failed: ${job.businessId} — ${err.message}`);
        } else {
          await job.updateOne({
            status: "pending",
            attempts: nextAttempt,
            lastError: err.message,
            retryAfter,
          });
          console.warn(`[Queue] Job will retry (attempt ${nextAttempt}/${MAX_ATTEMPTS}): ${job.businessId}`);
        }
      }
    })
  );

  const processed = results.filter((r) => r.status === "fulfilled").length;
  return res.status(200).json({ success: true, processed, total: jobs.length });
};

/* ─────────────────────────────────────────────────────────────
   POST /api/business/kb-status
   Called by n8n when scraping completes or fails.
   Body: { businessId, status: "ready"|"failed", chunks: number }
   Header: x-n8n-secret (must match N8N_CALLBACK_SECRET env var)
───────────────────────────────────────────────────────────── */
export const updateKnowledgeBaseStatus = async (req, res) => {
  try {
    const secret = req.headers["x-n8n-secret"];
    if (!process.env.N8N_CALLBACK_SECRET || secret !== process.env.N8N_CALLBACK_SECRET) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { businessId, status, chunks } = req.body;

    if (!businessId || !["ready", "failed", "scraping"].includes(status)) {
      return res.status(400).json({ success: false, message: "businessId and valid status required" });
    }

    await Business.findOneAndUpdate(
      { businessId },
      { knowledgeBaseStatus: status, ...(chunks != null && { kbChunkCount: chunks }) }
    );

    console.log(`[Business] KB status updated: ${businessId} → ${status} (${chunks ?? "?"} chunks)`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Business] KB status update error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/business/kb-progress/:businessId
   Polled by the frontend to show live scraping progress.
───────────────────────────────────────────────────────────── */
export const getKnowledgeBaseProgress = async (req, res) => {
  try {
    const business = await Business.findOne({ businessId: req.params.businessId }).select(
      "knowledgeBaseStatus kbChunkCount"
    );

    if (!business) {
      return res.status(404).json({ success: false, message: "Business not found" });
    }

    return res.status(200).json({
      success: true,
      status: business.knowledgeBaseStatus,
      chunks: business.kbChunkCount ?? 0,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/business/by-token/:widgetToken
   Resolves a widget token → businessId (used by the widget at load time)
───────────────────────────────────────────────────────────── */
export const getBusinessByToken = async (req, res) => {
  try {
    const { widgetToken } = req.params;

    if (!widgetToken) {
      return res.status(400).json({ success: false, message: "Token required" });
    }

    const business = await Business.findOne({ widgetToken }).select(
      "businessId companyName active knowledgeBaseStatus"
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Invalid widget token",
      });
    }

    if (!business.active) {
      return res.status(403).json({
        success: false,
        message: "This widget has been deactivated",
      });
    }

    return res.status(200).json({
      success: true,
      businessId: business.businessId,
      companyName: business.companyName,
      knowledgeBaseStatus: business.knowledgeBaseStatus,
      active: business.active,
    });
  } catch (error) {
    console.error("[Business] Token lookup error:", error);
    return res.status(500).json({
      success: false,
      message: "Token lookup failed",
      error: error.message,
    });
  }
};
