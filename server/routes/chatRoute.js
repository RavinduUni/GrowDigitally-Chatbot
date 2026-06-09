import { Router } from "express";
import { sendMessage, getMessages } from "../controller/chatController.js";
import { chatLimiter } from "../middlewares/chatLimiter.js";

const chatRouter = Router();

chatRouter.post("/message", chatLimiter, sendMessage);
chatRouter.get("/messages/:sessionId", chatLimiter, getMessages);

export default chatRouter;