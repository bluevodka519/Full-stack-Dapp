#!/bin/bash

echo "========================================"
echo "  Solidity Full Stack DApp Launcher"
echo "========================================"
echo

echo "[1/4] Starting Hardhat Network..."
cd contract
gnome-terminal --title="Hardhat Network" -- bash -c "npx hardhat node; exec bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npx hardhat node"' 2>/dev/null || \
echo "Please manually run: npx hardhat node"
echo "✅ Hardhat network starting in new terminal..."
echo

echo "[2/4] Waiting 5 seconds for network to initialize..."
sleep 5
echo

echo "[3/4] Deploying Counter Contract..."
npx hardhat run scripts/deploy-counter.ts --network localhost
echo

echo "[4/4] Starting Frontend..."
cd ../client
gnome-terminal --title="Frontend Server" -- bash -c "npm run dev; exec bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm run dev"' 2>/dev/null || \
echo "Please manually run: npm run dev"
echo "✅ Frontend starting in new terminal..."
echo

echo "========================================"
echo "  🎉 DApp Launch Complete!"
echo "========================================"
echo
echo "Next steps:"
echo "1. Configure MetaMask with Hardhat network"
echo "2. Import test account private key"
echo "3. Open http://localhost:3000"
echo "4. Copy contract address from deployment output"
echo
echo "Press Enter to exit..."
read
