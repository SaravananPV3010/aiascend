import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Missing imageBase64 in request body" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Add it to your .env file." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `You are an expert medical prescription analyzer with knowledge of medications across all languages and regions.

Analyze this prescription image carefully. The prescription may be handwritten or printed, and may be in ANY language.

Return ONLY valid JSON — no markdown fences, no explanation, no extra text. Just the raw JSON object.

JSON schema:
{
  "detected_language": "<BCP-47 language code, e.g. en, hi, ta, te, ml, bn>",
  "detected_language_name": "<full language name in English, e.g. English, Hindi, Tamil>",
  "medications": [
    {
      "name_english": "<medication/drug name in English>",
      "dosage": "<dosage if specified, e.g. 500mg, if not inferred from the medication name>",
      "frequency": "<frequency if specified, Twice daily, if not inferred from the medication name>",
      "dicription": "<what this medication is and what it treats, 30-40 words>",
      "megication_importance": "<why this specific patient must take it based on the prescription, 1-2 sentences>",
      "timing": ["<only include applicable times from: morning, afternoon, night>"],
      "with_food": "<before food | after food | with food>"
    }
  ]
}

Rules:
- Include ALL medications visible in the prescription
- If dosage/timing is not specified, make a reasonable medical inference
- If no medications can be identified, return: {"detected_language":"unknown","detected_language_name":"Unknown","medications":[]}
- Do NOT wrap the JSON in markdown code fences
- IMPORTANT for language detection: base the language on the written instructions, labels, doctor notes, and non-drug text — NOT on drug/medication names (which are typically Latin-derived regardless of the prescription's language). For example, if the instructions and labels are in English, set detected_language to "en" and detected_language_name to "English" even if some drug names look unfamiliar.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      },
      { text: prompt },
    ]);

    const responseText = result.response.text().trim();
    console.log("Gemini raw response:", responseText.substring(0, 500));

    // Strip markdown fences if model adds them anyway
    const cleaned = responseText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let analysis: unknown;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse failed. Raw response:", responseText);
      return NextResponse.json(
        { error: `Gemini returned non-JSON response: ${responseText.substring(0, 200)}` },
        { status: 500 }
      );
    }

    return NextResponse.json(analysis);

  } catch (err: any) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("Analyze route error:", detail);
    return NextResponse.json(
      { error: detail },
      { status: 500 }
    );
  }
}
