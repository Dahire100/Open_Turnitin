# How to Run Open Turnitin (Turnitout Core)

This guide provides step-by-step instructions to set up, build, and run the project locally.

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed on your system:

- **Python 3.10+** (Python 3.12 - 3.14 recommended)
  - Verify installation: `python --version` or `py --version`
- **Node.js 18+** & package manager (`bun` or `npm`)
  - Verify installation: `node --version` and `bun --version` (or `npm --version`)

---

## ⚙️ 1. Environment & Dependency Setup

### Python Backend Dependencies
Install the required Python libraries:

```bash
pip install fastapi uvicorn pydantic python-docx reportlab pypdf
```

*(Note: On Windows, if `python` opens the Microsoft Store, use the Python launcher: `py -m pip install fastapi uvicorn pydantic python-docx reportlab pypdf`)*

---

### Frontend Dependencies & Build (Optional if `frontend/dist` exists)
If you need to install frontend dependencies or rebuild the UI:

```bash
cd frontend
bun install   # or: npm install
bun run build # or: npm run build
cd ..
```

---

## 🚀 2. Running the Application

### Option A: Standard Integrated Mode (Recommended)
This runs the FastAPI ASGI server, which serves both the API and the compiled React UI on port **8000**:

```bash
python server.py
```
*(On Windows using the Python Launcher: `py server.py`)*

Once started, open your web browser at:
👉 **[http://localhost:8000](http://localhost:8000)**

---

### Option B: One-Click Windows Script
If you are on Windows, simply double-click or run:

```cmd
run_app.bat
```
This automatically launches your default browser at `http://localhost:8000` and starts the FastAPI server.

---

### Option C: Development Mode (With Vite Hot Reload)
Use this mode if you want to make live code changes to the React frontend with Hot Module Replacement (HMR).

**On Windows:**
```cmd
dev.bat
```

**Or manually across two terminals:**
1. **Terminal 1 (Backend):**
   ```bash
   python server.py
   ```
2. **Terminal 2 (Frontend):**
   ```bash
   cd frontend
   bun run dev   # or: npm run dev
   ```
- Frontend dev server: **[http://localhost:5173](http://localhost:5173)**
- Backend API server: **[http://localhost:8000](http://localhost:8000)**

---

## 🔍 3. Verification & API Documentation

After launching the server, verify the endpoints:

| Resource | URL | Description |
| :--- | :--- | :--- |
| **Web Interface** | `http://localhost:8000` | Full single-page React application |
| **Health Check** | `http://localhost:8000/api/health` | Service status JSON |
| **Interactive API Docs** | `http://localhost:8000/docs` | Swagger UI documentation |
| **Alternative API Docs** | `http://localhost:8000/redoc` | ReDoc API specifications |

---

## 🛠️ Troubleshooting

- **Port 8000 is already in use:**
  Check running processes on port 8000:
  ```powershell
  # Windows PowerShell:
  Get-NetTCPConnection -LocalPort 8000
  ```
  Terminate the process holding the port or change the port inside `server.py` (`uvicorn.run(..., port=8000)`).

- **Windows execution alias issue (`The file cannot be accessed by the system`):**
  Use `py server.py` instead of `python server.py`.
