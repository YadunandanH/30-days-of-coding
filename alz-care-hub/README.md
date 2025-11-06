# Alzheimer's Care Hub

An accessible hackathon-ready web application that keeps patients, caregivers, and healthcare providers aligned on medications, appointments, safety, and territory operations for Alzheimer’s care.

## Project Structure

- `backend/` – FastAPI + SQLite service layer exposing role-based APIs, triage logic, alerts, and chat endpoints.
- `frontend/` – Vite + React PWA-style interface with enlarged controls, voice prompts, memory games, maps, and chat assistant.

## Prerequisites

- Python 3.12+
- Node.js 18+
- npm (comes with Node)

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs on `http://localhost:8000`. Interactive docs are available at `http://localhost:8000/docs`.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs on `http://localhost:5173` (Vite default) and proxies API calls to the backend via the `VITE_API_BASE_URL` environment variable (defaults to `http://localhost:8000`).

## Environment Variables

- Copy `frontend/.env.example` to `frontend/.env` to customize `VITE_API_BASE_URL` if your backend runs elsewhere.

## Database

- SQLite file (`/workspace/alz-care-hub/backend/app/data/alz_care.db`) is created automatically on first launch with rich seed data (patients, caregivers, meds, tasks, sites, alerts).

## Key Features

- Role-focused dashboards (patient, caregiver, HCP, HCO admin)
- Medication reminders, adherence logging, and vitals check-ins
- SOS workflow with call chain simulation and live location link placeholder
- Guide Me Home map with geofencing preview
- Memory exercises with streak tracking
- Risk scoring, triage queues, territory capacity view, and analytics KPIs
- Voice prompts (Web Speech API) and in-app chat assistant backed by rule-based responses
- Responsive, high-contrast UI with oversized action buttons and multilingual stubs

## Testing & Quality

- Run `npm run lint` (frontend) and `pytest` (if tests are added) from the backend.
- Manual QA: verify patient flows, SOS triggers, chat assistant, and territory dashboard.

## Packaging for Demo

- Backend: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Frontend: `npm run build` then `npm run preview`

## License

MIT License (or customize as needed).
