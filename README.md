# Open Turnitin — Plagiarism & AI Footprint Removal Engine

<p align="center">
  <strong>A deterministic, privacy-first, zero-generative-AI footprint removal and academic similarity checking engine.</strong>
</p>

---

## 🚀 Overview

**Open Turnitin** is a high-performance academic writing, similarity detection, and humanization engine. It provides:
1. **Turnitin-Grade Plagiarism & Similarity Checking**: Sentence-level phrase shingle detection, database categorization, and interactive highlight attribution.
2. **100% Plagiarism Removal & Zero-AI Humanization**: Deterministic 4-gram shattering, shingle disruption, and cadence variation without modifying technical terms, formulas, or academic citations.
3. **Dual Circular Gauge Originality Scorecard**: Real-time visual comparison of Plagiarized % (Exact & Partial matches) vs Unique Original Content.
4. **Multi-Format Export & Certification**:
   - Clean Manuscript `.docx` (Microsoft Word)
   - Publication-Ready Academic Manuscript `.pdf`
   - Clean Plain Text `.txt`
   - Official **100% Cleared Originality & Humanization Certificate Report** in both **PDF** and **Word (.docx)** formats.

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Python 3.14 + FastAPI + Uvicorn ASGI Server
- **Frontend**: React 19 + Vite + Modern CSS Design System + Lucide Icons
- **Document Engine**: ReportLab (PDF generation) + python-docx (Word document generation) + PyPDF
- **Linguistic Engine**: Deterministic syntactic restructuring, multi-word shingle disruptors, and natural academic lexicon alignment.

---

## 💻 Getting Started

### Prerequisites
- Python 3.10+ (Recommended Python 3.12 - 3.14)
- Node.js & Bun / npm (for frontend builds)

### 1. Run Application
Simply run:
```bash
python server.py
```
Or execute the launch script on Windows:
```cmd
run_app.bat
```

The application will be live at:
**http://localhost:8000**

### 2. Frontend Development
If you want to edit or develop the React frontend:
```bash
cd frontend
bun install   # or npm install
bun run dev   # or npm run dev
```

To build production assets:
```bash
cd frontend
bun run build # or npm run build
```

---

## 🛡️ Privacy & Security

- **100% In-Memory Processing**: Text and documents submitted are analyzed ephemeral in-memory.
- **Zero Permanent Data Retention**: No submissions are stored in external databases or used to train machine learning models.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

Developed & Maintained by **Devendra Ahire** ([@Dahire100](https://github.com/Dahire100)).
