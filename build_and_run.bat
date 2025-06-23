@echo off
REM Build and run backend

echo Starting backend...
cd backend || exit /b 1
start "Backend" cmd /c python app.py
cd ..

REM Build and run frontend

echo Starting frontend...
cd frontend || exit /b 1
start "Frontend" cmd /c npm run dev
cd ..

echo Backend and frontend started in separate windows.
pause
