import express from "express";
import { suggestDoctors } from "../controllers/suggest.doctors.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const suggestDoctorRoute = express();

suggestDoctorRoute.post("/doctors", authMiddleware, suggestDoctors);

export default suggestDoctorRoute;
