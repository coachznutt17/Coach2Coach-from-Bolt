#!/bin/bash

# Coach2Coach Network - Local Development Startup Script

echo "🚀 Coach2Coach Network - Starting Local Development Environment"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please create .env file with your Supabase credentials."
    exit 1
fi

# Check if database password is set
if grep -q "YOUR_ACTUAL_DB_PASSWORD" .env; then
    echo "⚠️  WARNING: Database password not set in .env file!"
    echo ""
    echo "To fix this:"
    echo "1. Go to: https://supabase.com/dashboard/project/xkjidqfsenjrcabsagoi/settings/database"
    echo "2. Copy your database connection string"
    echo "3. Update SUPABASE_DB_URL and DATABASE_URL in .env file"
    echo ""
    echo "Press Ctrl+C to exit and fix, or Enter to continue anyway..."
    read
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ npm install failed!"
        exit 1
    fi
fi

echo ""
echo "✅ Starting servers..."
echo ""
echo "Backend API will run on: http://localhost:8787"
echo "Frontend will run on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start backend server in background
echo "Starting backend server..."
npm run server:start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "Starting frontend server..."
npm run dev

# When frontend exits (Ctrl+C), kill backend too
echo ""
echo "Shutting down servers..."
kill $BACKEND_PID
echo "✅ Servers stopped"
