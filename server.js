import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";

import { config } from "./src/config/config.js";
import connectDB from "./src/config/db.js";
import authroute from "./src/routes/auth.route.js";
import reportRoute from "./src/routes/report.route.js";
import sessionChatRoute from "./src/routes/session.chat.route.js";
import suggestDoctorRoute from "./src/routes/suggest.doctor.route.js";
import connectCloudinary from "./src/utils/connectCloudinary.js";

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

// Middlewares
app.use(express.json());
app.use(cookieParser());

app.use(helmet());
app.use(hpp());
app.use(limiter);
app.use(
  cors({
    origin: [config.FRONTEND_URL],
    credentials: true,
  }),
);

// Routes
app.get("/", (req, res) => res.send("API is working"));
app.use("/images", express.static("public/images"));
app.use("/api/v1/auth", authroute);
app.use("/api/v1/suggest", suggestDoctorRoute);
app.use("/api/v1/session-chat", sessionChatRoute);
app.use("/api/v1/report", reportRoute);

// Start Server
const startServer = async () => {
  try {
    const port = process.env.PORT || 3000;

    await connectDB();
    connectCloudinary();

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Server start error:", error);
    process.exit(1);
  }
};

startServer();
