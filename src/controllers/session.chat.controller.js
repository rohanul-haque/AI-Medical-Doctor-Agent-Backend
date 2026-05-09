import { v4 as uuidv4 } from "uuid";
import { openai } from "../config/openAIModel.js";
import SessionChat from "../models/SessionChat.js";
import { HTTP_STATUS_CODE } from "../utils/HTTP_STATUS_CODE.js";

// create session controller
export const createSessionChat = async (req, res) => {
  try {
    let { notes, selectedDoctor } = req.body;

    if (!notes || !selectedDoctor) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!req?.user?.email) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized",
      });
    }

    notes = notes.trim();

    const sessionId = uuidv4();

    const sessionChat = await SessionChat.create({
      sessionId,
      notes,
      selectedDoctor,
      createdBy: req.user.email,
    });

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      success: true,
      message: "Session created successfully",
      sessionChat,
    });
  } catch (error) {
    console.error("Create Session Chat Error:", error);

    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// get session details controller
export const getSessionDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Session ID is required",
      });
    }

    const sessionDetails = await SessionChat.findOne({ sessionId: id }).select(
      "-__v",
    );

    if (!sessionDetails) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Session not found",
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      sessionDetails,
    });
  } catch (error) {
    console.error("Get Session Details Error:", error);

    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// generate report prompt
const REPORT_GEN_PROMPT = `You are an AI Medical Voice Agent that just finished a voice conversation with a user. Based on doctor ai agent info conversation between AI Medical Voice Agent and user, generate a structured report with the following fields:
1. sessionId: a unique session identifier
2. agent: the medical specialist name (e.g., "General Physician AI")
3. user: name of the patient or "Anonymous" if not provided
4. timestamp: current date and time in ISO format
5. chiefComplaint: one-sentence summary of the main health concern
6. summary: a 2-3 sentence summary of the conversation, symptoms, and recommendations
7. symptoms: list of symptoms mentioned by the user
8. duration: how long the user has experienced the symptoms
9. severity: mild, moderate, or severe
10. medicationsMentioned: list of any medicines mentioned
11. recommendations: list of AI suggestions (e.g., rest, see a doctor)

Return the result in JSON format:
{
  "sessionId": "string",
  "agent": "string",
  "user": "string",
  "timestamp": "ISO Date string",
  "chiefComplaint": "string",
  "summary": "string",
  "symptoms": ["symptom1", "symptom2"],
  "duration": "string",
  "severity": "string",
  "medicationsMentioned": ["med1", "med2"],
  "recommendations": ["rec1", "rec2"]
}

Only include valid fields. Respond with nothing else.`;

// generate report controller
export const generateReport = async (req, res) => {
  try {
    const { selectedDoctor, messages } = req.body;
    const { id: sessionId } = req.params;

    console.log(sessionId);

    if (!sessionId || !selectedDoctor || !messages) {
      return res.status(400).json({
        success: false,
        message: "sessionId, selectedDoctor, messages are required",
      });
    }

    const userInput =
      "AI Doctor Agent info: " +
      JSON.stringify(selectedDoctor) +
      "\nConversation: " +
      JSON.stringify(messages);

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "google/gemini-2.5-flash-lite-preview-09-2025",
        messages: [
          { role: "system", content: REPORT_GEN_PROMPT },
          { role: "user", content: userInput },
        ],
      });
    } catch (apiError) {
      console.error("OpenAI Error:", apiError);

      return res.status(502).json({
        success: false,
        message: "AI service failed",
      });
    }

    const rawContent = completion?.choices?.[0]?.message?.content || "";

    if (!rawContent) {
      return res.status(500).json({
        success: false,
        message: "Empty AI response",
      });
    }

    const cleaned = rawContent
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsedResponse;

    try {
      parsedResponse = JSON.parse(cleaned);
    } catch (err) {
      console.error("JSON Parse Error:", cleaned);

      return res.status(500).json({
        success: false,
        message: "Invalid AI JSON format",
      });
    }

    if (!parsedResponse.sessionId || !parsedResponse.summary) {
      return res.status(500).json({
        success: false,
        message: "AI response missing required fields",
      });
    }

    const updatedDoc = await SessionChat.findOneAndUpdate(
      { sessionId },
      {
        report: parsedResponse,
        conversation: messages,
        selectedDoctor,
      },
      {
        new: true,
        upsert: true,
      },
    );

    return res.status(200).json({
      success: true,
      data: parsedResponse,
    });
  } catch (error) {
    console.error("Generate Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
