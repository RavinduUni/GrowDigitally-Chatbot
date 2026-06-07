import crypto from "crypto";
import axios from "axios";
import Business from "../models/Business.js";

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

    // ── Trigger n8n scraping (fire-and-forget) ────────────────
    if (process.env.N8N_TRAIN_WEBHOOK) {
      axios
        .post(process.env.N8N_TRAIN_WEBHOOK, { businessId, websiteUrl })
        .then(() => {
          console.log(`[Business] Scraping triggered for ${businessId}`);
          // Update status to "scraping" once webhook fires
          Business.findByIdAndUpdate(business._id, {
            knowledgeBaseStatus: "scraping",
          }).catch(console.error);
        })
        .catch((err) => {
          console.error("[Business] Failed to trigger scraping:", err.message);
        });
    } else {
      console.warn("[Business] N8N_TRAIN_WEBHOOK not set — scraping skipped");
    }

    // ── Build embed code snippet ──────────────────────────────
    const embedCode = `<script src="${
      process.env.WIDGET_URL ||
      "https://grow-digitally-chatbot-6tky.vercel.app/widget.js"
    }" data-token="${widgetToken}" defer></script>`;

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
