import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";

import connectDB from "./src/config/db.js";
import authroute from "./src/routes/auth.route.js";
import connectCloudinary from "./src/utils/connectCloudinary.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Routes
app.get("/", (req, res) => res.send("API is working"));

app.use("/api/v1/auth", authroute);

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
