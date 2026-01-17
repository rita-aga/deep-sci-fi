#!/bin/bash

# Deep Sci-Fi - One-Command Startup Script
# Usage: ./start.sh

set -e  # Exit on any error

echo "🌌 Deep Sci-Fi - Starting Everything..."
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if .env exists in apps/web
if [ ! -f "apps/web/.env" ]; then
    print_warning ".env not found, creating from .env.example..."
    cp apps/web/.env.example apps/web/.env

    # Generate NEXTAUTH_SECRET
    SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|NEXTAUTH_SECRET=\".*\"|NEXTAUTH_SECRET=\"$SECRET\"|" apps/web/.env
    else
        # Linux
        sed -i "s|NEXTAUTH_SECRET=\".*\"|NEXTAUTH_SECRET=\"$SECRET\"|" apps/web/.env
    fi

    print_success ".env created with random NEXTAUTH_SECRET"
    print_warning "Using existing ANTHROPIC_API_KEY from .env.example"
else
    print_success ".env already exists"
fi

# 1. Start PostgreSQL
echo ""
echo "📦 Starting PostgreSQL..."
if docker ps | grep -q deep-sci-fi-postgres; then
    print_success "PostgreSQL already running"
else
    if docker ps -a | grep -q deep-sci-fi-postgres; then
        print_warning "Starting existing PostgreSQL container..."
        docker start deep-sci-fi-postgres
    else
        print_warning "Creating new PostgreSQL container..."
        docker run -d \
            --name deep-sci-fi-postgres \
            -e POSTGRES_USER=deepscifi \
            -e POSTGRES_PASSWORD=dev_password_change_in_production \
            -e POSTGRES_DB=deep_sci_fi_dev \
            -p 5433:5432 \
            pgvector/pgvector:pg16

        # Wait for PostgreSQL to be ready
        echo "Waiting for PostgreSQL to be ready..."
        sleep 5
    fi
    print_success "PostgreSQL running on localhost:5433"
fi

# 2. Start Kelpie Server
echo ""
echo "🤖 Starting Kelpie Server..."
cd kelpie

# Check if .env exists in kelpie directory, otherwise use root .env
if [ -f ".env" ]; then
    print_success "Loading environment from kelpie/.env"
    source .env
elif [ -f "../.env" ]; then
    print_success "Loading environment from root .env"
    source ../.env
else
    print_warning "No .env file found, API keys must be set in environment"
fi

# Check if FoundationDB cluster file exists
FDB_CLUSTER_FILE="/usr/local/etc/foundationdb/fdb.cluster"
if [ ! -f "$FDB_CLUSTER_FILE" ]; then
    print_error "FoundationDB cluster file not found at $FDB_CLUSTER_FILE"
    print_error "Please install FoundationDB or update the path"
    exit 1
fi

# Kill any existing Kelpie server
if [ -f ".kelpie.pid" ]; then
    OLD_PID=$(cat .kelpie.pid)
    if kill -0 $OLD_PID 2>/dev/null; then
        print_warning "Stopping existing Kelpie server (PID: $OLD_PID)..."
        kill $OLD_PID 2>/dev/null || true
        sleep 2
    fi
    rm -f .kelpie.pid
fi

# Start Kelpie server in background
print_warning "Starting Kelpie server..."
cargo run -p kelpie-server --features fdb -- --fdb-cluster-file "$FDB_CLUSTER_FILE" > .kelpie.log 2>&1 &
KELPIE_PID=$!
echo $KELPIE_PID > .kelpie.pid

# Wait for Kelpie to be ready
echo "Waiting for Kelpie server to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8283/health > /dev/null 2>&1 || curl -s http://localhost:8283/v1/health > /dev/null 2>&1; then
        print_success "Kelpie server ready on localhost:8283 (PID: $KELPIE_PID)"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Kelpie server failed to start. Check kelpie/.kelpie.log for details"
        tail -20 .kelpie.log
        exit 1
    fi
    sleep 1
done
cd ..

# 3. Link local packages and install dependencies
echo ""
echo "📚 Checking dependencies..."
if [ ! -d "apps/web/node_modules" ]; then
    print_warning "Setting up local packages..."

    # Create symlinks for local packages (workaround for npm workspace issues)
    mkdir -p apps/web/node_modules/@deep-sci-fi
    cd apps/web/node_modules/@deep-sci-fi

    # Remove existing symlinks if any
    rm -f letta types db

    # Create symlinks
    ln -s ../../../../packages/letta letta
    ln -s ../../../../packages/types types
    ln -s ../../../../packages/db db

    cd ../../../..

    print_warning "Installing dependencies (this may take a few minutes)..."
    cd apps/web
    npm install --legacy-peer-deps
    cd ../..
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

# 4. Setup database
echo ""
echo "🗄️  Setting up database..."

# Run Prisma commands from packages/db where Prisma is installed
cd packages/db

# Ensure Prisma dependencies are installed
if [ ! -d "node_modules/.bin" ]; then
    print_warning "Installing Prisma dependencies..."
    npm install --legacy-peer-deps
fi

# Export DATABASE_URL from apps/web/.env for Prisma
export DATABASE_URL=$(grep "^DATABASE_URL=" ../../apps/web/.env | cut -d '=' -f2- | tr -d '"')

# Check if database is already set up
if npx prisma db execute --stdin <<< "SELECT 1 FROM \"User\" LIMIT 1;" 2>/dev/null; then
    print_success "Database already set up"
else
    print_warning "Pushing database schema..."
    npx prisma db push --skip-generate
    print_success "Database schema created"
fi

# Always generate Prisma client
print_warning "Generating Prisma client..."
npx prisma generate

# Copy Prisma binary to web app (needed for Next.js with symlinked packages)
print_warning "Copying Prisma binary to web app..."
mkdir -p ../../apps/web/node_modules/.prisma/client
cp -r node_modules/.prisma/client/* ../../apps/web/node_modules/.prisma/client/
cd ../..
print_success "Prisma client generated and binary copied"

# 5. Start WebSocket Server
echo ""
echo "🔌 Starting WebSocket server..."
cd apps/web

# Kill any existing WebSocket server
if [ -f ".ws.pid" ]; then
    OLD_PID=$(cat .ws.pid)
    if kill -0 $OLD_PID 2>/dev/null; then
        print_warning "Stopping existing WebSocket server (PID: $OLD_PID)..."
        kill $OLD_PID 2>/dev/null || true
        sleep 1
    fi
    rm -f .ws.pid
fi

# Start WebSocket server in background
bun run server/ws-server.ts > .ws.log 2>&1 &
WS_PID=$!
echo $WS_PID > .ws.pid
print_success "WebSocket server starting (PID: $WS_PID)..."

# Wait for WebSocket server to be ready
for i in {1..10}; do
    if curl -s http://localhost:8284/health > /dev/null 2>&1; then
        print_success "WebSocket server ready on localhost:8284"
        break
    fi
    if [ $i -eq 10 ]; then
        print_warning "WebSocket server may still be starting..."
    fi
    sleep 0.5
done

cd ../..

# 6. Start Observability Dashboard (Letta UI pointing to Kelpie)
echo ""
echo "📊 Starting Observability Dashboard..."
cd letta-ui

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_warning "Installing dashboard dependencies..."
    bun install
fi

# Kill any existing dashboard server
if [ -f ".ui.pid" ]; then
    OLD_PID=$(cat .ui.pid)
    if kill -0 $OLD_PID 2>/dev/null; then
        print_warning "Stopping existing dashboard (PID: $OLD_PID)..."
        kill $OLD_PID 2>/dev/null || true
        sleep 1
    fi
    rm -f .ui.pid
fi

# Start dashboard in background on port 4000, pointing to Kelpie server
LETTA_BASE_URL=http://localhost:8283 PORT=4000 bun run dev > .ui.log 2>&1 &
UI_PID=$!
echo $UI_PID > .ui.pid
print_success "Dashboard starting (PID: $UI_PID)..."

# Wait for dashboard to be ready
for i in {1..10}; do
    if curl -s http://localhost:4000 > /dev/null 2>&1; then
        print_success "Dashboard ready on localhost:4000"
        break
    fi
    if [ $i -eq 10 ]; then
        print_warning "Dashboard may still be starting..."
    fi
    sleep 0.5
done

cd ..

# 7. Start the web app
echo ""
echo "🚀 Starting web app..."
echo ""
print_success "All services ready!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🌌 Deep Sci-Fi is starting..."
echo ""
echo "  Web App:        http://localhost:3030"
echo "  Dashboard:      http://localhost:4000"
echo "  Kelpie Server:  http://localhost:8283"
echo "  WebSocket:      ws://localhost:8284"
echo "  PostgreSQL:     localhost:5433"
echo ""
echo "  Metrics:        http://localhost:8283/metrics"
echo "  Kelpie logs:    tail -f kelpie/.kelpie.log"
echo ""
echo "  Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd apps/web
npm run dev
