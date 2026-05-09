import express from "express";

import {
  checkOtp,
  forgotPassword,
  getUser,
  login,
  logout,
  resetPassword,
  signup,
  updateProfile,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import upload from "../utils/upload.js";

const authRoute = express();

authRoute.post("/signup", upload.single("avatar"), signup);
authRoute.post("/login", login);
authRoute.post("/logout", logout);
authRoute.get("/me", authMiddleware, getUser);
authRoute.put(
  "/update-profile",
  authMiddleware,
  upload.single("avatar"),
  updateProfile,
);
authRoute.post("/forgot-password", forgotPassword);
authRoute.post("/check-otp", checkOtp);
authRoute.post("/reset-password", resetPassword);

export default authRoute;
