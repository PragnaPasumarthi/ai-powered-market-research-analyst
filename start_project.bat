@echo off
echo Starting Backend Server...
start cmd /k "cd backend && call venv\Scripts\activate.bat 2>nul || echo Virtual Environment not found, using global python && python main.py"

echo Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo All servers starting!
echo Visit http://localhost:5173 to view the Market Research AI
