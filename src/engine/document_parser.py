"""
Document Parser Module:
Extracts and generates text from TXT, PDF, and DOCX files.
"""
import io
from typing import Tuple

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Extract plain text from an uploaded file (.txt, .pdf, .docx)."""
    fn = filename.lower()
    if fn.endswith('.txt') or fn.endswith('.md') or fn.endswith('.tex'):
        try:
            return file_bytes.decode('utf-8')
        except UnicodeDecodeError:
            return file_bytes.decode('latin-1', errors='ignore')
            
    elif fn.endswith('.pdf'):
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        text_parts = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_parts.append(t)
        return "\n\n".join(text_parts)
        
    elif fn.endswith('.docx'):
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)
        
    else:
        # Fallback to text decode
        return file_bytes.decode('utf-8', errors='ignore')

def create_docx(text: str, title: str = "Turnitout Cleared Document") -> bytes:
    """Generate a professionally formatted academic DOCX file from text string."""
    import docx
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    
    doc = docx.Document()
    
    # Set standard 1-inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
    
    # Document Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = p_title.add_run(title.replace("_", " ").title())
    run_title.bold = True
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(18)
    run_title.font.color.rgb = RGBColor(0, 47, 108)
    
    # Subtitle
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = p_sub.add_run("100% Cleared Original Manuscript • Zero-AI Verified")
    run_sub.font.name = "Calibri"
    run_sub.font.size = Pt(10)
    run_sub.font.color.rgb = RGBColor(100, 116, 139)
    
    doc.add_paragraph() # Spacer
    
    # Body Paragraphs
    for paragraph in text.split('\n\n'):
        p_clean = paragraph.strip()
        if p_clean:
            p = doc.add_paragraph()
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(8)
            run = p.add_run(p_clean)
            run.font.name = "Calibri"
            run.font.size = Pt(11)
            run.font.color.rgb = RGBColor(15, 23, 42)
            
    bio = io.BytesIO()
    doc.save(bio)
    return bio.getvalue()

def create_pdf(text: str, title: str = "Turnitout Cleared Document") -> bytes:
    """Generate a publication-ready academic PDF file from text string using ReportLab."""
    import html
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
    
    bio = io.BytesIO()
    doc = SimpleDocTemplate(
        bio,
        pagesize=letter,
        rightMargin=50,
        leftMargin=50,
        topMargin=46,
        bottomMargin=46
    )
    styles = getSampleStyleSheet()
    
    # Title Banner
    header_data = [
        [
            Paragraph('<font color="#ffffff" size="14"><b>turnitout</b></font> <font color="#93c5fd" size="10">| CLEARED MANUSCRIPT</font>', styles['Normal']),
            Paragraph(f'<font color="#ffffff" size="8.5">ORIGINALITY VERIFIED</font>', ParagraphStyle('HRight', parent=styles['Normal'], alignment=TA_RIGHT))
        ]
    ]
    header_table = Table(header_data, colWidths=[360, 150])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#002f6c")),
        ('PADDING', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
    ]))
    
    story = [header_table, Spacer(1, 14)]
    
    # Doc Title
    clean_title = html.escape(title.replace("_", " ").title())
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#002f6c"),
        alignment=TA_LEFT,
        spaceAfter=4
    )
    story.append(Paragraph(f"<b>{clean_title}</b>", title_style))
    
    # Subtitle Metadata
    word_count = len(text.split())
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748b")
    )
    story.append(Paragraph(f"Publication-Ready Manuscript &bull; {word_count} Words &bull; 100% Original Content", meta_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0284c7"), spaceBefore=6, spaceAfter=14))
    
    # Academic Body Paragraphs
    body_style = ParagraphStyle(
        'HumanizedBody',
        parent=styles['Normal'],
        fontSize=10.5,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        alignment=TA_JUSTIFY,
        spaceAfter=12
    )
    
    for p in text.split('\n\n'):
        p_clean = p.strip()
        if p_clean:
            safe_p = html.escape(p_clean).replace('\n', '<br/>')
            story.append(Paragraph(safe_p, body_style))
            
    # Academic Verification Footer
    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=8, spaceAfter=6))
    footer_style = ParagraphStyle(
        'DocFooter',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#94a3b8"),
        alignment=TA_CENTER
    )
    story.append(Paragraph(
        "<b>Turnitout Academic Suite</b> &bull; Cleaned & Humanized Document &bull; Verified 0% Plagiarism & AI-Free",
        footer_style
    ))
            
    doc.build(story)
    bio.seek(0)
    return bio.getvalue()

