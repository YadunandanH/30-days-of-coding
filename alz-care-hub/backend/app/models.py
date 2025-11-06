from __future__ import annotations

import enum
from datetime import datetime, date, time

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    Time,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Role(str, enum.Enum):
    PATIENT = "patient"
    CAREGIVER = "caregiver"
    HCP = "hcp"
    HCO_ADMIN = "hco_admin"


patient_caregiver_link = Table(
    "patient_caregiver_link",
    Base.metadata,
    Column("patient_id", ForeignKey("patient_profiles.id"), primary_key=True),
    Column("caregiver_id", ForeignKey("users.id"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role: Mapped[Role] = mapped_column(Enum(Role), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32))
    locale: Mapped[str | None] = mapped_column(String(8), default="en-IN")
    accessibility_prefs: Mapped[dict | None] = mapped_column(JSON, default=dict)

    patient_profile: Mapped["PatientProfile"] = relationship(
        "PatientProfile", back_populates="patient", uselist=False
    )
    caregiver_patients: Mapped[list["PatientProfile"]] = relationship(
        "PatientProfile",
        secondary=patient_caregiver_link,
        back_populates="caregivers",
    )


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    dob: Mapped[date | None] = mapped_column(Date)
    diagnosis_date: Mapped[date | None] = mapped_column(Date)
    hcp_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    address: Mapped[str | None] = mapped_column(Text)
    safe_zones: Mapped[list[dict]] = mapped_column(JSON, default=list)

    patient: Mapped[User] = relationship(
        "User", foreign_keys=[patient_id], back_populates="patient_profile"
    )
    hcp: Mapped[User | None] = relationship("User", foreign_keys=[hcp_id])
    caregivers: Mapped[list[User]] = relationship(
        "User", secondary=patient_caregiver_link, back_populates="caregiver_patients"
    )
    medications: Mapped[list["Medication"]] = relationship(
        "Medication", back_populates="patient", cascade="all, delete-orphan"
    )
    appointments: Mapped[list["Appointment"]] = relationship(
        "Appointment", back_populates="patient", cascade="all, delete-orphan"
    )
    checkins: Mapped[list["CheckIn"]] = relationship(
        "CheckIn", back_populates="patient", cascade="all, delete-orphan"
    )
    tasks: Mapped[list["Task"]] = relationship(
        "Task", back_populates="patient", cascade="all, delete-orphan"
    )
    risk_states: Mapped[list["RiskState"]] = relationship(
        "RiskState", back_populates="patient", cascade="all, delete-orphan"
    )


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patient_profiles.id"))
    drug: Mapped[str] = mapped_column(String(120))
    dose: Mapped[str] = mapped_column(String(64))
    schedule: Mapped[str] = mapped_column(String(64))
    pill_image: Mapped[str | None] = mapped_column(String(256))

    patient: Mapped[PatientProfile] = relationship("PatientProfile", back_populates="medications")
    adherence_logs: Mapped[list["MedicationLog"]] = relationship(
        "MedicationLog", back_populates="medication", cascade="all, delete-orphan"
    )


class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    medication_id: Mapped[int] = mapped_column(ForeignKey("medications.id"))
    taken_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(16), default="taken")
    reason: Mapped[str | None] = mapped_column(String(255))

    medication: Mapped[Medication] = relationship("Medication", back_populates="adherence_logs")


class AppointmentType(str, enum.Enum):
    DOCTOR = "doctor"
    INFUSION = "infusion"
    MRI = "mri"


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patient_profiles.id"))
    site_id: Mapped[int | None] = mapped_column(ForeignKey("sites.id"))
    type: Mapped[AppointmentType] = mapped_column(Enum(AppointmentType))
    date_time: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(32), default="scheduled")

    patient: Mapped[PatientProfile] = relationship("PatientProfile", back_populates="appointments")
    site: Mapped["Site" | None] = relationship("Site", back_populates="appointments")


class CheckIn(Base):
    __tablename__ = "checkins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patient_profiles.id"))
    date: Mapped[date] = mapped_column(Date, default=date.today)
    time_of_day: Mapped[time] = mapped_column(Time, default=datetime.utcnow().time)
    mood_emoji: Mapped[str] = mapped_column(String(8))
    vitals: Mapped[dict | None] = mapped_column(JSON, default=dict)
    notes: Mapped[str | None] = mapped_column(Text)

    patient: Mapped[PatientProfile] = relationship("PatientProfile", back_populates="checkins")


class TaskOwner(str, enum.Enum):
    PATIENT = "patient"
    CAREGIVER = "caregiver"
    HCP = "hcp"
    HCO = "hco"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int | None] = mapped_column(ForeignKey("patient_profiles.id"))
    title: Mapped[str] = mapped_column(String(160))
    owner: Mapped[TaskOwner] = mapped_column(Enum(TaskOwner))
    due_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(32), default="open")
    linked_milestone: Mapped[str | None] = mapped_column(String(160))

    patient: Mapped[PatientProfile | None] = relationship("PatientProfile", back_populates="tasks")


class RiskState(Base):
    __tablename__ = "risk_states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patient_profiles.id"))
    score: Mapped[int] = mapped_column(Integer, default=0)
    band: Mapped[str] = mapped_column(String(8), default="green")
    reasons: Mapped[list[str]] = mapped_column(JSON, default=list)
    last_eval_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient: Mapped[PatientProfile] = relationship("PatientProfile", back_populates="risk_states")


class SiteType(str, enum.Enum):
    CLINIC = "clinic"
    INFUSION = "infusion"


class Site(Base):
    __tablename__ = "sites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(160))
    type: Mapped[SiteType] = mapped_column(Enum(SiteType))
    latitude: Mapped[float] = mapped_column(Numeric(10, 6))
    longitude: Mapped[float] = mapped_column(Numeric(10, 6))
    capacity: Mapped[int] = mapped_column(Integer, default=0)
    demand: Mapped[int] = mapped_column(Integer, default=0)
    wait_time: Mapped[int] = mapped_column(Integer, default=0)

    appointments: Mapped[list[Appointment]] = relationship("Appointment", back_populates="site")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    who: Mapped[Role] = mapped_column(Enum(Role))
    type: Mapped[str] = mapped_column(String(64))
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    delivered_via: Mapped[list[str]] = mapped_column(JSON, default=list)
    ack_status: Mapped[str] = mapped_column(String(32), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MemoryExercise(Base):
    __tablename__ = "memory_exercises"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int | None] = mapped_column(ForeignKey("patient_profiles.id"))
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String(32), default="easy")
    streak: Mapped[int] = mapped_column(Integer, default=0)

    patient: Mapped[PatientProfile | None] = relationship("PatientProfile")


class VoicePrompt(Base):
    __tablename__ = "voice_prompts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int | None] = mapped_column(ForeignKey("patient_profiles.id"))
    message: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(8), default="en-IN")
    use_case: Mapped[str] = mapped_column(String(64), default="general")

    patient: Mapped[PatientProfile | None] = relationship("PatientProfile")
