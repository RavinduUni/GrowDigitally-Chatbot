import { Router } from "express";
import { sendMessage, getMessages } from "../controller/chatController.js";
import { chatLimiter } from "../middlewares/chatLimiter.js";
import { validateWidgetToken } from "../middlewares/validateWidgetToken.js";

const chatRouter = Router();

chatRouter.post("/message", chatLimiter, validateWidgetToken, sendMessage);
chatRouter.get("/messages/:sessionId", chatLimiter, getMessages);

export default chatRouter;
