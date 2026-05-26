import axios from "axios";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export const sendMessage = async (req, res) => {
  try {
    const {
      message,
      sessionId,
      businessId = "default-business",
    } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "message and sessionId are required",
      });
    }

    const { data } = await axios.post(
      process.env.N8N_CHAT_WEBHOOK_URL,
      {
        question: message,
        sessionId,
        businessId,
      },
      {
        timeout: 30000,
      }
    );

    const fallbackMessage =
      "I'm not fully sure about that. Please share your name and contact details, and our team will contact you.";

    const aiReply =
      data?.reply ||
      data?.[0]?.reply ||
      data?.data?.reply ||
      data?.data?.message ||
      data?.[0]?.data?.reply ||
      data?.[0]?.data?.message ||
      data?.output ||
      data?.[0]?.output ||
      fallbackMessage;

    res.status(200).json({
      success: true,
      reply: aiReply,
    });

    let conversation = await Conversation.findOne({ sessionId });

    if (!conversation) {
      conversation = await Conversation.create({
        sessionId,
        businessId,
        lastMessage: message,
      });
    }

    await Message.create({
      conversationId: conversation._id,
      sender: "user",
      text: message,
    });

    await Message.create({
      conversationId: conversation._id,
      sender: "ai",
      text: aiReply,
    });

    conversation.lastMessage = aiReply;
    await conversation.save();
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
      return res.status(200).json({
        success: true,
        messages: [],
      });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      conversation,
      messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get messages",
      error: error.message,
    });
  }
};