"""
Prescription analysis router — uses Google Gemini to extract medications from
a prescription image (base64-encoded) and optionally saves the result.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from config import settings
from db.dynamodb import get_prescriptions_table
from models import (
    Prescription,
    PrescriptionAnalysis,
    UserPublic,
)
from routers.auth import get_current_user

router = APIRouter(prefix="/analyze", tags=["analyze"])


class AnalyzeRequest(BaseModel):
    """Request body for POST /analyze."""
    image_base64: str
    save: bool = False


_GEMINI_CONFIGURED = False


def _get_gemini_model():
    global _GEMINI_CONFIGURED
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is not configured on the server.",
        )
    if not _GEMINI_CONFIGURED:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _GEMINI_CONFIGURED = True
    return genai.GenerativeModel(settings.GEMINI_MODEL)


_PROMPT = """You are an expert medical prescription analyzer with knowledge of medications across all languages and regions.

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
- IMPORTANT for language detection: base the language on the written instructions, labels, doctor notes, and non-drug text — NOT on drug/medication names (which are typically Latin-derived regardless of the prescription's language). For example, if the instructions and labels are in English, set detected_language to "en" and detected_language_name to "English" even if some drug names look unfamiliar."""


def _clean_and_parse(raw: str) -> dict:
    """Strip markdown fences if Gemini adds them, then parse JSON."""
    cleaned = (
        raw.strip()
        .removeprefix("```json")
        .removeprefix("```")
        .removesuffix("```")
        .strip()
    )
    return json.loads(cleaned)


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("", response_model=PrescriptionAnalysis)
async def analyze_prescription(
    body: AnalyzeRequest,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Analyze a base64-encoded prescription image.

    - **image_base64**: Raw base64 string of the image (no data-URI prefix).
    - **save**: If `true`, the result is saved to the prescriptions table.
    """
    model = _get_gemini_model()

    try:
        result = model.generate_content(
            [
                {"mime_type": "image/jpeg", "data": body.image_base64},
                _PROMPT,
            ]
        )
        raw = result.text.strip()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API error: {exc}",
        )

    try:
        data = _clean_and_parse(raw)
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not parse Gemini response as JSON. Raw: {raw[:300]}",
        )

    analysis = PrescriptionAnalysis(**data)

    if body.save:
        now = datetime.now(timezone.utc).isoformat()
        prescription_id = str(uuid.uuid4())
        table = get_prescriptions_table()
        table.put_item(
            Item={
                "user_id": current_user.user_id,
                "prescription_id": prescription_id,
                "analysis": data,
                "created_at": now,
            }
        )

    return analysis


@router.get("/history", response_model=list[Prescription])
async def list_prescriptions(current_user: UserPublic = Depends(get_current_user)):
    """Return all saved prescriptions for the current user."""
    from boto3.dynamodb.conditions import Key

    table = get_prescriptions_table()
    resp = table.query(
        KeyConditionExpression=Key("user_id").eq(current_user.user_id)
    )
    items = resp.get("Items", [])
    return [
        Prescription(
            prescription_id=i["prescription_id"],
            user_id=i["user_id"],
            analysis=PrescriptionAnalysis(**i["analysis"]),
            created_at=i["created_at"],
        )
        for i in items
    ]


@router.delete("/history/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prescription(
    prescription_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """Delete a saved prescription."""
    table = get_prescriptions_table()
    table.delete_item(
        Key={"user_id": current_user.user_id, "prescription_id": prescription_id}
    )
