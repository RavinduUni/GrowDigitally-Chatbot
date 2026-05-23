import { Router } from "express";
import { sendMessage, getMessages } from "../controller/chatController.js";

const chatRouter = Router();

chatRouter.post("/message", sendMessage);
chatRouter.get("/messages/:sessionId", getMessages);

export default chatRouter;