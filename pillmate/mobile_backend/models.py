"""
Pydantic models — request / response schemas + DynamoDB item converters.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field


# ═══════════════════════════════════════════════════════════════════════════════
# Auth
# ═══════════════════════════════════════════════════════════════════════════════

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    display_name: str = Field(..., min_length=1)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class UserPublic(BaseModel):
    user_id: str
    email: str
    display_name: str
    photo_url: str | None = None
    created_at: str


# ═══════════════════════════════════════════════════════════════════════════════
# Medication
# ═══════════════════════════════════════════════════════════════════════════════

class MedicationCreate(BaseModel):
    name: str
    dosage: str
    frequency: str
    timing: list[Literal["morning", "afternoon", "night"]] = []
    with_food: Literal["before food", "after food", "with food", ""] = ""
    plain_language_explanation: str = ""
    why_timing_matters: str = ""
    warnings: list[str] = []
    source: Literal["manual", "prescription"] = "manual"


class MedicationUpdate(BaseModel):
    name: str | None = None
    dosage: str | None = None
    frequency: str | None = None
    timing: list[Literal["morning", "afternoon", "night"]] | None = None
    with_food: Literal["before food", "after food", "with food", ""] | None = None
    plain_language_explanation: str | None = None
    why_timing_matters: str | None = None
    warnings: list[str] | None = None


class Medication(MedicationCreate):
    medication_id: str
    user_id: str
    created_at: str
    updated_at: str


# ═══════════════════════════════════════════════════════════════════════════════
# Prescription
# ═══════════════════════════════════════════════════════════════════════════════

class DetectedMedication(BaseModel):
    name_english: str
    dosage: str = ""
    frequency: str = ""
    dicription: str = ""           # kept as-is to match Gemini output key
    megication_importance: str = ""  # kept as-is
    timing: list[Literal["morning", "afternoon", "night"]] = []
    with_food: str = ""


class PrescriptionAnalysis(BaseModel):
    detected_language: str
    detected_language_name: str
    medications: list[DetectedMedication]


class Prescription(BaseModel):
    prescription_id: str
    user_id: str
    analysis: PrescriptionAnalysis
    image_key: str = ""   # S3 key if image is stored
    created_at: str


# ═══════════════════════════════════════════════════════════════════════════════
# Drug search / contraindications
# ═══════════════════════════════════════════════════════════════════════════════

class DrugSuggestion(BaseModel):
    name: str
    type: Literal["Brand", "Generic"]
    generic: str | None = None


class ContraindicationRequest(BaseModel):
    medication_name: str = Field(..., min_length=1, max_length=200)
    current_medications: list[str] = Field(..., max_length=50)


class ContraindicationResult(BaseModel):
    medication: str
    has_contraindications: bool
    warnings: list[str]
    recommendations: str
