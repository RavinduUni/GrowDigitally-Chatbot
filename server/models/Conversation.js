import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            index: true,
        },
        businessId: {
            type: String,
            default: "default-business",
        },
        visitorName: String,
        visitorEmail: String,
        visitorPhone: String,
        lastMessage: String,
    },
    { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);