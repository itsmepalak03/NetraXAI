"""
Generates the clinical screening PDF report using ReportLab.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, Image as RLImage, HRFlowable)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
import os
from datetime import datetime

NAVY = colors.HexColor("#111827")
TEAL = colors.HexColor("#0F766E")
SLATE = colors.HexColor("#64748B")


def build_report_pdf(out_path: str, patient: dict, screening: dict, ai_result: dict, review: dict, report_id: str):
    doc = SimpleDocTemplate(out_path, pagesize=A4,
                             topMargin=18 * mm, bottomMargin=18 * mm,
                             leftMargin=16 * mm, rightMargin=16 * mm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleC", parent=styles["Title"], textColor=NAVY, fontSize=20)
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], textColor=TEAL, spaceBefore=10, spaceAfter=4)
    normal = styles["Normal"]
    small = ParagraphStyle("small", parent=styles["Normal"], fontSize=8, textColor=SLATE)

    elements = []
    elements.append(Paragraph("NETRA XAI — Diabetic Retinopathy Screening Report", title_style))
    elements.append(Paragraph("Explainable AI-Assisted Screening Prototype (DEMO SYSTEM)", small))
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", color=SLATE, thickness=0.7))
    elements.append(Spacer(1, 10))

    elements.append(Paragraph(f"Report ID: {report_id}", small))
    elements.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", small))
    elements.append(Spacer(1, 6))

    # Patient info
    elements.append(Paragraph("Patient Information", h2))
    patient_table = Table([
        ["Patient ID", patient.get("patient_code", "-"), "Name", patient.get("name", "-")],
        ["Age", str(patient.get("age", "-")), "Gender", patient.get("gender", "-")],
        ["Diabetes Duration", f"{patient.get('diabetes_duration', '-')} yrs", "HbA1c", f"{patient.get('hba1c', '-')}%"],
        ["Screening Centre", patient.get("screening_centre", "-"), "Previous DR Status", patient.get("previous_dr_status", "-")],
    ], colWidths=[95, 140, 95, 140])
    info_table_style = TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
        ("TEXTCOLOR", (2, 0), (2, -1), NAVY),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E5E7EB")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F7F8FC")),
        ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#F7F8FC")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ])
    patient_table.setStyle(info_table_style)
    elements.append(patient_table)

    # Screening / quality
    elements.append(Paragraph("Screening & Image Quality", h2))
    q = screening.get("quality_metrics") or {}
    quality_table = Table([
        ["Image Quality Score", f"{screening.get('quality_score', '-')} / 100", "Status", screening.get("quality_status", "-")],
        ["Focus", str(q.get("focus", "-")), "Illumination", str(q.get("illumination", "-"))],
        ["Field of View", str(q.get("field_of_view", "-")), "Contrast", str(q.get("contrast", "-"))],
    ], colWidths=[95, 140, 95, 140])
    quality_table.setStyle(info_table_style)
    elements.append(quality_table)

    # AI result
    elements.append(Paragraph("AI Screening Assessment (DEMO AI ENGINE)", h2))
    referable_text = "YES" if ai_result.get("referable") else "NO"
    ai_table = Table([
        ["DR Severity", ai_result.get("severity_label", "-"), "DR Level", str(ai_result.get("dr_level", "-"))],
        ["Demo Model Confidence", f"{ai_result.get('confidence', '-')}%", "Referable DR", referable_text],
        ["Processing Time", f"{ai_result.get('processing_time_ms', '-')} ms", "AI Mode", ai_result.get("ai_mode", "demo").upper()],
    ], colWidths=[95, 140, 95, 140])
    ai_table.setStyle(info_table_style)
    elements.append(ai_table)
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        "Note: This confidence value is produced by a DEMO/PROTOTYPE AI engine using classical "
        "image-processing heuristics. It has not undergone clinical validation or probability "
        "calibration and must not be treated as a calibrated clinical confidence score.", small))

    # Findings
    findings = ai_result.get("findings") or []
    if findings:
        elements.append(Paragraph("Detected Lesion Candidates", h2))
        rows = [["Type", "Location", "Confidence"]]
        for f in findings[:10]:
            rows.append([f.get("type", "-"), f.get("location", "-"), f"{f.get('confidence', '-')}%"])
        f_table = Table(rows, colWidths=[150, 210, 100])
        f_table.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E5E7EB")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F8FC")]),
        ]))
        elements.append(f_table)

    # Grad-CAM images
    heatmap = ai_result.get("overlay_path")
    if heatmap and os.path.exists(heatmap):
        elements.append(Paragraph("Explainability — AI Attention Overlay (Prototype XAI)", h2))
        elements.append(RLImage(heatmap, width=140 * mm, height=105 * mm))

    # Doctor review
    elements.append(Paragraph("Doctor Review & Final Decision", h2))
    if review:
        rev_table = Table([
            ["Doctor Decision", review.get("decision", "-"), "Doctor Assessed Level", str(review.get("doctor_assessment_level", "-"))],
            ["Final Decision Level", str(review.get("final_level", "-")), "Referral", "YES" if review.get("referral") else "NO"],
            ["Reviewing Doctor", review.get("doctor_name", "-"), "Reviewed At", str(review.get("reviewed_at", "-"))],
        ], colWidths=[95, 140, 95, 140])
        rev_table.setStyle(info_table_style)
        elements.append(rev_table)
        if review.get("notes"):
            elements.append(Spacer(1, 4))
            elements.append(Paragraph(f"<b>Clinical Notes:</b> {review.get('notes')}", normal))
    else:
        elements.append(Paragraph("Doctor review is pending for this screening.", normal))

    elements.append(Spacer(1, 10))
    elements.append(Paragraph("Recommendation", h2))
    recommendation = ("Ophthalmology referral recommended." if ai_result.get("referable")
                       else "Routine annual re-screening recommended.")
    elements.append(Paragraph(recommendation, normal))

    elements.append(Spacer(1, 14))
    elements.append(HRFlowable(width="100%", color=SLATE, thickness=0.5))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        "MEDICAL DISCLAIMER: NETRA XAI is an early-stage research prototype for screening "
        "support only. It does not constitute a medical diagnosis, does not replace clinical "
        "judgement, and has not completed formal clinical validation. All findings require "
        "confirmation and final decision-making by a qualified, licensed medical professional.",
        small))

    doc.build(elements)
    return out_path
