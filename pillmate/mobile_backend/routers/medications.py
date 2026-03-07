"""
Medications router — full CRUD for a user's medication list, backed by DynamoDB.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, Depends, HTTPException, status

from db.dynamodb import get_medications_table
from models import Medication, MedicationCreate, MedicationUpdate, UserPublic
from routers.auth import get_current_user

router = APIRouter(prefix="/medications", tags=["medications"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _item_to_medication(item: dict) -> Medication:
    return Medication(
        medication_id=item["medication_id"],
        user_id=item["user_id"],
        name=item["name"],
        dosage=item.get("dosage", ""),
        frequency=item.get("frequency", ""),
        timing=item.get("timing", []),
        with_food=item.get("with_food", ""),
        plain_language_explanation=item.get("plain_language_explanation", ""),
        why_timing_matters=item.get("why_timing_matters", ""),
        warnings=item.get("warnings", []),
        source=item.get("source", "manual"),
        created_at=item["created_at"],
        updated_at=item["updated_at"],
    )


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("", response_model=list[Medication])
async def list_medications(current_user: UserPublic = Depends(get_current_user)):
    """Return all medications for the authenticated user."""
    table = get_medications_table()
    resp = table.query(
        KeyConditionExpression=Key("user_id").eq(current_user.user_id)
    )
    return [_item_to_medication(i) for i in resp.get("Items", [])]


@router.post("", response_model=Medication, status_code=status.HTTP_201_CREATED)
async def add_medication(
    body: MedicationCreate,
    current_user: UserPublic = Depends(get_current_user),
):
    """Add a new medication to the user's list."""
    table = get_medications_table()
    now = datetime.now(timezone.utc).isoformat()
    med_id = str(uuid.uuid4())

    item = {
        "user_id": current_user.user_id,
        "medication_id": med_id,
        **body.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    table.put_item(Item=item)
    return _item_to_medication(item)


@router.get("/{medication_id}", response_model=Medication)
async def get_medication(
    medication_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """Get a single medication by ID."""
    table = get_medications_table()
    resp = table.get_item(
        Key={"user_id": current_user.user_id, "medication_id": medication_id}
    )
    item = resp.get("Item")
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    return _item_to_medication(item)


@router.put("/{medication_id}", response_model=Medication)
async def update_medication(
    medication_id: str,
    body: MedicationUpdate,
    current_user: UserPublic = Depends(get_current_user),
):
    """Partially update a medication (only provided fields are changed)."""
    table = get_medications_table()

    # Verify it exists first
    resp = table.get_item(
        Key={"user_id": current_user.user_id, "medication_id": medication_id}
    )
    if not resp.get("Item"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")

    now = datetime.now(timezone.utc).isoformat()
    updates = body.model_dump(exclude_none=True)
    updates["updated_at"] = now

    update_parts = [f"#{k} = :{k}" for k in updates]
    expr_names = {f"#{k}": k for k in updates}
    expr_values = {f":{k}": v for k, v in updates.items()}

    result = table.update_item(
        Key={"user_id": current_user.user_id, "medication_id": medication_id},
        UpdateExpression="SET " + ", ".join(update_parts),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
        ReturnValues="ALL_NEW",
    )
    return _item_to_medication(result["Attributes"])


@router.delete("/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medication(
    medication_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """Delete a medication from the user's list."""
    table = get_medications_table()
    table.delete_item(
        Key={"user_id": current_user.user_id, "medication_id": medication_id}
    )


@router.post("/batch", response_model=list[Medication], status_code=status.HTTP_201_CREATED)
async def add_medications_batch(
    medications: list[MedicationCreate],
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Add multiple medications at once (e.g. after a prescription scan).
    Returns the list of newly created medications.
    """
    table = get_medications_table()
    now = datetime.now(timezone.utc).isoformat()
    created: list[Medication] = []

    with table.batch_writer() as batch:
        for med in medications:
            med_id = str(uuid.uuid4())
            item = {
                "user_id": current_user.user_id,
                "medication_id": med_id,
                **med.model_dump(),
                "created_at": now,
                "updated_at": now,
            }
            batch.put_item(Item=item)
            created.append(_item_to_medication(item))

    return created
