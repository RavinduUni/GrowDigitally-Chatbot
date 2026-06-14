import { Router } from "express";
import {
  registerBusiness,
  getBusinessByToken,
  updateKnowledgeBaseStatus,
  getKnowledgeBaseProgress,
  processScrapingQueue,
} from "../controller/businessController.js";

const businessRouter = Router();

businessRouter.post("/register", registerBusiness);
businessRouter.get("/by-token/:widgetToken", getBusinessByToken);

// Called by n8n when scraping completes
businessRouter.post("/kb-status", updateKnowledgeBaseStatus);

// Polled by frontend to show live scraping progress
businessRouter.get("/kb-progress/:businessId", getKnowledgeBaseProgress);

// Triggered by Vercel Cron every minute to process the scraping queue
businessRouter.post("/process-queue", processScrapingQueue);

export default businessRouter;
