#!/bin/bash

# Agent Arena Live Backend Startup Script

echo "🚀 Starting Agent Arena Live Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your database credentials."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if PostgreSQL is running
if ! pg_isready > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   On macOS with Homebrew: brew services start postgresql"
    echo "   On Ubuntu: sudo systemctl start postgresql"
    echo "   On Windows: Start PostgreSQL service"
    exit 1
fi

# Check if database exists
DB_NAME=$(grep DATABASE_URL .env | cut -d'/' -f4 | cut -d'?' -f1)
if [ -n "$DB_NAME" ]; then
    if ! psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
        echo "📊 Creating database: $DB_NAME..."
        createdb $DB_NAME
    fi
fi

# Run migrations
echo "🔧 Running database migrations..."
npm run db:migrate

# Ask if user wants to seed the database
read -p "🌱 Do you want to seed the database with sample data? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npm run seed
fi

# Start the development server
echo "🚀 Starting development server..."
npm run dev