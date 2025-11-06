from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Alert as AlertModel,
    PatientProfile,
    Role,
    Task as TaskModel,
    TaskOwner,
    User,
)
from ..schemas import Alert, CaregiverDashboard, Task


router = APIRouter(prefix="/api/caregiver", tags=["caregivers"])


@router.get("/{caregiver_id}/dashboard", response_model=CaregiverDashboard)
def caregiver_dashboard(caregiver_id: int, db: Session = Depends(get_db)):
    caregiver: User | None = db.query(User).filter(User.id == caregiver_id).first()
    if not caregiver or caregiver.role != Role.CAREGIVER:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    patients = (
        db.query(PatientProfile)
        .join(PatientProfile.caregivers)
        .filter(User.id == caregiver_id)
        .all()
    )

    patient_cards: list[dict[str, object]] = []
    for patient in patients:
        adherence = 0
        total = 0
        for med in patient.medications:
            total += len(med.adherence_logs)
            adherence += sum(1 for log in med.adherence_logs if log.status == "taken")
        adherence_pct = round((adherence / total) * 100, 1) if total else 100.0
        upcoming_appt = next(
            (
                appt
                for appt in sorted(patient.appointments, key=lambda a: a.date_time)
                if appt.date_time >= datetime.now()
            ),
            None,
        )
        patient_cards.append(
            {
                "patient_id": patient.id,
                "patient_name": patient.patient.name,
                "adherence_percent": adherence_pct,
                "last_checkin": patient.checkins[0].mood_emoji if patient.checkins else None,
                "upcoming_appointment": upcoming_appt.date_time if upcoming_appt else None,
            }
        )

    alerts = (
        db.query(AlertModel)
        .filter(AlertModel.who == Role.CAREGIVER)
        .order_by(AlertModel.created_at.desc())
        .limit(10)
        .all()
    )

    tasks = (
        db.query(TaskModel)
        .join(TaskModel.patient)
        .join(PatientProfile.caregivers)
        .filter(TaskModel.owner == TaskOwner.CAREGIVER, User.id == caregiver_id)
        .order_by(TaskModel.due_date)
        .all()
    )

    return CaregiverDashboard(
        caregiver_id=caregiver.id,
        caregiver_name=caregiver.name,
        patients=patient_cards,
        alerts=[Alert.from_orm(alert) for alert in alerts],
        shared_tasks=[Task.from_orm(task) for task in tasks],
    )


@router.get("/{caregiver_id}/alerts", response_model=list[Alert])
def caregiver_alerts(caregiver_id: int, db: Session = Depends(get_db)):
    caregiver = db.query(User).filter(User.id == caregiver_id).first()
    if not caregiver or caregiver.role != Role.CAREGIVER:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    alerts = (
        db.query(AlertModel)
        .filter(AlertModel.who == Role.CAREGIVER)
        .order_by(AlertModel.created_at.desc())
        .limit(20)
        .all()
    )
    return [Alert.from_orm(alert) for alert in alerts]
