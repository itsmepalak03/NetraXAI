from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.analytics_service import compute_analytics

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("")
def get_analytics(db: Session = Depends(get_db)):
    return compute_analytics(db)
