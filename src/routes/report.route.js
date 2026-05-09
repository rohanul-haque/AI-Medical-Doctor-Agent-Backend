import express from "express";
import { getReport } from "../controllers/report.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const reportRoute = express();

reportRoute.get("/list", authMiddleware, getReport);

export default reportRoute;
