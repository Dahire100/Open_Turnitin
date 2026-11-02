@echo off
title Turnitout - Dev Mode (FastAPI + Vite Hot Reload)
echo Starting FastAPI backend on http://localhost:8000 ...
start "Backend" python server.py
echo Starting Vite React Dev Server on http://localhost:5173 ...
cd frontend
bun run dev --open

