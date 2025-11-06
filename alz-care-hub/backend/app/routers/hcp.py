from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Alert as AlertModel,
    AppointmentType,
    PatientProfile,
    RiskState as RiskStateModel,
    Role,
    TaskOwner,
    User,
)
from ..schemas import Alert, RiskState, TriageItem


router = APIRouter(prefix="/api/hcp", tags=["hcp"])


def _compute_adherence(patient: PatientProfile) -> float:
    total = 0
    taken = 0
    for med in patient.medications:
        total += len(med.adherence_logs)
        taken += sum(1 for log in med.adherence_logs if log.status == "taken")
    if total == 0:
        return 1.0
    return taken / total


def _calc_risk(patient: PatientProfile) -> RiskStateModel:
    today = date.today()
    score = 0
    reasons: list[str] = []

    if patient.diagnosis_date:
        days_since = (today - patient.diagnosis_date).days
        if days_since > 120:
            score += 3
            reasons.append("Confirmatory test >120 days")

    insurance_tasks = [
        task
        for task in patient.tasks
        if (task.linked_milestone or "").lower().startswith("insurance")
    ]
    if any(task.status != "completed" for task in insurance_tasks):
        score += 2
        reasons.append("Insurance stage pending")

    adherence_ratio = _compute_adherence(patient)
    if adherence_ratio < 0.8:
        score += 1
        reasons.append(f"Adherence {round(adherence_ratio*100)}% < 80%")

    has_mri = any(
        appt
        for appt in patient.appointments
        if appt.type == AppointmentType.MRI and appt.date_time >= datetime.now()
    )
    if not has_mri:
        score += 2
        reasons.append("MRI not scheduled")

    infusion_sites = [
        appt.site
        for appt in patient.appointments
        if appt.site and appt.site.type.value == "infusion"
    ]
    for site in infusion_sites:
        if site and site.demand >= site.capacity:
            score += 2
            reasons.append(f"Site {site.name} over capacity")
            break

    if score >= 7:
        band = "red"
    elif score >= 4:
        band = "amber"
    else:
        band = "green"

    return RiskStateModel(
        patient_id=patient.id,
        score=score,
        band=band,
        reasons=reasons,
    )


def _triage_actions(risk: RiskStateModel) -> list[str]:
    actions: list[str] = []
    for reason in risk.reasons:
        if "Insurance" in reason:
            actions.append("Escalate insurance follow-up")
        if "MRI" in reason:
            actions.append("Schedule MRI slot")
        if "capacity" in reason:
            actions.append("Reassign to alternate infusion center")
        if "Adherence" in reason:
            actions.append("Call caregiver for adherence coaching")
    if not actions:
        actions.append("Review patient status")
    return actions


@router.get("/{hcp_id}/triage", response_model=list[TriageItem])
def get_triage_queue(
    hcp_id: int,
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
):
    hcp = db.query(User).filter(User.id == hcp_id).first()
    if not hcp or hcp.role != Role.HCP:
        raise HTTPException(status_code=404, detail="HCP not found")

    patients = db.query(PatientProfile).filter(PatientProfile.hcp_id == hcp_id).all()
    triage_items: list[TriageItem] = []
    for patient in patients:
        computed_risk = _calc_risk(patient)
        next_milestone = next(
            (
                task.linked_milestone
                for task in patient.tasks
                if task.owner == TaskOwner.HCP and task.status != "completed"
            ),
            "None",
        )
        latest_risk = (
            patient.risk_states[-1] if patient.risk_states else None
        )
        risk_id = latest_risk.id if latest_risk else 0
        triage_items.append(
            TriageItem(
                patient_id=patient.id,
                patient_name=patient.patient.name,
                risk=RiskState(
                    id=risk_id,
                    score=computed_risk.score,
                    band=computed_risk.band,
                    reasons=computed_risk.reasons,
                    last_eval_at=datetime.now(),
                ),
                next_milestone=next_milestone,
                action_recommendations=_triage_actions(computed_risk),
            )
        )

    triage_items.sort(key=lambda item: item.risk.score, reverse=True)
    return triage_items[:limit]


@router.get("/{hcp_id}/alerts", response_model=list[Alert])
def hcp_alerts(hcp_id: int, db: Session = Depends(get_db)):
    hcp = db.query(User).filter(User.id == hcp_id).first()
    if not hcp or hcp.role != Role.HCP:
        raise HTTPException(status_code=404, detail="HCP not found")

    alerts = (
        db.query(AlertModel)
        .filter(AlertModel.who == Role.HCP)
        .order_by(AlertModel.created_at.desc())
        .limit(20)
        .all()
    )
    return [Alert.from_orm(alert) for alert in alerts]
