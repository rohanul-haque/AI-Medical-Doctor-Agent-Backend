import { openai } from "../config/openAIModel.js";
import { AIDoctorAgents } from "../utils/AIDoctorAgents.js";
import { HTTP_STATUS_CODE } from "../utils/HTTP_STATUS_CODE.js";

// suggest doctors controller
export const suggestDoctors = async (req, res) => {
  try {
    let { notes } = req.body;

    if (!notes) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Notes are required",
      });
    }

    notes = notes.trim();

    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash-lite-preview-09-2025",
      messages: [
        { role: "system", content: JSON.stringify(AIDoctorAgents) },
        {
          role: "user",
          content:
            "User Notes/Symptoms: " +
            notes +
            ", Depends on user note and symptoms, Please suggest list of doctors , Return Object in JSON only",
        },
      ],
    });

    const rawContent = completion?.choices?.[0]?.message?.content || "";

    const cleaned = rawContent
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsedResponse;

    try {
      parsedResponse = JSON.parse(cleaned);
    } catch (err) {
      console.error("JSON Parse Error:", cleaned);

      return res.status(HTTP_STATUS_CODE.OK).json({
        success: true,
        data: [],
        warning: "AI returned invalid JSON",
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      doctors: parsedResponse,
    });
  } catch (error) {
    console.error("Suggest Doctors Error:", error);

    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};
