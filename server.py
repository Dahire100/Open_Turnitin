"""
Turnitout Core - High-Performance Dual-Engine API Server
Provides endpoints for:
1. Turnitin-Grade Plagiarism & AI Detection Checking (/api/check)
2. 100% Plagiarism Elimination & Zero-AI Humanization (/api/humanize)
3. Official Turnitin-Style PDF & DOCX Report Generation (/api/report/*)
4. Multi-format Document Parsing & Exporting
"""
import sys
import os
import io

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from engine.humanizer import humanize_text
from engine.detector import analyze_document_metrics
from engine.checker import run_comprehensive_check
from engine.document_parser import extract_text_from_file, create_docx, create_pdf
from engine.report_generator import generate_turnitin_pdf_report, generate_similarity_docx_report, generate_cleared_docx_report, generate_cleared_pdf_report

app = FastAPI(title="Turnitout Core Dual-Engine API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CheckRequest(BaseModel):
    text: str

class HumanizeRequest(BaseModel):
    text: str
    intensity: Optional[str] = "High"
    preserve_technical: Optional[bool] = True
    preserve_citations: Optional[bool] = True

class ExportRequest(BaseModel):
    text: str
    format: str # 'txt', 'docx', 'pdf'
    filename: Optional[str] = "turnitout_document"

class ReportRequest(BaseModel):
    text: str
    filename: Optional[str] = "Submission_Document"
    check_result: Optional[Dict[str, Any]] = None

class ClearedReportRequest(BaseModel):
    original_text: str
    humanized_text: str
    filename: Optional[str] = "Cleared_Document"
    metrics_before: Optional[Dict[str, Any]] = None
    metrics_after: Optional[Dict[str, Any]] = None

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Turnitout Core Dual Engine", "unlocked": True}

@app.post("/api/check")
def check_endpoint(req: CheckRequest):
    """Deep similarity and AI detection check with highlighted segments and sources."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    result = run_comprehensive_check(req.text)
    return result

@app.post("/api/humanize")
def humanize_endpoint(req: HumanizeRequest):
    """100% Plagiarism elimination and Zero-AI humanization."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
        
    in_words = len(req.text.split())
    print(f"--> [HUMANIZE] Input: {len(req.text)} chars, {in_words} words", flush=True)

    metrics_before = run_comprehensive_check(req.text)
    humanized = humanize_text(
        req.text,
        intensity=req.intensity,
        preserve_technical=req.preserve_technical,
        preserve_citations=req.preserve_citations
    )
    metrics_after = run_comprehensive_check(humanized)
    
    out_words = len(humanized.split())
    print(f"<-- [HUMANIZE] Output: {len(humanized)} chars, {out_words} words (Diff: {out_words - in_words})", flush=True)
    
    return {
        "original_text": req.text,
        "humanized_text": humanized,
        "metrics_before": metrics_before,
        "metrics_after": metrics_after
    }

@app.post("/api/upload")
async def upload_endpoint(file: UploadFile = File(...)):
    """Extracts text from PDF, Word, LaTeX, or Plain Text."""
    filename = file.filename
    content = await file.read()
    
    try:
        extracted_text = extract_text_from_file(content, filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
        
    check_metrics = run_comprehensive_check(extracted_text)
    
    return {
        "filename": filename,
        "text": extracted_text,
        "metrics": check_metrics
    }

@app.post("/api/report/turnitin-pdf")
def download_turnitin_pdf_report(req: ReportRequest):
    """Generates official Turnitin-style Originality & Similarity PDF report."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    check_data = req.check_result
    if not check_data:
        check_data = run_comprehensive_check(req.text)
        
    pdf_bytes = generate_turnitin_pdf_report(
        check_data,
        req.text,
        doc_title=req.filename or "Submitted_Document"
    )
    
    safe_name = (req.filename or "Turnitin_Report").replace(" ", "_")
    if not safe_name.endswith(".pdf"):
        safe_name += "_Originality_Report.pdf"
        
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}"'}
    )

@app.post("/api/report/similarity-docx")
def download_similarity_docx_report(req: ReportRequest):
    """Create an editable local similarity review in Word format."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    check_data = req.check_result or run_comprehensive_check(req.text)
    docx_bytes = generate_similarity_docx_report(check_data, req.text, doc_title=req.filename or "Submitted_Document")
    safe_name = (req.filename or "Similarity_Review").rsplit(".", 1)[0].replace(" ", "_")
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}_Similarity_Review.docx"'}
    )

@app.post("/api/report/cleared-pdf")
def download_cleared_pdf_report(req: ClearedReportRequest):
    """Generates official Turnitin-style 100% Cleared PDF Certificate & Report."""
    orig = req.original_text
    humanized = req.humanized_text
    
    m_before = req.metrics_before or run_comprehensive_check(orig)
    m_after = req.metrics_after or run_comprehensive_check(humanized)
    
    pdf_bytes = generate_cleared_pdf_report(
        orig,
        humanized,
        m_before,
        m_after,
        doc_title=req.filename or "Cleared_Document"
    )
    
    safe_name = (req.filename or "Cleared_Document").replace(" ", "_")
    if not safe_name.endswith(".pdf"):
        safe_name += "_Cleared_Report.pdf"
        
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}"'}
    )

@app.post("/api/report/cleared-docx")
def download_cleared_docx_report(req: ClearedReportRequest):
    """Generates official Word (.docx) Certificate & Cleared Output Document."""
    orig = req.original_text
    humanized = req.humanized_text
    
    m_before = req.metrics_before or run_comprehensive_check(orig)
    m_after = req.metrics_after or run_comprehensive_check(humanized)
    
    docx_bytes = generate_cleared_docx_report(
        orig,
        humanized,
        m_before,
        m_after,
        doc_title=req.filename or "Cleared_Document"
    )
    
    safe_name = (req.filename or "Cleared_Document").replace(" ", "_")
    if not safe_name.endswith(".docx"):
        safe_name += "_Cleared_Report.docx"
        
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}"'}
    )

@app.post("/api/export")
def export_endpoint(req: ExportRequest):
    """Exports raw output as TXT, DOCX, or PDF."""
    fmt = req.format.lower()
    text = req.text
    base_name = req.filename or "humanized_document"
    
    if fmt == "txt":
        return Response(
            content=text.encode("utf-8"),
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{base_name}.txt"'}
        )
    elif fmt == "docx":
        docx_bytes = create_docx(text, title=base_name)
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{base_name}.docx"'}
        )
    elif fmt == "pdf":
        pdf_bytes = create_pdf(text, title=base_name)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{base_name}.pdf"'}
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {fmt}")

# Mount static React build if it exists
DIST_DIR = os.path.join(BASE_DIR, "frontend", "dist")
if os.path.exists(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_react_app(full_path: str):
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build not found.")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port)
