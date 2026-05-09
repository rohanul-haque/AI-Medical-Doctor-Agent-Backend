import express from "express";
import {
    createSessionChat,
    generateReport,
    getSessionDetails,
} from "../controllers/session.chat.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const sessionChatRoute = express();

sessionChatRoute.post("/create", authMiddleware, createSessionChat);
sessionChatRoute.get("/:id", authMiddleware, getSessionDetails);
sessionChatRoute.patch("/create-report/:id", authMiddleware, generateReport);

export default sessionChatRoute;
