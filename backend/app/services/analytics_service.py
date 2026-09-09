from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Screening, AIResult, DoctorReview
from collections import Counter
from datetime import datetime, timedelta


def compute_analytics(db: Session) -> dict:
    screenings = db.query(Screening).all()
    ai_results = db.query(AIResult).all()
    reviews = db.query(DoctorReview).all()

    total_screenings = len(screenings)
    total_reviewed = len(reviews)
    referable = len([r for r in ai_results if r.referable])
    ungradeable = len([s for s in screenings if s.quality_status == "UNGRADEABLE"])

    avg_processing_time = (
        round(sum([r.processing_time_ms or 0 for r in ai_results]) / len(ai_results), 1)
        if ai_results else 0
    )

    level_counts = Counter([r.dr_level for r in ai_results])
    dr_distribution = [{"level": lvl, "count": level_counts.get(lvl, 0)} for lvl in range(5)]

    quality_counts = Counter([s.quality_status for s in screenings if s.quality_status])
    quality_distribution = [{"status": k, "count": v} for k, v in quality_counts.items()]

    confidence_buckets = Counter()
    for r in ai_results:
        bucket = int(r.confidence // 10) * 10
        confidence_buckets[bucket] += 1
    confidence_distribution = [{"bucket": f"{k}-{k+9}%", "count": v} for k, v in sorted(confidence_buckets.items())]

    review_rate = round((total_reviewed / total_screenings) * 100, 1) if total_screenings else 0

    # Screening volume over last 14 days (based on created_at)
    volume = []
    today = datetime.utcnow().date()
    by_day = Counter([s.created_at.date() for s in screenings])
    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        volume.append({"date": d.isoformat(), "count": by_day.get(d, 0)})

    centre_counts = Counter([s.patient.screening_centre for s in screenings if s.patient])
    centre_performance = [{"centre": k, "count": v} for k, v in centre_counts.items()]

    return {
        "total_screenings": total_screenings,
        "referable_cases": referable,
        "pending_reviews": total_screenings - total_reviewed,
        "ungradeable_images": ungradeable,
        "avg_processing_time_ms": avg_processing_time,
        "dr_distribution": dr_distribution,
        "quality_distribution": quality_distribution,
        "confidence_distribution": confidence_distribution,
        "review_completion_rate": review_rate,
        "screening_volume_14d": volume,
        "centre_performance": centre_performance,
    }
