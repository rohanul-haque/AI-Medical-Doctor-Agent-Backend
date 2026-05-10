import mongoose from "mongoose";
import { config } from "./config.js";

const connectDB = async () => {
  try {
    const MONGO_URI = config.MONGO_URI;

    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    await mongoose.connect(`${MONGO_URI}/ai-medi`);

    console.log("Database connection successful");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

export default connectDB;
