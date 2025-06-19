@echo off
setlocal enabledelayedexpansion

echo Starting Multi-Tenant SaaS Platform Setup...

:: Check Node.js version
echo Checking Node.js version...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed. Please install Node.js v14 or higher.
    exit /b 1
)

for /f "tokens=* usebackq" %%F in (`node -v`) do (
    set NODE_VERSION=%%F
)
set NODE_VERSION=%NODE_VERSION:~1%
echo Node.js version %NODE_VERSION% is compatible.

:: Check PostgreSQL
echo Checking PostgreSQL...
where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo PostgreSQL is not installed. Please install PostgreSQL v12 or higher.
    exit /b 1
)
echo PostgreSQL is installed.

:: Install dependencies
echo Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo Failed to install dependencies.
    exit /b 1
)
echo Dependencies installed successfully.

:: Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    (
        echo # Server Configuration
        echo PORT=3000
        echo NODE_ENV=development
        echo.
        echo # Database Configuration
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_USERNAME=postgres
        echo DB_PASSWORD=postgres
        echo DB_NAME=saas_platform
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
        echo JWT_EXPIRES_IN=24h
        echo.
        echo # Email Configuration (for password reset)
        echo SMTP_HOST=smtp.example.com
        echo SMTP_PORT=587
        echo SMTP_USER=your_email@example.com
        echo SMTP_PASS=your_email_password
    ) > .env
    echo .env file created. Please update the values according to your environment.
)

:: Create database
echo Creating database...
psql -U postgres -c "CREATE DATABASE saas_platform;" 2>nul
echo Database created or already exists.

:: Run migrations
echo Running database migrations...
call npm run typeorm migration:run
if %ERRORLEVEL% neq 0 (
    echo Failed to run migrations.
    exit /b 1
)
echo Migrations completed successfully.

:: Start the server
echo Setup completed successfully!
echo To start the server in development mode, run:
echo npm run dev
echo.
echo To start the server in production mode, run:
echo npm run start
echo.
echo API documentation is available in API.md

npm run dev

endlocal 