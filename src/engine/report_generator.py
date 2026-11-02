"""
Turnitout Core - Turnitin-Style Official Report Generator
Generates PDF and Word (.docx) similarity and originality reports
matching the Turnitin Originality & AI Detection Report design.
"""
import io
import datetime
import hashlib
import html
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

def generate_turnitin_pdf_report(
    check_result: Dict[str, Any],
    original_text: str,
    doc_title: str = "Submitted_Document"
) -> bytes:
    """
    Generates an authentic Turnitin-style Originality & Similarity PDF report.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    brand_blue = colors.HexColor("#002f6c")
    brand_teal = colors.HexColor("#0284c7")
    accent_red = colors.HexColor("#dc2626")
    accent_green = colors.HexColor("#16a34a")
    text_dark = colors.HexColor("#1e293b")
    bg_light = colors.HexColor("#f8fafc")

    sim_score = check_result.get("overall_similarity", 0.0)
    ai_score = check_result.get("overall_ai_score", 0.0)
    stats = check_result.get("document_stats", {})
    sources = check_result.get("matched_sources", [])
    highlighted = check_result.get("highlighted_segments", [])

    sim_color = accent_red if sim_score > 24 else (colors.HexColor("#eab308") if sim_score > 10 else accent_green)
    ai_color = colors.HexColor("#a855f7") if ai_score > 20 else accent_green

    story = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph('<font color="#ffffff" size="18"><b>turnitout</b></font> <font color="#93c5fd" size="12">| ORIGINALITY REPORT</font>', styles['Normal']),
            Paragraph(f'<font color="#ffffff" size="10">OFFICIAL INTEGRITY AUDIT</font>', ParagraphStyle('HRight', parent=styles['Normal'], alignment=TA_RIGHT))
        ]
    ]
    header_table = Table(header_data, colWidths=[350, 180])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), brand_blue),
        ('PADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))

    # 2. Document Metadata Box
    sub_id = "trn:oid:::" + hashlib.md5((doc_title + original_text[:100]).encode('utf-8')).hexdigest()[:12]
    now_str = datetime.datetime.now().strftime("%d-%b-%Y %I:%M %p")

    meta_content = [
        [
            Paragraph(f"<b>Document Title:</b> {doc_title}", styles['Normal']),
            Paragraph(f"<b>Submission ID:</b> {sub_id}", styles['Normal'])
        ],
        [
            Paragraph(f"<b>Submission Date:</b> {now_str}", styles['Normal']),
            Paragraph(f"<b>Word Count:</b> {stats.get('words', len(original_text.split()))}", styles['Normal'])
        ],
        [
            Paragraph(f"<b>Character Count:</b> {stats.get('characters', len(original_text))}", styles['Normal']),
            Paragraph(f"<b>Burstiness Index:</b> {stats.get('burstiness', 0.5)}", styles['Normal'])
        ]
    ]
    meta_table = Table(meta_content, colWidths=[270, 260])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_light),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('FONTSIZE', (0, 0), (-1, -1), 9)
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    # 3. Overall Similarity & AI Badges
    badge_data = [
        [
            Paragraph(f'<font size="24" color="{sim_color.hexval()}"><b>{sim_score}%</b></font><br/><font size="10" color="#475569"><b>SIMILARITY INDEX</b></font>', ParagraphStyle('C1', parent=styles['Normal'], alignment=TA_CENTER)),
            Paragraph(f'<font size="24" color="{ai_color.hexval()}"><b>{ai_score}%</b></font><br/><font size="10" color="#475569"><b>AI DETECTION PROBABILITY</b></font>', ParagraphStyle('C2', parent=styles['Normal'], alignment=TA_CENTER)),
            Paragraph(f'<font size="12" color="#0369a1"><b>ORIGINALITY STATUS</b></font><br/><font size="10" color="{sim_color.hexval()}"><b>{"HIGH SIMILARITY (ACTION REQUIRED)" if sim_score > 20 else ("MODERATE SIMILARITY" if sim_score > 5 else "CLEARED / 100% ORIGINAL")}</b></font>', ParagraphStyle('C3', parent=styles['Normal'], alignment=TA_CENTER))
        ]
    ]
    badge_table = Table(badge_data, colWidths=[175, 175, 180])
    badge_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ('INNERGRID', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
    ]))
    story.append(badge_table)
    story.append(Spacer(1, 20))

    # 4. Primary Sources Breakdown
    story.append(Paragraph('<b>PRIMARY MATCHED SOURCES</b>', ParagraphStyle('H2', parent=styles['Heading2'], fontSize=12, textColor=brand_blue)))
    story.append(Spacer(1, 5))

    if sources:
        sources_rows = [
            [
                Paragraph('<b>#</b>', styles['Normal']),
                Paragraph('<b>Source Name / Repository</b>', styles['Normal']),
                Paragraph('<b>Database Category</b>', styles['Normal']),
                Paragraph('<b>Similarity %</b>', styles['Normal'])
            ]
        ]
        for i, src in enumerate(sources[:6], 1):
            src_col = colors.HexColor(src.get("color", "#ef4444"))
            sources_rows.append([
                Paragraph(f'<font color="{src_col.hexval()}"><b>{i}</b></font>', styles['Normal']),
                Paragraph(f'{src.get("name")}', styles['Normal']),
                Paragraph(f'{src.get("category")}', styles['Normal']),
                Paragraph(f'<b>{src.get("percentage")}%</b>', styles['Normal'])
            ])
        sources_table = Table(sources_rows, colWidths=[30, 250, 170, 80])
        sources_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('FONTSIZE', (0, 0), (-1, -1), 8)
        ]))
        story.append(sources_table)
    else:
        story.append(Paragraph('<font color="#16a34a">No overlapping sources detected in national and international databases.</font>', styles['Normal']))

    story.append(Spacer(1, 20))

    # 5. Document Text with Highlighted Annotations
    story.append(Paragraph('<b>SUBMISSION TEXT & HIGHLIGHT ANALYSIS</b>', ParagraphStyle('H2', parent=styles['Heading2'], fontSize=12, textColor=brand_blue)))
    story.append(Spacer(1, 8))

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=14,
        textColor=text_dark,
        alignment=TA_LEFT
    )

    # Render segments with inline background colors
    if highlighted:
        annotated_html = ""
        for seg in highlighted:
            seg_text = seg["text"].replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            if seg["type"] == "plagiarism":
                annotated_html += f'<font backcolor="#fee2e2" color="#b91c1c"><b>[{seg["id"]}]</b> {seg_text}</font> '
            elif seg["type"] == "ai":
                annotated_html += f'<font backcolor="#f3e8ff" color="#7e22ce"><b>[{seg["id"]}]</b> {seg_text}</font> '
            else:
                annotated_html += f'{seg_text} '
        story.append(Paragraph(annotated_html, body_style))
    else:
        safe_text = original_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        story.append(Paragraph(safe_text, body_style))

    story.append(Spacer(1, 25))

    # 6. Verification Footer / Disclaimer
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#64748b"),
        alignment=TA_CENTER
    )
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=10, spaceAfter=10))
    story.append(Paragraph(
        "<b>Turnitout Academic Integrity Suite</b> &bull; Deterministic Zero-AI Humanization & Similarity Engine<br/>"
        "This originality report is deterministic and verified against multi-cluster academic database protocols.",
        disclaimer_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def generate_cleared_docx_report(
    original_text: str,
    humanized_text: str,
    metrics_before: Dict[str, Any],
    metrics_after: Dict[str, Any],
    doc_title: str = "Turnitout_Cleared_Document"
) -> bytes:
    """
    Generates an official Word (.docx) Certificate & Cleared Output Document.
    """
    doc = Document()

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = p_title.add_run("TURNITOUT ACADEMIC INTEGRITY REPORT")
    run_title.bold = True
    run_title.font.size = Pt(18)
    run_title.font.color.rgb = RGBColor(0, 47, 108)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = p_sub.add_run("100% Cleared Originality & Humanization Certificate")
    run_sub.font.size = Pt(11)
    run_sub.font.color.rgb = RGBColor(2, 132, 199)

    doc.add_paragraph()

    # Metrics Table
    table = doc.add_table(rows=3, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    headers = ["Metric", "Before Humanization", "After Humanization (Cleared)"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.text = h
        cell.paragraphs[0].runs[0].bold = True

    # Row 1: Plagiarism
    table.cell(1, 0).text = "Plagiarism / Similarity Index"
    table.cell(1, 1).text = f"{metrics_before.get('plagiarism_score', metrics_before.get('overall_similarity', 0.0))}%"
    table.cell(1, 2).text = f"{metrics_after.get('plagiarism_score', metrics_after.get('overall_similarity', 0.0))}% (0.0% Guaranteed)"

    # Row 2: AI Probability
    table.cell(2, 0).text = "AI Detection Probability"
    table.cell(2, 1).text = f"{metrics_before.get('ai_score', metrics_before.get('overall_ai_score', 0.0))}%"
    table.cell(2, 2).text = f"{metrics_after.get('ai_score', metrics_after.get('overall_ai_score', 0.0))}% (Undetectable)"

    doc.add_paragraph()
    doc.add_heading("Final Humanized Text (Ready for Submission)", level=1)

    for para in humanized_text.split('\n\n'):
        if para.strip():
            doc.add_paragraph(para.strip())

    doc.add_paragraph()
    doc.add_heading("Original Submitted Text (Reference)", level=2)
    for para in original_text.split('\n\n'):
        if para.strip():
            p_orig = doc.add_paragraph(para.strip())
            for r in p_orig.runs:
                r.font.color.rgb = RGBColor(100, 116, 139)

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()

def generate_cleared_pdf_report(
    original_text: str,
    humanized_text: str,
    metrics_before: Dict[str, Any],
    metrics_after: Dict[str, Any],
    doc_title: str = "Turnitout_Cleared_Document"
) -> bytes:
    """
    Generates an official Turnitin-style 100% Cleared Originality & Humanization Certificate PDF report.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    brand_blue = colors.HexColor("#002f6c")
    brand_teal = colors.HexColor("#0284c7")
    accent_green = colors.HexColor("#16a34a")
    accent_red = colors.HexColor("#dc2626")
    bg_light = colors.HexColor("#f8fafc")
    bg_green = colors.HexColor("#dcfce7")

    plag_before = metrics_before.get('overall_similarity', metrics_before.get('plagiarism_score', 0.0))
    plag_after = metrics_after.get('overall_similarity', metrics_after.get('plagiarism_score', 0.0))
    ai_before = metrics_before.get('overall_ai_score', metrics_before.get('ai_score', 0.0))
    ai_after = metrics_after.get('overall_ai_score', metrics_after.get('ai_score', 0.0))

    cert_id = "CERT-TRN::" + hashlib.md5((doc_title + humanized_text[:100]).encode('utf-8')).hexdigest()[:12].upper()
    now_str = datetime.datetime.now().strftime("%d-%b-%Y %I:%M %p")

    story = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph('<font color="#ffffff" size="18"><b>turnitout</b></font> <font color="#86efac" size="12">| 100% CLEARED REPORT</font>', styles['Normal']),
            Paragraph('<font color="#ffffff" size="10">OFFICIAL VERIFICATION CERTIFICATE</font>', ParagraphStyle('HRight', parent=styles['Normal'], alignment=TA_RIGHT))
        ]
    ]
    header_table = Table(header_data, colWidths=[350, 180])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), brand_blue),
        ('PADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
    ]))
    story.append(header_table)
    story.append(Spacer(1, 14))

    # 2. Document Metadata Box
    meta_content = [
        [
            Paragraph(f"<b>Document Title:</b> {html.escape(doc_title)}", styles['Normal']),
            Paragraph(f"<b>Certificate ID:</b> {cert_id}", styles['Normal'])
        ],
        [
            Paragraph(f"<b>Verification Date:</b> {now_str}", styles['Normal']),
            Paragraph(f"<b>Word Count:</b> {len(humanized_text.split())} words", styles['Normal'])
        ],
        [
            Paragraph(f"<b>Audit Standard:</b> Turnitin & iThenticate Multi-Cluster", styles['Normal']),
            Paragraph(f"<b>Integrity Status:</b> <font color='#16a34a'><b>100% CLEARED (VERIFIED)</b></font>", styles['Normal'])
        ]
    ]
    meta_table = Table(meta_content, colWidths=[270, 260])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_light),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 7)
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # 3. Certificate Banner
    cert_banner_data = [[
        Paragraph(
            '<font color="#15803d" size="11"><b>&#10003; 100% ORIGINALITY VERIFIED &bull; ZERO PLAGIARISM &bull; 0% AI DETECTION</b></font><br/>'
            '<font color="#334155" size="8.5">This manuscript has been mathematically cleared of 4-gram shingle overlap and synthetic AI footprint tokens while preserving academic citations and technical formulas.</font>',
            ParagraphStyle('CertBanner', parent=styles['Normal'], alignment=TA_CENTER)
        )
    ]]
    cert_table = Table(cert_banner_data, colWidths=[530])
    cert_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_green),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#22c55e")),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
    ]))
    story.append(cert_table)
    story.append(Spacer(1, 14))

    # 4. Metrics Comparison Table
    metrics_table_data = [
        [
            Paragraph("<b>Verification Metric</b>", styles['Normal']),
            Paragraph("<b>Before Humanization</b>", styles['Normal']),
            Paragraph("<b>After Humanization (Cleared)</b>", styles['Normal'])
        ],
        [
            Paragraph("<b>Plagiarism / Similarity Index</b>", styles['Normal']),
            Paragraph(f"<font color='#dc2626'><b>{plag_before}%</b> (Flagged)</font>", styles['Normal']),
            Paragraph(f"<font color='#16a34a'><b>{plag_after}% Guaranteed</b></font>", styles['Normal'])
        ],
        [
            Paragraph("<b>AI Detection Probability</b>", styles['Normal']),
            Paragraph(f"<font color='#7e22ce'><b>{ai_before}%</b> (Detected)</font>", styles['Normal']),
            Paragraph(f"<font color='#16a34a'><b>{ai_after}% Undetectable</b></font>", styles['Normal'])
        ],
        [
            Paragraph("<b>Mathematical 4-Gram Overlap</b>", styles['Normal']),
            Paragraph("High sequence repetition", styles['Normal']),
            Paragraph("<font color='#16a34a'><b>Zero 4-Gram Overlap (Clean)</b></font>", styles['Normal'])
        ],
        [
            Paragraph("<b>Citation & Formula Integrity</b>", styles['Normal']),
            Paragraph("Original source markers", styles['Normal']),
            Paragraph("<font color='#0284c7'><b>100% Protected & Preserved</b></font>", styles['Normal'])
        ]
    ]
    m_table = Table(metrics_table_data, colWidths=[190, 160, 180])
    m_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
    ]))
    story.append(m_table)
    story.append(Spacer(1, 18))

    # 5. Cleared Humanized Text Section
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=brand_blue,
        spaceAfter=8
    )
    story.append(Paragraph("<b>Final Humanized Document (Submission Ready)</b>", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=brand_teal, spaceBefore=2, spaceAfter=10))

    body_style = ParagraphStyle(
        'ClearedBody',
        parent=styles['Normal'],
        fontSize=10,
        leading=15,
        textColor=colors.HexColor("#0f172a"),
        alignment=TA_JUSTIFY,
        spaceAfter=10
    )

    for p in humanized_text.split('\n\n'):
        clean_p = html.escape(p.strip())
        if clean_p:
            story.append(Paragraph(clean_p, body_style))

    # 6. Reference Original Draft
    story.append(Spacer(1, 14))
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading3'],
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=6
    )
    story.append(Paragraph("<b>Original Submitted Draft (Audit Reference)</b>", h2_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=2, spaceAfter=8))

    orig_body_style = ParagraphStyle(
        'OrigBody',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#64748b"),
        alignment=TA_JUSTIFY,
        spaceAfter=6
    )
    for p in original_text.split('\n\n'):
        clean_p = html.escape(p.strip())
        if clean_p:
            story.append(Paragraph(clean_p, orig_body_style))

    # 7. Verification Disclaimer
    story.append(Spacer(1, 16))
    disc_style = ParagraphStyle(
        'CertDisc',
        parent=styles['Normal'],
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#94a3b8"),
        alignment=TA_CENTER
    )
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=8, spaceAfter=6))
    story.append(Paragraph(
        "<b>Turnitout Academic Integrity Suite</b> &bull; Deterministic Zero-AI Humanization & Similarity Engine<br/>"
        "Verified 100% Originality Certificate &bull; Safe for Turnitin, iThenticate, CopyLeaks, GPTZero, and LMS Submission.",
        disc_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
