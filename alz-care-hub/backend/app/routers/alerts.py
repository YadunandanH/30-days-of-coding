from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Alert, PatientProfile, Role
from ..schemas import SosRequest, SosResponse


router = APIRouter(prefix="/api", tags=["alerts"])


@router.post("/sos", response_model=SosResponse)
def trigger_sos(payload: SosRequest, db: Session = Depends(get_db)):
    patient = (
        db.query(PatientProfile)
        .filter(PatientProfile.id == payload.patient_id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    contacts = [
        caregiver.phone
        for caregiver in patient.caregivers
        if caregiver.phone
    ]
    if patient.hcp and patient.hcp.phone:
        contacts.append(patient.hcp.phone)

    alert = Alert(
        who=Role.CAREGIVER,
        type="sos_triggered",
        payload={
            "patient": patient.patient.name,
            "lat": payload.location.get("lat"),
            "lng": payload.location.get("lng"),
            "timestamp": datetime.utcnow().isoformat(),
        },
        delivered_via=["sms", "voice"],
        ack_status="pending",
    )
    db.add(alert)
    db.commit()

    return SosResponse(
        message="SOS workflow initiated. Care circle notified.",
        notified_contacts=contacts,
    )
