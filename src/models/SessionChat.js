import mongoose from "mongoose";

const sessionChatSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      required: true,
    },

    conversation: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    selectedDoctor: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    report: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    createdBy: {
      type: String,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

const SessionChat =
  mongoose.models.SessionChat ||
  mongoose.model("SessionChat", sessionChatSchema);

export default SessionChat;
