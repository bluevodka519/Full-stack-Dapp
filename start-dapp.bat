@echo off
echo ========================================
echo   Solidity Full Stack DApp Launcher
echo ========================================
echo.

echo [1/4] Starting Hardhat Network...
cd contract
start "Hardhat Network" cmd /k "npx hardhat node"
echo ✅ Hardhat network starting in new window...
echo.

echo [2/4] Waiting 5 seconds for network to initialize...
timeout /t 5 /nobreak > nul
echo.

echo [3/4] Deploying Counter Contract...
npx hardhat run scripts/deploy-counter.ts --network localhost
echo.

echo [4/4] Starting Frontend...
cd ..\client
start "Frontend Server" cmd /k "npm run dev"
echo ✅ Frontend starting in new window...
echo.

echo ========================================
echo   🎉 DApp Launch Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Configure MetaMask with Hardhat network
echo 2. Import test account private key
echo 3. Open http://localhost:3000
echo 4. Copy contract address from deployment output
echo.
echo Press any key to exit...
pause > nul
