# Document Ingestion API — Build Checklist

## Phase 1: Project Setup
- [x] Create project folder structure (`app/`, `routes/`, `models/`, `db/`)
- [x] Set up virtual environment
- [x] Install dependencies (`fastapi`, `uvicorn`, `pymongo`, `slowapi`, `python-dotenv`)
- [x] Create `.env` file for MongoDB URI and API keys
- [x] Create `main.py` entry point and verify server runs

---

## Phase 2: Database Layer
- [x] Connect to MongoDB using environment variable (not hardcoded)
- [x] Write `save_document` function
- [x] Write `get_document` function
- [x] Write `list_documents` function
- [x] Write `delete_document` function
- [x] Include `embedding: null` placeholder field on every document

---

## Phase 3: Pydantic Schemas
- [x] Create request schema for document creation (with field length constraints)
- [x] Create response schema for a single document
- [x] Create response schema for document list
- [x] Create a consistent error response schema

---

## Phase 4: API Routes
- [x] `POST /api/v1/documents` — create document
- [x] `GET /api/v1/documents` — list all (with pagination: `skip` and `limit`)
- [x] `GET /api/v1/documents/{id}` — fetch one
- [x] `DELETE /api/v1/documents/{id}` — delete one
- [x] `GET /api/v1/health` — health check endpoint

---

## Phase 5: Rate Limiting
- [x] Manually implement a basic fixed window rate limiter and test it
- [x] Swap it out with `slowapi`
- [x] Apply stricter limit on `POST` than `GET`
- [x] Return proper `429` response when limit exceeded

---

## Phase 6: Validation & Error Handling
- [x] Add field constraints to all Pydantic schemas
- [x] Handle document-not-found with `404`
- [x] Handle MongoDB connection failure gracefully at startup
- [x] Make sure all errors return consistent JSON shape




