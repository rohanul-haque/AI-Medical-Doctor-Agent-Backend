import jwt from "jsonwebtoken";

import { config } from "../config/config.js";
import User from "../models/User.js";
import { HTTP_STATUS_CODE } from "../utils/HTTP_STATUS_CODE.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    console.log(token);

    if (!token) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized - No token",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET_KEY);
    } catch (err) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized - Invalid token",
      });
    }

    const user = await User.findById(decoded.id).select(
      "-password -__v -resetOtp -resetOtpExpire",
    );

    if (!user) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized - User not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);

    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};
