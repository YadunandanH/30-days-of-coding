from __future__ import annotations

from datetime import datetime, time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    CheckIn as CheckInModel,
    Medication as MedicationModel,
    MedicationLog as MedicationLogModel,
    MemoryExercise as MemoryExerciseModel,
    PatientProfile,
    RiskState as RiskStateModel,
    Task as TaskModel,
    VoicePrompt as VoicePromptModel,
)
from ..schemas import (
    CheckIn,
    CheckInCreate,
    Medication,
    MedicationLogCreate,
    MemoryExercise,
    Appointment as AppointmentSchema,
    PatientHomePayload,
    SafeZone,
    RiskState,
    SafetyPayload,
    Task,
    TaskStatusUpdate,
    VoicePrompt,
)


router = APIRouter(prefix="/api/patient", tags=["patients"])


def _parse_schedule(schedule: str) -> time:
    try:
        hour, minute = schedule.split(":")
        return time(hour=int(hour), minute=int(minute))
    except ValueError as exc:
        raise ValueError(f"Invalid schedule format: {schedule}") from exc


def _get_next_medication(patient: PatientProfile) -> MedicationModel | None:
    now_time = datetime.now().time()
    medications = sorted(
        patient.medications,
        key=lambda m: _parse_schedule(m.schedule),
    )
    for med in medications:
        if _parse_schedule(med.schedule) >= now_time:
            return med
    return medications[0] if medications else None


def _get_next_appointment(patient: PatientProfile):
    upcoming = [
        appt
        for appt in patient.appointments
        if appt.date_time >= datetime.now()
    ]
    if not upcoming:
        return None
    upcoming.sort(key=lambda a: a.date_time)
    return upcoming[0]


@router.get("/{patient_id}/home", response_model=PatientHomePayload)
def get_patient_home(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    next_med = _get_next_medication(patient)
    next_appt = _get_next_appointment(patient)

    voice_prompts_models = (
        db.query(VoicePromptModel)
        .filter(
            (VoicePromptModel.patient_id == patient_id)
            | (VoicePromptModel.patient_id.is_(None))
        )
        .all()
    )
    voice_prompts = [VoicePrompt.from_orm(item) for item in voice_prompts_models]

    next_med_schema = Medication.from_orm(next_med) if next_med else None
    next_appt_schema: AppointmentSchema | None = None
    if next_appt:
        next_appt_schema = AppointmentSchema.from_orm(next_appt)
        next_appt_schema.site_name = next_appt.site.name if next_appt.site else None
        next_appt_schema.site_id = next_appt.site_id

    safety_quick_actions = [
        {"label": "SOS", "action": "sos"},
        {"label": "Guide Me Home", "action": "guide"},
        {"label": "Call Caregiver", "action": "call_primary"},
    ]

    return PatientHomePayload(
        patient_id=patient.id,
        patient_name=patient.patient.name,
        next_medication=next_med_schema,
        next_appointment=next_appt_schema,
        mood_prompt="How are you feeling today? Tap an emoji to check in.",
        voice_prompts=voice_prompts,
        safety_quick_actions=safety_quick_actions,
    )


@router.get("/{patient_id}/safety", response_model=SafetyPayload)
def get_patient_safety(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    caregivers = [
        {"name": caregiver.name, "phone": caregiver.phone}
        for caregiver in patient.caregivers
    ]
    hcp_contact = (
        {"name": patient.hcp.name, "phone": patient.hcp.phone}
        if patient.hcp
        else None
    )

    sos_chain = caregivers.copy()
    if hcp_contact:
        sos_chain.append(hcp_contact)

    safe_zone_models = [
        SafeZone(
            label=zone.get("label", "Safe zone"),
            lat=zone.get("lat", 0.0),
            lng=zone.get("lng", 0.0),
            radius_km=zone.get("radius_km", 0.5),
        )
        for zone in patient.safe_zones
    ]

    return SafetyPayload(
        patient_id=patient.id,
        sos_contact_chain=sos_chain,
        guide_me_home_url="https://www.google.com/maps/dir/?api=1&destination=12.9716,77.5946",
        last_known_location={"lat": 12.9716, "lng": 77.5946},
        safe_zones=safe_zone_models,
    )


@router.get("/{patient_id}/medications", response_model=list[Medication])
def list_medications(patient_id: int, db: Session = Depends(get_db)):
    meds = (
        db.query(MedicationModel)
        .filter(MedicationModel.patient_id == patient_id)
        .order_by(MedicationModel.schedule)
        .all()
    )
    return meds


@router.post("/{patient_id}/medications/{medication_id}/log", response_model=Medication)
def log_medication_event(
    patient_id: int,
    medication_id: int,
    payload: MedicationLogCreate,
    db: Session = Depends(get_db),
):
    medication: MedicationModel | None = (
        db.query(MedicationModel)
        .filter(
            MedicationModel.id == medication_id,
            MedicationModel.patient_id == patient_id,
        )
        .first()
    )
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")

    log_entry = MedicationLogModel(
        medication_id=medication_id,
        status=payload.status,
        reason=payload.reason,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(medication)
    return medication


@router.get("/{patient_id}/checkins", response_model=list[CheckIn])
def list_checkins(patient_id: int, db: Session = Depends(get_db)):
    checkins = (
        db.query(CheckInModel)
        .filter(CheckInModel.patient_id == patient_id)
        .order_by(CheckInModel.date.desc())
        .limit(30)
        .all()
    )
    return checkins


@router.post("/{patient_id}/checkins", response_model=CheckIn)
def create_checkin(
    patient_id: int,
    payload: CheckInCreate,
    db: Session = Depends(get_db),
):
    patient = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    checkin = CheckInModel(
        patient_id=patient_id,
        mood_emoji=payload.mood_emoji,
        vitals=payload.vitals or {},
        notes=payload.notes,
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return checkin


@router.get("/{patient_id}/tasks", response_model=list[Task])
def list_tasks(patient_id: int, db: Session = Depends(get_db)):
    tasks = (
        db.query(TaskModel)
        .filter(TaskModel.patient_id == patient_id)
        .order_by(TaskModel.due_date)
        .all()
    )
    return tasks


@router.patch("/{patient_id}/tasks/{task_id}", response_model=Task)
def update_task_status(
    patient_id: int,
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
):
    task = (
        db.query(TaskModel)
        .filter(TaskModel.id == task_id, TaskModel.patient_id == patient_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = payload.status
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{patient_id}/risk", response_model=RiskState)
def get_risk_state(patient_id: int, db: Session = Depends(get_db)):
    risk = (
        db.query(RiskStateModel)
        .filter(RiskStateModel.patient_id == patient_id)
        .order_by(RiskStateModel.last_eval_at.desc())
        .first()
    )
    if not risk:
        raise HTTPException(status_code=404, detail="Risk state not found")
    return risk


@router.get("/{patient_id}/memory-exercises", response_model=list[MemoryExercise])
def list_memory_exercises(patient_id: int, db: Session = Depends(get_db)):
    exercises = (
        db.query(MemoryExerciseModel)
        .filter(
            (MemoryExerciseModel.patient_id == patient_id)
            | (MemoryExerciseModel.patient_id.is_(None))
        )
        .all()
    )
    return exercises
