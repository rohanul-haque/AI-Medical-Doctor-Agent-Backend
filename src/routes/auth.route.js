import express from "express";

import { getUser, login, signup } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import upload from "../utils/upload.js";

const authRoute = express();

authRoute.post("/signup", upload.single("avatar"), signup);
authRoute.post("/login", login);
authRoute.get("/me", authMiddleware, getUser);

export default authRoute;
