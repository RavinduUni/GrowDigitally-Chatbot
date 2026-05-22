import { Router } from "express";
import { saveKnowledgeBase } from "../controller/chatController.js";

const chatRouter = Router();

chatRouter.post("/save", saveKnowledgeBase);

export default chatRouter;