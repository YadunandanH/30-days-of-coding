from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Role
from ..schemas import ChatRequest, ChatResponse


router = APIRouter(prefix="/api", tags=["assistants"])


SUGGESTIONS = {
    Role.PATIENT: [
        "Log a mood check",
        "Play a memory exercise",
        "Call my caregiver",
    ],
    Role.CAREGIVER: [
        "View today's alerts",
        "Check medication adherence",
        "Assign a new task",
    ],
    Role.HCP: [
        "Open triage board",
        "Review MRI schedule",
        "Message caregiver",
    ],
    Role.HCO_ADMIN: [
        "See capacity hotspots",
        "Download KPI report",
        "Review incident log",
    ],
}


def _respond_patient(message: str) -> str:
    lowered = message.lower()
    if "med" in lowered:
        return "Your next medication is scheduled at 8:00 AM. Press the green button when you've taken it."
    if "home" in lowered:
        return "Tap Guide Me Home for turn-by-turn directions and a one-touch caregiver call."
    if "mood" in lowered:
        return "To log your mood, choose an emoji on the Home screen and speak a short note if you like."
    return "I'm here to help with medications, appointments, safety, or memory games. What would you like to do?"


def _respond_caregiver(message: str) -> str:
    lowered = message.lower()
    if "alert" in lowered:
        return "Opening today's alert feed — missed meds and geofence status are highlighted."
    if "task" in lowered:
        return "You can assign a new task from the shared board. Tap the plus button to add chores or reminders."
    if "location" in lowered:
        return "Live GPS pings every 5 minutes when the patient is outside safe zones. You'll get a link via SMS."
    return "Need adherence stats, schedule reminders, or set safe zones? I'm ready."


def _respond_hcp(message: str) -> str:
    lowered = message.lower()
    if "triage" in lowered or "risk" in lowered:
        return "The triage queue sorts patients by risk score, with overdue milestones in the right column."
    if "mri" in lowered:
        return "You can book or adjust MRI slots directly from the triage table via the 'Schedule MRI' quick action."
    if "insurance" in lowered:
        return "Insurance tasks show status and due dates. Add notes so caregivers stay in sync."
    return "I'm ready with risk scores, milestones, and quick actions."


def _respond_admin(message: str) -> str:
    lowered = message.lower()
    if "capacity" in lowered or "bottleneck" in lowered:
        return "Capacity alerts trigger at 85% utilization. Review the alternate site suggestions to rebalance load."
    if "report" in lowered:
        return "Download the KPI report as CSV from the Reporting hub — it contains adherence, risk, and wait time trends."
    return "Monitoring utilization, incidents, and region KPIs. Let me know what you'd like to review."


@router.post("/chat", response_model=ChatResponse)
def chat_assistant(payload: ChatRequest, db: Session = Depends(get_db)):
    reply = ""
    if payload.role == Role.PATIENT:
        reply = _respond_patient(payload.message)
    elif payload.role == Role.CAREGIVER:
        reply = _respond_caregiver(payload.message)
    elif payload.role == Role.HCP:
        reply = _respond_hcp(payload.message)
    else:
        reply = _respond_admin(payload.message)

    return ChatResponse(
        reply=reply,
        suggestions=SUGGESTIONS.get(payload.role, []),
    )
