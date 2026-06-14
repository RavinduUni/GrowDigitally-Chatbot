import mongoose from "mongoose";

const scrapingJobSchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true, index: true },
    websiteUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "done", "failed"],
      default: "pending",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    // Earliest time this job may be retried (used for exponential backoff)
    retryAfter: { type: Date, default: () => new Date() },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("ScrapingJob", scrapingJobSchema);
