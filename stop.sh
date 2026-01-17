#!/bin/bash

#
# Deep Sci-Fi Stack Stop Script
# Stops: Web App + Kelpie Server + PostgreSQL
#

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
KELPIE_DIR="$SCRIPT_DIR/kelpie"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Deep Sci-Fi - Stop Script               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Stop Next.js web app
echo -e "${YELLOW}Stopping Next.js web app...${NC}"
if pgrep -f "next-server" > /dev/null || pgrep -f "next dev" > /dev/null; then
    pkill -f "next-server" 2>/dev/null
    pkill -f "next dev" 2>/dev/null
    echo -e "${GREEN}✓ Next.js stopped${NC}"
else
    echo -e "${YELLOW}⚠ Next.js was not running${NC}"
fi

# Stop WebSocket server
echo ""
echo -e "${YELLOW}Stopping WebSocket server...${NC}"
WS_PID_FILE="$SCRIPT_DIR/apps/web/.ws.pid"
if [ -f "$WS_PID_FILE" ]; then
    WS_PID=$(cat "$WS_PID_FILE")
    if kill -0 $WS_PID 2>/dev/null; then
        kill $WS_PID 2>/dev/null
        echo -e "${GREEN}✓ WebSocket server stopped (PID: $WS_PID)${NC}"
    else
        echo -e "${YELLOW}⚠ WebSocket server was not running${NC}"
    fi
    rm -f "$WS_PID_FILE"
else
    # Try to find and kill by process name
    if pgrep -f "ws-server.ts" > /dev/null; then
        pkill -f "ws-server.ts" 2>/dev/null
        echo -e "${GREEN}✓ WebSocket server stopped${NC}"
    else
        echo -e "${YELLOW}⚠ WebSocket server was not running${NC}"
    fi
fi

# Stop Kelpie server
echo ""
echo -e "${YELLOW}Stopping Kelpie server...${NC}"
KELPIE_PID_FILE="$KELPIE_DIR/.kelpie.pid"
if [ -f "$KELPIE_PID_FILE" ]; then
    KELPIE_PID=$(cat "$KELPIE_PID_FILE")
    if kill -0 $KELPIE_PID 2>/dev/null; then
        kill $KELPIE_PID 2>/dev/null
        # Wait for graceful shutdown
        sleep 2
        # Force kill if still running
        if kill -0 $KELPIE_PID 2>/dev/null; then
            kill -9 $KELPIE_PID 2>/dev/null
        fi
        echo -e "${GREEN}✓ Kelpie server stopped (PID: $KELPIE_PID)${NC}"
    else
        echo -e "${YELLOW}⚠ Kelpie server was not running${NC}"
    fi
    rm -f "$KELPIE_PID_FILE"
else
    # Try to find and kill by process name
    if pgrep -f "kelpie-server" > /dev/null; then
        pkill -f "kelpie-server" 2>/dev/null
        sleep 2
        echo -e "${GREEN}✓ Kelpie server stopped${NC}"
    else
        echo -e "${YELLOW}⚠ Kelpie server was not running${NC}"
    fi
fi

# Stop PostgreSQL container
echo ""
echo -e "${YELLOW}Stopping PostgreSQL...${NC}"
if docker ps | grep -q "deep-sci-fi-postgres"; then
    docker stop deep-sci-fi-postgres > /dev/null
    echo -e "${GREEN}✓ PostgreSQL stopped${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL was not running${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  All services stopped!${NC}"
echo ""
echo -e "  To start again: ${YELLOW}./start.sh${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
