from __future__ import annotations

from datetime import date, datetime, timedelta, time
from typing import Sequence

from sqlalchemy.orm import Session

from .models import (
    Alert,
    Appointment,
    AppointmentType,
    CheckIn,
    MemoryExercise,
    Medication,
    MedicationLog,
    PatientProfile,
    RiskState,
    Role,
    Site,
    SiteType,
    Task,
    TaskOwner,
    User,
    VoicePrompt,
)


def create_user(
    session: Session,
    *,
    role: Role,
    name: str,
    phone: str,
    locale: str = "en-IN",
    accessibility_prefs: dict | None = None,
) -> User:
    user = User(
        role=role,
        name=name,
        phone=phone,
        locale=locale,
        accessibility_prefs=accessibility_prefs or {
            "highContrast": True,
            "voicePrompts": True,
        },
    )
    session.add(user)
    return user


def ensure_seed_data(session: Session) -> None:
    if session.query(User).count():
        return

    today = date.today()

    # Users
    patient_user = create_user(
        session,
        role=Role.PATIENT,
        name="Meera Rao",
        phone="+91-9876543210",
        accessibility_prefs={"textSize": "xl", "voicePrompts": True},
    )
    caregiver_user = create_user(
        session,
        role=Role.CAREGIVER,
        name="Arjun Rao",
        phone="+91-9123456780",
    )
    backup_caregiver = create_user(
        session,
        role=Role.CAREGIVER,
        name="Lata Rao",
        phone="+91-9134567890",
    )
    hcp_user = create_user(
        session,
        role=Role.HCP,
        name="Dr. Neha Kapoor",
        phone="+91-9000011111",
    )
    hco_admin = create_user(
        session,
        role=Role.HCO_ADMIN,
        name="Ravi Menon",
        phone="+91-9555512345",
    )

    session.flush()

    # Patient profile
    patient_profile = PatientProfile(
        patient_id=patient_user.id,
        dob=date(1952, 4, 15),
        diagnosis_date=date(2023, 6, 1),
        hcp_id=hcp_user.id,
        address="#221, Green Meadows, Bengaluru",
        safe_zones=[
            {"label": "Home", "lat": 12.9716, "lng": 77.5946, "radius_km": 0.5},
            {"label": "Community Center", "lat": 12.975, "lng": 77.6, "radius_km": 0.5},
        ],
    )
    patient_profile.caregivers.extend([caregiver_user, backup_caregiver])
    session.add(patient_profile)
    session.flush()

    # Sites
    sites = [
        Site(
            name="Bengaluru Memory Clinic",
            type=SiteType.CLINIC,
            latitude=12.9721,
            longitude=77.5933,
            capacity=40,
            demand=28,
            wait_time=5,
        ),
        Site(
            name="Care Infusion Center",
            type=SiteType.INFUSION,
            latitude=12.978,
            longitude=77.6,
            capacity=30,
            demand=26,
            wait_time=10,
        ),
    ]
    session.add_all(sites)
    session.flush()

    # Medications & adherence
    donepezil = Medication(
        patient_id=patient_profile.id,
        drug="Donepezil",
        dose="10 mg",
        schedule="08:00",
        pill_image="https://images.example.com/donepezil.png",
    )
    session.add(donepezil)
    session.flush()
    session.add_all(
        [
            MedicationLog(
                medication_id=donepezil.id,
                taken_at=datetime.combine(today - timedelta(days=1), time(8, 0)),
                status="taken",
            ),
            MedicationLog(
                medication_id=donepezil.id,
                taken_at=datetime.combine(today - timedelta(days=2), time(8, 0)),
                status="taken",
            ),
            MedicationLog(
                medication_id=donepezil.id,
                taken_at=datetime.combine(today - timedelta(days=3), time(8, 30)),
                status="snoozed",
                reason="Felt dizzy",
            ),
        ]
    )

    memantine = Medication(
        patient_id=patient_profile.id,
        drug="Memantine",
        dose="5 mg",
        schedule="20:00",
        pill_image="https://images.example.com/memantine.png",
    )
    session.add(memantine)
    session.flush()

    # Appointments
    session.add_all(
        [
            Appointment(
                patient_id=patient_profile.id,
                type=AppointmentType.DOCTOR,
                date_time=datetime.now() + timedelta(days=1, hours=2),
                status="scheduled",
                site_id=sites[0].id,
            ),
            Appointment(
                patient_id=patient_profile.id,
                type=AppointmentType.INFUSION,
                date_time=datetime.now() + timedelta(days=10),
                status="scheduled",
                site_id=sites[1].id,
            ),
        ]
    )

    # Check-ins
    session.add_all(
        [
            CheckIn(
                patient_id=patient_profile.id,
                date=today,
                mood_emoji="🙂",
                vitals={"bp": "120/80", "hr": 72},
                notes="Slept well, slight forgetfulness",
            ),
            CheckIn(
                patient_id=patient_profile.id,
                date=today - timedelta(days=1),
                mood_emoji="😐",
                vitals={"bp": "118/78", "hr": 70},
                notes="Mild headache",
            ),
        ]
    )

    # Tasks
    session.add_all(
        [
            Task(
                patient_id=patient_profile.id,
                title="Upload insurance document",
                owner=TaskOwner.CAREGIVER,
                due_date=today + timedelta(days=2),
                status="open",
                linked_milestone="Insurance approval",
            ),
            Task(
                patient_id=patient_profile.id,
                title="Schedule follow-up MRI",
                owner=TaskOwner.HCP,
                due_date=today + timedelta(days=5),
                status="in_progress",
                linked_milestone="Baseline MRI",
            ),
            Task(
                patient_id=patient_profile.id,
                title="Daily walk in the park",
                owner=TaskOwner.PATIENT,
                due_date=today,
                status="open",
            ),
        ]
    )

    # Risk state
    session.add(
        RiskState(
            patient_id=patient_profile.id,
            score=7,
            band="red",
            reasons=["Insurance pending", "MRI not booked"],
        )
    )

    # Memory exercises
    session.add_all(
        [
            MemoryExercise(
                patient_id=patient_profile.id,
                title="Match the familiar faces",
                description="Flip cards to find matching family member photos.",
                streak=4,
            ),
            MemoryExercise(
                patient_id=patient_profile.id,
                title="Name that tune",
                description="Identify familiar songs from short clips.",
                difficulty="medium",
                streak=2,
            ),
        ]
    )

    # Voice prompts
    session.add_all(
        [
            VoicePrompt(
                patient_id=patient_profile.id,
                message="Good morning Meera! It's a bright day and your medication is ready.",
                use_case="morning_greeting",
            ),
            VoicePrompt(
                patient_id=patient_profile.id,
                message="Time for Donepezil. Press the green button if you've taken it.",
                use_case="med_reminder",
            ),
            VoicePrompt(
                patient_id=patient_profile.id,
                message="If you feel lost, tap Guide Me Home for directions.",
                use_case="safety",
            ),
        ]
    )

    # Alerts
    session.add_all(
        [
            Alert(
                who=Role.CAREGIVER,
                type="missed_med",
                payload={"patient": patient_user.name, "med": "Memantine"},
                delivered_via=["in_app", "sms"],
            ),
            Alert(
                who=Role.HCP,
                type="insurance_pending",
                payload={
                    "patient": patient_user.name,
                    "days_pending": 16,
                    "recommended_action": "Escalate to payer",
                },
                delivered_via=["in_app"],
            ),
            Alert(
                who=Role.HCO_ADMIN,
                type="capacity_threshold",
                payload={
                    "site": "Care Infusion Center",
                    "capacity": 30,
                    "demand": 26,
                    "threshold": "85%",
                },
                delivered_via=["email"],
            ),
        ]
    )

    session.commit()
