#!/bin/bash

# Build and run backend
echo "Starting backend..."
cd backend || exit 1
python app.py &
BACKEND_PID=$!
cd ..

# Build and run frontend
echo "Starting frontend..."
cd frontend || exit 1
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for both processes
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
wait $BACKEND_PID
wait $FRONTEND_PID