#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Setting up Multi-Tenant SaaS Platform...${NC}\n"

# Create necessary directories
echo -e "${YELLOW}Creating project directories...${NC}"
mkdir -p logs
mkdir -p src/migrations
mkdir -p src/subscribers
mkdir -p src/modules
mkdir -p src/types

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
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h

# Email Configuration (for password reset)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password

# Logging Configuration
LOG_LEVEL=debug
LOG_FILE_PATH=logs/app.log

# Security Configuration
BCRYPT_SALT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Module Configuration
DEFAULT_MODULES=["crm", "inventory", "billing"]
MODULE_STORAGE_PATH=./modules
EOL
    echo -e "${GREEN}.env file created. Please update the values according to your environment.${NC}\n"
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Create database
echo -e "${YELLOW}Creating database...${NC}"
createdb saas_platform || true

# Initialize database
echo -e "${YELLOW}Initializing database...${NC}"
npm run init-db

echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${YELLOW}To start the server in development mode, run:${NC}"
echo -e "npm run dev\n"
echo -e "${YELLOW}To start the server in production mode, run:${NC}"
echo -e "npm run build\nnpm start\n" 