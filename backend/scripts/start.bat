@echo off
echo 🚀 Starting Agent Arena Live Backend...

REM Check if .env exists
if not exist ".env" (
    echo ⚠️  .env file not found. Copying from .env.example...
    copy ".env.example" ".env"
    echo ✅ Created .env file. Please update it with your database credentials.
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Check if PostgreSQL service is running (Windows)
sc query postgresql-x64-16 | find "RUNNING" >nul
if errorlevel 1 (
    echo ❌ PostgreSQL service is not running. Please start PostgreSQL service first.
    echo    You can start it from Services.msc or run: net start postgresql-x64-16
    pause
    exit /b 1
)

REM Run migrations
echo 🔧 Running database migrations...
npm run db:migrate

REM Ask if user wants to seed the database
set /p seeddb="🌱 Do you want to seed the database with sample data? [y/N]: "
if /i "%seeddb%"=="y" (
    echo 🌱 Seeding database...
    npm run seed
)

REM Start the development server
echo 🚀 Starting development server...
npm run dev