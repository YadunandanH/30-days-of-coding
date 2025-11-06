from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Alert as AlertModel, Role, Site, User
from ..schemas import Alert, TerritorySnapshot


router = APIRouter(prefix="/api/hco", tags=["hco_admin"])


@router.get("/{admin_id}/territory", response_model=TerritorySnapshot)
def territory_overview(admin_id: int, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role != Role.HCO_ADMIN:
        raise HTTPException(status_code=404, detail="Admin not found")

    sites = db.query(Site).all()
    total_capacity = sum(site.capacity for site in sites)
    total_demand = sum(site.demand for site in sites)
    utilization = round((total_demand / total_capacity) * 100, 1) if total_capacity else 0
    bottlenecks: list[str] = []
    for site in sites:
        if site.capacity and site.demand / site.capacity >= 0.85:
            bottlenecks.append(
                f"{site.name}: {round((site.demand/site.capacity)*100)}% utilized"
            )

    summary = {
        "total_sites": len(sites),
        "total_capacity": total_capacity,
        "total_demand": total_demand,
        "utilization_percent": utilization,
    }

    return TerritorySnapshot(
        sites=sites,
        regional_summary=summary,
        bottlenecks=bottlenecks,
    )


@router.get("/{admin_id}/alerts", response_model=list[Alert])
def admin_alerts(admin_id: int, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role != Role.HCO_ADMIN:
        raise HTTPException(status_code=404, detail="Admin not found")

    alerts = (
        db.query(AlertModel)
        .filter(AlertModel.who == Role.HCO_ADMIN)
        .order_by(AlertModel.created_at.desc())
        .limit(20)
        .all()
    )
    return [Alert.from_orm(alert) for alert in alerts]
