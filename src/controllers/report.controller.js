import SessionChat from "../models/SessionChat.js";
import { HTTP_STATUS_CODE } from "../utils/HTTP_STATUS_CODE.js";

// get report controller
export const getReport = async (req, res) => {
  try {
    const { email } = req.user;

    if (!email) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized - User not found",
      });
    }

    const reports = await SessionChat.find({ createdBy: email })
      .select("-__v")
      .sort({ createdAt: -1 });

    if (!reports) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Report not found",
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Get Report Error:", error);

    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};
