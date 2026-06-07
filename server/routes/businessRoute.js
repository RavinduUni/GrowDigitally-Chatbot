import { Router } from "express";
import {
  registerBusiness,
  getBusinessByToken,
} from "../controller/businessController.js";

const businessRouter = Router();

businessRouter.post("/register", registerBusiness);
businessRouter.get("/by-token/:widgetToken", getBusinessByToken);

export default businessRouter;
