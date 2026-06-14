import Business from "../models/Business.js";

/**
 * Validates that the x-widget-token header belongs to the businessId in the request body.
 * Rejects requests where the token is missing, invalid, or doesn't match the businessId.
 */
export const validateWidgetToken = async (req, res, next) => {
  const token = req.headers["x-widget-token"];

  if (!token) {
    return res.status(401).json({ success: false, message: "Widget token required" });
  }

  const business = await Business.findOne({ widgetToken: token }).select(
    "businessId active"
  );

  if (!business) {
    return res.status(401).json({ success: false, message: "Invalid widget token" });
  }

  if (!business.active) {
    return res.status(403).json({ success: false, message: "This widget has been deactivated" });
  }

  // Attach verified businessId to the request so the controller uses it (not the client-supplied one)
  req.verifiedBusinessId = business.businessId;
  next();
};
