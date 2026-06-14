import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    websiteUrl: {
      type: String,
      required: true,
      trim: true,
    },

    businessId: {
      type: String,
      unique: true,
      required: true,
    },

    widgetToken: {
      type: String,
      unique: true,
    },

    knowledgeBaseStatus: {
      type: String,
      enum: ["pending", "scraping", "ready", "failed"],
      default: "pending",
    },

    kbChunkCount: {
      type: Number,
      default: 0,
    },

    n8nWebhookUrl: String,

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Business", businessSchema);
