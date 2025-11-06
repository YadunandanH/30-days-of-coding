from __future__ import annotations

from datetime import date, datetime, time
from typing import Any

from pydantic import BaseModel

from .models import AppointmentType, Role, SiteType, TaskOwner


class VoicePrompt(BaseModel):
    id: int
    message: str
    language: str
    use_case: str

    class Config:
        orm_mode = True


class MedicationLog(BaseModel):
    id: int
    taken_at: datetime
    status: str
    reason: str | None = None

    class Config:
        orm_mode = True


class MedicationLogCreate(BaseModel):
    status: str = "taken"
    reason: str | None = None


class Medication(BaseModel):
    id: int
    drug: str
    dose: str
    schedule: str
    pill_image: str | None = None
    adherence_logs: list[MedicationLog] = []

    class Config:
        orm_mode = True


class Appointment(BaseModel):
    id: int
    type: AppointmentType
    date_time: datetime
    status: str
    site_name: str | None = None
    site_id: int | None = None

    class Config:
        orm_mode = True


class CheckIn(BaseModel):
    id: int
    date: date
    time_of_day: time
    mood_emoji: str
    vitals: dict[str, Any] | None = None
    notes: str | None = None

    class Config:
        orm_mode = True


class CheckInCreate(BaseModel):
    mood_emoji: str
    vitals: dict[str, Any] | None = None
    notes: str | None = None


class Task(BaseModel):
    id: int
    title: str
    owner: TaskOwner
    due_date: date | None = None
    status: str
    linked_milestone: str | None = None

    class Config:
        orm_mode = True


class TaskStatusUpdate(BaseModel):
    status: str


class RiskState(BaseModel):
    id: int
    score: int
    band: str
    reasons: list[str]
    last_eval_at: datetime

    class Config:
        orm_mode = True


class Site(BaseModel):
    id: int
    name: str
    type: SiteType
    latitude: float
    longitude: float
    capacity: int
    demand: int
    wait_time: int

    class Config:
        orm_mode = True


class Alert(BaseModel):
    id: int
    who: Role
    type: str
    payload: dict[str, Any]
    delivered_via: list[str]
    ack_status: str
    created_at: datetime

    class Config:
        orm_mode = True


class MemoryExercise(BaseModel):
    id: int
    title: str
    description: str
    difficulty: str
    streak: int

    class Config:
        orm_mode = True


class PatientHomePayload(BaseModel):
    patient_id: int
    patient_name: str
    next_medication: Medication | None = None
    next_appointment: Appointment | None = None
    mood_prompt: str
    voice_prompts: list[VoicePrompt]
    safety_quick_actions: list[dict[str, str]]


class SafetyPayload(BaseModel):
    patient_id: int
    sos_contact_chain: list[dict[str, str]]
    guide_me_home_url: str
    last_known_location: dict[str, float]
    safe_zones: list["SafeZone"]


class SafeZone(BaseModel):
    label: str
    lat: float
    lng: float
    radius_km: float


class CaregiverDashboard(BaseModel):
    caregiver_id: int
    caregiver_name: str
    patients: list[dict[str, Any]]
    alerts: list[Alert]
    shared_tasks: list[Task]


class TriageItem(BaseModel):
    patient_id: int
    patient_name: str
    risk: RiskState
    next_milestone: str | None = None
    action_recommendations: list[str]


class TerritorySnapshot(BaseModel):
    sites: list[Site]
    regional_summary: dict[str, Any]
    bottlenecks: list[str]


class KpiReport(BaseModel):
    filters: dict[str, Any]
    kpis: dict[str, Any]
    export_url: str


class ChatRequest(BaseModel):
    role: Role
    message: str


class ChatResponse(BaseModel):
    reply: str
    suggestions: list[str]


class SosRequest(BaseModel):
    patient_id: int
    location: dict[str, float]


class SosResponse(BaseModel):
    message: str
    notified_contacts: list[str]


SafetyPayload.update_forward_refs()
