"""
Rural Screening Capacity Simulator - pure calculation service.
All outputs are computed dynamically from the inputs; nothing is hardcoded.
"""


def run_simulation(inp: dict) -> dict:
    patients_per_day = max(inp["patients_per_day"], 0.01)
    num_doctors = max(inp["num_doctors"], 1)
    num_centres = max(inp["num_centres"], 1)
    bandwidth_mbps = max(inp["bandwidth_mbps"], 0.1)
    image_size_mb = max(inp["image_size_mb"], 0.1)
    ai_processing_sec = max(inp["ai_processing_sec"], 0.1)
    doctor_review_sec = max(inp["doctor_review_sec"], 1)
    working_days = max(inp["working_days"], 1)
    ai_assisted = inp.get("ai_assisted", True)

    # --- Transfer time per image over available bandwidth ---
    transfer_sec_per_image = (image_size_mb * 8) / bandwidth_mbps  # Mb / Mbps = sec

    # --- Per-image pipeline time ---
    if ai_assisted:
        # AI pre-screens; doctor only deep-reviews AI-flagged/borderline cases.
        # Modeled as doctor reviewing 40% of cases at full time, 60% at a
        # much faster confirmatory glance (quick-confirm ~ 35% of review time).
        effective_doctor_sec = 0.4 * doctor_review_sec + 0.6 * (doctor_review_sec * 0.35)
        per_image_ai_sec = ai_processing_sec
    else:
        effective_doctor_sec = doctor_review_sec
        per_image_ai_sec = 0

    # --- Daily throughput capacity ---
    seconds_per_day_per_doctor = 6.5 * 3600  # 6.5 effective clinical hours/day
    doctor_capacity_per_day = (seconds_per_day_per_doctor / effective_doctor_sec) * num_doctors

    # AI engine assumed parallelizable across centres (one lightweight worker
    # per centre in this prototype simulation)
    ai_seconds_per_day = 7 * 3600 * num_centres
    ai_capacity_per_day = (ai_seconds_per_day / per_image_ai_sec) if ai_assisted and per_image_ai_sec > 0 else float("inf")

    bandwidth_seconds_per_day = 8 * 3600 * num_centres
    bandwidth_capacity_per_day = bandwidth_seconds_per_day / transfer_sec_per_image

    daily_capacity = min(doctor_capacity_per_day, ai_capacity_per_day, bandwidth_capacity_per_day)

    monthly_capacity = daily_capacity * (working_days / 12.0)
    annual_capacity = daily_capacity * working_days

    # --- Queue / backlog dynamics ---
    queue_per_day = max(patients_per_day - daily_capacity, 0)
    backlog_annual = queue_per_day * working_days

    if daily_capacity > 0:
        avg_wait_days = patients_per_day / daily_capacity if patients_per_day > daily_capacity else patients_per_day / daily_capacity
        # Waiting time proxy: ratio of demand to capacity, expressed in days
        waiting_time_days = round(patients_per_day / daily_capacity, 2) if daily_capacity > 0 else None
    else:
        waiting_time_days = None

    doctor_utilization = min((patients_per_day * effective_doctor_sec) / (seconds_per_day_per_doctor * num_doctors) * 100, 300)
    ai_utilization = (min((patients_per_day * per_image_ai_sec) / ai_seconds_per_day * 100, 300)
                       if ai_assisted and per_image_ai_sec > 0 else 0)
    bandwidth_utilization = min((patients_per_day * transfer_sec_per_image) / bandwidth_seconds_per_day * 100, 300)

    capacity_gap = round(inp["target_annual_patients"] - annual_capacity, 1)

    # --- Bottleneck detection (based purely on computed utilizations) ---
    utils = {
        "Doctor Bottleneck": doctor_utilization,
        "AI Bottleneck": ai_utilization,
        "Bandwidth Bottleneck": bandwidth_utilization,
    }
    max_key = max(utils, key=utils.get)
    if utils[max_key] >= 100:
        bottleneck = max_key
    else:
        bottleneck = "No Major Bottleneck"

    # --- Overall state ---
    ratio = patients_per_day / daily_capacity if daily_capacity > 0 else 999
    if ratio < 0.85:
        state = "UNDER CAPACITY"
    elif ratio <= 1.05:
        state = "OPTIMAL"
    else:
        state = "OVERLOADED"

    return {
        "inputs": inp,
        "transfer_sec_per_image": round(transfer_sec_per_image, 2),
        "effective_doctor_sec_per_image": round(effective_doctor_sec, 2),
        "daily_capacity": round(daily_capacity, 1),
        "monthly_capacity": round(monthly_capacity, 1),
        "annual_capacity": round(annual_capacity, 1),
        "queue_per_day": round(queue_per_day, 1),
        "backlog_annual": round(backlog_annual, 1),
        "waiting_time_days": waiting_time_days,
        "doctor_utilization": round(doctor_utilization, 1),
        "ai_utilization": round(ai_utilization, 1),
        "bandwidth_utilization": round(bandwidth_utilization, 1),
        "capacity_gap": capacity_gap,
        "bottleneck": bottleneck,
        "state": state,
    }
