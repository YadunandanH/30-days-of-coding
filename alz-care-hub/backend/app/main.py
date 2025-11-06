from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine, SessionLocal
from .routers import alerts, caregivers, chat, hco, hcp, patients, reports
from .seed_data import ensure_seed_data


def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)

    # Seed data for a quick demo experience
    with SessionLocal() as session:
        ensure_seed_data(session)

    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(patients.router)
    app.include_router(caregivers.router)
    app.include_router(hcp.router)
    app.include_router(hco.router)
    app.include_router(reports.router)
    app.include_router(chat.router)
    app.include_router(alerts.router)

    @app.get("/health")
    def health_check():
        return {"status": "ok"}

    return app


app = create_app()
