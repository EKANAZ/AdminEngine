#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting Multi-Tenant SaaS Platform Setup...${NC}\n"

# Check Node.js version
echo -e "${YELLOW}Checking Node.js version...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js v14 or higher.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
if [ $(echo "$NODE_VERSION 14.0.0" | awk '{print ($1 < $2)}') -eq 1 ]; then
    echo -e "${RED}Node.js version must be 14 or higher. Current version: $NODE_VERSION${NC}"
    exit 1
fi
echo -e "${GREEN}Node.js version $NODE_VERSION is compatible.${NC}\n"

# Check PostgreSQL
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed. Please install PostgreSQL v12 or higher.${NC}"
    exit 1
fi
echo -e "${GREEN}PostgreSQL is installed.${NC}\n"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies.${NC}"
    exit 1
fi
echo -e "${GREEN}Dependencies installed successfully.${NC}\n"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << EOL
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=saas_platform

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration (for password reset)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
EOL
    echo -e "${GREEN}.env file created. Please update the values according to your environment.${NC}\n"
fi

# Create database
echo -e "${YELLOW}Creating database...${NC}"
psql -U postgres -c "CREATE DATABASE saas_platform;" 2>/dev/null || true
echo -e "${GREEN}Database created or already exists.${NC}\n"

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npm run typeorm migration:run
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to run migrations.${NC}"
    exit 1
fi
echo -e "${GREEN}Migrations completed successfully.${NC}\n"

# Start the server
echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${YELLOW}To start the server in development mode, run:${NC}"
echo -e "npm run dev\n"
echo -e "${YELLOW}To start the server in production mode, run:${NC}"
echo -e "npm run start\n"
echo -e "${YELLOW}API documentation is available in API.md${NC}" 