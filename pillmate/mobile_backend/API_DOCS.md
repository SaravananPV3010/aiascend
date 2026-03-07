# PillMate Mobile — API Reference

Base URL (local dev): `http://localhost:8080`  
Interactive docs: `http://localhost:8080/docs`

---

## Authentication

All endpoints except those marked **public** require a Bearer JWT token.

```
Authorization: Bearer <access_token>
```

Obtain a token from `POST /auth/register` or `POST /auth/login`.

Tokens expire after **24 hours** (configurable via `JWT_EXPIRE_MINUTES`).

---

## Error Format

All errors return a consistent JSON body:

```json
{
  "detail": "Human-readable error message"
}
```

| HTTP Code | Meaning |
|-----------|---------|
| `400` | Bad request / validation error |
| `401` | Missing or invalid JWT |
| `404` | Resource not found |
| `409` | Conflict (e.g. email already registered) |
| `422` | Unprocessable entity (schema mismatch) |
| `500` | Server configuration error |
| `502` | Upstream API error (Gemini / FDA) |

---

## Health

### `GET /` · `GET /health` — public

Check that the server is running.

**Response `200`**
```json
{ "status": "ok", "app": "PillMate Mobile API", "version": "1.0.0" }
```

---

## Auth — `/auth`

### `POST /auth/register` — public

Create a new account with email and password.

**Request body**
```json
{
  "email": "ada@example.com",
  "password": "secret123",
  "display_name": "Ada Lovelace"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `email` | string | Valid email |
| `password` | string | Min 6 characters |
| `display_name` | string | Min 1 character |

**Response `201`**
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "token_type": "bearer",
  "user": {
    "user_id": "b4e2f1a0-...",
    "email": "ada@example.com",
    "display_name": "Ada Lovelace",
    "photo_url": null,
    "created_at": "2026-03-07T10:00:00+00:00"
  }
}
```

**Error `409`** — email already registered.

---

### `POST /auth/login` — public

Login with email and password.

**Request body**
```json
{
  "email": "ada@example.com",
  "password": "secret123"
}
```

**Response `200`** — same shape as `/auth/register`.

**Error `401`** — invalid credentials.

---

### `GET /auth/me` — 🔒 auth required

Return the authenticated user's profile.

**Response `200`**
```json
{
  "user_id": "b4e2f1a0-...",
  "email": "ada@example.com",
  "display_name": "Ada Lovelace",
  "photo_url": "https://example.com/photo.jpg",
  "created_at": "2026-03-07T10:00:00+00:00"
}
```

---

### `PUT /auth/me` — 🔒 auth required

Update display name or photo URL. Pass only the fields you want to change as query params.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `display_name` | string (optional) | New display name |
| `photo_url` | string (optional) | New photo URL |

**Example**
```
PUT /auth/me?display_name=Ada%20King
```

**Response `200`** — updated user object (same shape as `GET /auth/me`).

---

## Prescription Analysis — `/analyze`

### `POST /analyze` — 🔒 auth required

Send a base64-encoded prescription image to Gemini AI and get back all detected medications.

**Query params**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `save` | bool | `false` | If `true`, the result is persisted to DynamoDB |

**Request body**
```json
{
  "image_base64": "<raw base64 string, no data-URI prefix>"
}
```

**Response `200`**
```json
{
  "detected_language": "en",
  "detected_language_name": "English",
  "medications": [
    {
      "name_english": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "Twice daily",
      "dicription": "Antibiotic used to treat bacterial infections including chest, dental and urinary tract infections.",
      "megication_importance": "Patient must complete the full course to prevent antibiotic resistance.",
      "timing": ["morning", "night"],
      "with_food": "after food"
    }
  ]
}
```

> Prescriptions in any language are automatically detected and translated to English.

**Error `422`** — Gemini response could not be parsed as JSON.  
**Error `502`** — Gemini API unreachable or returned an error.

---

### `GET /analyze/history` — 🔒 auth required

Return all prescriptions the user has saved (requires `?save=true` at scan time).

**Response `200`**
```json
[
  {
    "prescription_id": "c9d3e2b1-...",
    "user_id": "b4e2f1a0-...",
    "analysis": { "detected_language": "hi", "detected_language_name": "Hindi", "medications": [ ... ] },
    "image_key": "",
    "created_at": "2026-03-07T11:30:00+00:00"
  }
]
```

---

### `DELETE /analyze/history/{prescription_id}` — 🔒 auth required

Delete a saved prescription.

**Path param:** `prescription_id` — UUID of the prescription.

**Response `204`** — No content.

---

## Medications — `/medications`

### `GET /medications` — 🔒 auth required

Return all medications in the user's list.

**Response `200`**
```json
[
  {
    "medication_id": "a1b2c3d4-...",
    "user_id": "b4e2f1a0-...",
    "name": "Amoxicillin",
    "dosage": "500mg",
    "frequency": "Twice daily",
    "timing": ["morning", "night"],
    "with_food": "after food",
    "plain_language_explanation": "An antibiotic that fights bacterial infections.",
    "why_timing_matters": "Consistent spacing keeps drug levels stable in the blood.",
    "warnings": ["Complete the full course"],
    "source": "prescription",
    "created_at": "2026-03-07T11:30:00+00:00",
    "updated_at": "2026-03-07T11:30:00+00:00"
  }
]
```

---

### `POST /medications` — 🔒 auth required

Manually add a single medication.

**Request body**
```json
{
  "name": "Metformin",
  "dosage": "500mg",
  "frequency": "Once daily",
  "timing": ["morning"],
  "with_food": "with food",
  "plain_language_explanation": "Controls blood sugar levels in type 2 diabetes.",
  "why_timing_matters": "Taking with food reduces stomach upset.",
  "warnings": ["Monitor blood sugar regularly"],
  "source": "manual"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | ✅ | |
| `dosage` | string | ✅ | |
| `frequency` | string | ✅ | |
| `timing` | array | — | Values: `"morning"`, `"afternoon"`, `"night"` |
| `with_food` | string | — | `"before food"` \| `"after food"` \| `"with food"` \| `""` |
| `plain_language_explanation` | string | — | |
| `why_timing_matters` | string | — | |
| `warnings` | string[] | — | |
| `source` | string | — | `"manual"` (default) \| `"prescription"` |

**Response `201`** — the created medication object (same shape as list item above).

---

### `POST /medications/batch` — 🔒 auth required

Add multiple medications at once — useful after saving a scanned prescription.

**Request body** — array of medication objects (same fields as `POST /medications`):
```json
[
  { "name": "Amoxicillin", "dosage": "500mg", "frequency": "Twice daily", ... },
  { "name": "Ibuprofen",   "dosage": "400mg", "frequency": "Three times daily", ... }
]
```

**Response `201`** — array of created medication objects.

---

### `GET /medications/{medication_id}` — 🔒 auth required

Get a single medication by ID.

**Response `200`** — medication object.  
**Error `404`** — medication not found.

---

### `PUT /medications/{medication_id}` — 🔒 auth required

Partially update a medication. Only the fields you include are changed.

**Request body** — any subset of medication fields:
```json
{
  "dosage": "1000mg",
  "timing": ["morning", "afternoon", "night"]
}
```

**Response `200`** — updated medication object.  
**Error `404`** — medication not found.

---

### `DELETE /medications/{medication_id}` — 🔒 auth required

Remove a medication from the user's list.

**Response `204`** — No content.

---

## Drugs — `/drugs`

### `GET /drugs/search` — 🔒 auth required

Search the FDA NDC database for drug name autocomplete suggestions.

**Query params**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | ✅ | Search term (min 2 chars) |
| `limit` | int | — | Max results (1–25, default `10`) |

**Example**
```
GET /drugs/search?q=amox&limit=5
```

**Response `200`**
```json
[
  { "name": "AMOXICILLIN", "type": "Generic", "generic": null },
  { "name": "AMOXIL",      "type": "Brand",   "generic": "AMOXICILLIN" }
]
```

---

### `GET /drugs/label/{drug_name}` — 🔒 auth required

Fetch the full FDA drug label (warnings, dosage, indications, contraindications, adverse reactions).

**Path param:** `drug_name` — brand or generic name (e.g. `Amoxicillin`).

**Response `200`**
```json
{
  "brand_name": ["AMOXIL"],
  "generic_name": ["AMOXICILLIN"],
  "indications_and_usage": ["AMOXIL is indicated for the treatment of ..."],
  "dosage_and_administration": ["Adults: 250mg every 8 hours ..."],
  "warnings": ["Serious and occasionally fatal hypersensitivity ..."],
  "contraindications": ["A history of allergic reaction to any penicillin ..."],
  "adverse_reactions": ["The following adverse reactions have been reported ..."]
}
```

**Error `404`** — drug label not found in FDA database.

---

### `POST /drugs/contraindications` — 🔒 auth required

Use Gemini AI to check for interactions between a new drug and a user's current medications.

**Request body**
```json
{
  "medication_name": "Warfarin",
  "current_medications": ["Aspirin", "Metformin", "Lisinopril"]
}
```

**Response `200`**
```json
{
  "medication": "Warfarin",
  "has_contraindications": true,
  "warnings": [
    "Warfarin + Aspirin: increased bleeding risk",
    "Warfarin + Lisinopril: may enhance anticoagulant effect"
  ],
  "recommendations": "Consult your doctor before starting Warfarin. Close INR monitoring is required, especially when combined with Aspirin."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `has_contraindications` | bool | `true` if any moderate/major interactions found |
| `warnings` | string[] | Short descriptions of each interaction |
| `recommendations` | string | 1–2 sentence clinical recommendation |

---

## DynamoDB Table Schema

### `pillmate_users`
| Attribute | Type | Key |
|-----------|------|-----|
| `user_id` | String | PK |
| `email` | String | GSI PK (`email-index`) |
| `display_name` | String | |
| `password_hash` | String | |
| `photo_url` | String \| null | |
| `created_at` | String (ISO 8601) | |
| `updated_at` | String (ISO 8601) | |

### `pillmate_medications`
| Attribute | Type | Key |
|-----------|------|-----|
| `user_id` | String | PK |
| `medication_id` | String | SK |
| `name`, `dosage`, `frequency`, … | String / List | |
| `created_at` / `updated_at` | String (ISO 8601) | |

### `pillmate_prescriptions`
| Attribute | Type | Key |
|-----------|------|-----|
| `user_id` | String | PK |
| `prescription_id` | String | SK |
| `analysis` | Map (nested JSON) | |
| `created_at` | String (ISO 8601) | |
