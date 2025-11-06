from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AppointmentType, PatientProfile, Site
from ..schemas import KpiReport


router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/kpis", response_model=KpiReport)
def kpi_report(db: Session = Depends(get_db)):
    patients = db.query(PatientProfile).all()
    total_patients = len(patients)
    adherence_values: list[float] = []
    confirm_to_infusion_days: list[int] = []
    missed_appointments = 0

    for patient in patients:
        if patient.diagnosis_date:
            infusion = next(
                (
                    appt
                    for appt in patient.appointments
                    if appt.type == AppointmentType.INFUSION
                ),
                None,
            )
            if infusion:
                confirm_to_infusion_days.append(
                    (infusion.date_time.date() - patient.diagnosis_date).days
                )

        total = 0
        taken = 0
        for med in patient.medications:
            total += len(med.adherence_logs)
            taken += sum(1 for log in med.adherence_logs if log.status == "taken")
        adherence_values.append(taken / total if total else 1)

        missed_appointments += sum(1 for appt in patient.appointments if appt.status == "missed")

    avg_adherence = round((sum(adherence_values) / len(adherence_values)) * 100, 1) if adherence_values else 100
    avg_confirm_to_infusion = round(sum(confirm_to_infusion_days) / len(confirm_to_infusion_days), 1) if confirm_to_infusion_days else 0

    high_risk_patients = sum(
        1
        for patient in patients
        for risk in patient.risk_states
        if risk.band == "red"
    )

    sites = db.query(Site).all()
    site_utilization = {
        site.name: round((site.demand / site.capacity) * 100, 1)
        if site.capacity
        else 0
        for site in sites
    }

    kpi_payload = {
        "total_patients": total_patients,
        "avg_med_adherence_percent": avg_adherence,
        "avg_confirm_to_infusion_days": avg_confirm_to_infusion,
        "missed_appointments_last_30d": missed_appointments,
        "high_risk_patients": high_risk_patients,
        "site_utilization_percent": site_utilization,
    }

    export_url = "http://localhost:8000/api/reports/kpis.csv"

    return KpiReport(
        filters={"range": "last_30_days"},
        kpis=kpi_payload,
        export_url=export_url,
    )


@router.get("/kpis.csv", response_class=PlainTextResponse)
def kpi_report_csv(db: Session = Depends(get_db)):
    report = kpi_report(db)
    headers = [
        "Metric",
        "Value",
    ]
    lines = [",".join(headers)]
    for key, value in report.kpis.items():
        if isinstance(value, dict):
            for sub_key, sub_val in value.items():
                lines.append(f"{key}:{sub_key},{sub_val}")
        else:
            lines.append(f"{key},{value}")
    return "\n".join(lines)
