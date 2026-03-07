"""
Drugs router — FDA drug search & AI-powered contraindication checking.
"""

from __future__ import annotations

import json
import urllib.parse

import httpx
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, Query, status

from config import settings
from models import ContraindicationRequest, ContraindicationResult, DrugSuggestion, UserPublic
from routers.auth import get_current_user

router = APIRouter(prefix="/drugs", tags=["drugs"])

_GEMINI_CONFIGURED = False


def _get_gemini_model():
    global _GEMINI_CONFIGURED
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is not configured.",
        )
    if not _GEMINI_CONFIGURED:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _GEMINI_CONFIGURED = True
    return genai.GenerativeModel(settings.GEMINI_MODEL)


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/search", response_model=list[DrugSuggestion])
async def search_drugs(
    q: str = Query(..., min_length=2, description="Drug name to search"),
    limit: int = Query(10, ge=1, le=25),
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Search the FDA NDC database for brand and generic drug name suggestions.
    """
    query = q.strip().lower()
    url = (
        f"{settings.FDA_BASE_URL}/ndc.json"
        f"?search=brand_name:{query}*+generic_name:{query}*&limit={limit * 3}"
    )

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

    if resp.status_code == 404:
        return []

    if not resp.is_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"FDA API returned {resp.status_code}",
        )

    data = resp.json()
    results = data.get("results", [])

    seen: dict[str, DrugSuggestion] = {}
    for r in results:
        if r.get("brand_name"):
            key = r["brand_name"].upper()
            if key not in seen:
                seen[key] = DrugSuggestion(
                    name=r["brand_name"],
                    type="Brand",
                    generic=r.get("generic_name"),
                )
        if r.get("generic_name"):
            key = r["generic_name"].upper()
            if key not in seen:
                seen[key] = DrugSuggestion(name=r["generic_name"], type="Generic")

    return list(seen.values())[:limit]


@router.post("/contraindications", response_model=ContraindicationResult)
async def check_contraindications(
    body: ContraindicationRequest,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Use Gemini to check for contraindications between a medication and
    a list of currently-taken medications.
    """
    if not body.current_medications:
        return ContraindicationResult(
            medication=body.medication_name,
            has_contraindications=False,
            warnings=[],
            recommendations="No other medications provided to check against.",
        )

    model = _get_gemini_model()

    current_list = ", ".join(body.current_medications)
    prompt = f"""You are a clinical pharmacist. Analyze potential drug interactions.

New medication: {body.medication_name}
Current medications: {current_list}

Return ONLY a JSON object (no markdown fences) with this exact schema:
{{
  "has_contraindications": <true|false>,
  "warnings": ["<warning 1>", "<warning 2>"],
  "recommendations": "<1-2 sentence professional recommendation>"
}}

Rules:
- Be conservative: flag any moderate or major interactions as contraindications.
- Keep warnings concise (max 15 words each).
- If no interactions exist, set has_contraindications to false and warnings to [].
- Do NOT include minor/theoretical interactions."""

    try:
        result = model.generate_content(prompt)
        raw = result.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(raw)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API error: {exc}",
        )

    return ContraindicationResult(
        medication=body.medication_name,
        has_contraindications=data.get("has_contraindications", False),
        warnings=data.get("warnings", []),
        recommendations=data.get("recommendations", ""),
    )


@router.get("/label/{drug_name}")
async def get_drug_label(
    drug_name: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Fetch the latest drug label information from the FDA openFDA /label endpoint.
    Returns raw FDA label data including warnings, dosage, indications etc.
    """
    encoded = urllib.parse.quote(drug_name, safe="")
    url = f"{settings.FDA_BASE_URL}/label.json?search=openfda.brand_name:{encoded}+openfda.generic_name:{encoded}&limit=1"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

    if resp.status_code == 404:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drug label not found")

    if not resp.is_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"FDA API returned {resp.status_code}",
        )

    data = resp.json()
    results = data.get("results", [])
    if not results:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drug label not found")

    label = results[0]
    return {
        "brand_name": label.get("openfda", {}).get("brand_name", []),
        "generic_name": label.get("openfda", {}).get("generic_name", []),
        "indications_and_usage": label.get("indications_and_usage", []),
        "dosage_and_administration": label.get("dosage_and_administration", []),
        "warnings": label.get("warnings", []),
        "contraindications": label.get("contraindications", []),
        "adverse_reactions": label.get("adverse_reactions", []),
    }
