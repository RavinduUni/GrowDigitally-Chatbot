import OpenAI from "openai";
import PQueue from "p-queue";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Limit concurrent OpenAI calls to prevent overload
const aiQueue = new PQueue({ concurrency: 50, timeout: 25000, throwOnTimeout: true });

const fallbackMessage =
  "I'm not fully sure about that. Please share your name and contact details, and our team will contact you.";

async function persistMessages(sessionId, businessId, userText, aiText) {
  let conversation = await Conversation.findOne({ sessionId });
  if (!conversation) {
    conversation = await Conversation.create({ sessionId, businessId, lastMessage: userText });
  }
  await Message.create({ conversationId: conversation._id, sender: "user", text: userText });
  await Message.create({ conversationId: conversation._id, sender: "ai", text: aiText });
  conversation.lastMessage = aiText;
  await conversation.save();
}

export const sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    // Use the server-verified businessId from the token, not the client-supplied one
    const businessId = req.verifiedBusinessId;

    if (!message || !sessionId) {
      return res.status(400).json({ success: false, message: "message and sessionId are required" });
    }

    const aiReply = await aiQueue.add(async () => {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful customer support assistant for business ID: ${businessId}. Be concise, friendly, and helpful.`,
          },
          { role: "user", content: message },
        ],
      });
      return completion.choices[0]?.message?.content || fallbackMessage;
    });

    // Persist to DB — non-blocking, errors logged but don't affect user response
    persistMessages(sessionId, businessId, message, aiReply).catch((err) =>
      console.error("DB persist error:", err)
    );

    return res.status(200).json({ success: true, reply: aiReply });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversation = await Conversation.findOne({ sessionId });

    if (!conversation) {
      return res.status(200).json({ success: true, messages: [] });
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });

    return res.status(200).json({ success: true, conversation, messages });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get messages",
      error: error.message,
    });
  }
};
