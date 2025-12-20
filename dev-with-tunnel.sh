#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting development server with ngrok tunnel...${NC}\n"

# Start Next.js dev server in background
echo -e "${YELLOW}Starting Next.js dev server...${NC}"
bun dev &
DEV_PID=$!

# Wait for dev server to start
sleep 3

# Start ngrok in background with custom domain
echo -e "${YELLOW}Starting ngrok tunnel...${NC}"
ngrok start dev &
NGROK_PID=$!

# Wait for ngrok to initialize
sleep 3

# Get the tunnel URL
TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)

# Use the custom domain directly
TUNNEL_URL="https://prompt-orca-centrally.ngrok-free.app"

echo -e "\n${GREEN}✅ Development server ready!${NC}"
echo -e "${GREEN}📱 Mobile testing URL: ${TUNNEL_URL}${NC}"
echo -e "${BLUE}💻 Local URL: http://localhost:3000${NC}\n"
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}\n"

# Function to cleanup processes on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping services...${NC}"
    kill $DEV_PID $NGROK_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup SIGINT

# Keep the script running
wait