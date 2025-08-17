# 🪙 ERC20 Token Testing Guide

## 🎯 Quick Start Testing

### Step 1: Setup Test Environment
1. **Ensure Hardhat network is running**:
   ```bash
   cd contract
   npx hardhat node
   ```

2. **Deploy contracts** (if not already deployed):
   ```bash
   npx hardhat run scripts/deploy-token.ts --network localhost
   ```

3. **Start frontend**:
   ```bash
   cd client
   npm run dev
   ```

4. **Open browser**: http://localhost:3001

### Step 2: MetaMask Configuration

#### Add Hardhat Network
- **Network Name**: Hardhat Local
- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 31337
- **Currency Symbol**: ETH

#### Import Test Accounts
Use these private keys to import test accounts:

**Account #0 (Owner - Has 1M DDT tokens)**
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

**Account #1 (Test User A)**
```
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

**Account #2 (Test User B)**
```
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
```

## 🧪 Testing Scenarios

### Scenario 1: Connect to DAppToken
1. **Connect MetaMask** with Account #0
2. **Go to "ERC20 Tokens" tab**
3. **Enter token address**: `0x0165878A594ca255338adfa4d48449f69242Eb8F`
4. **Click "Connect Token"**
5. **Verify token info displays**:
   - Name: DApp Demo Token
   - Symbol: DDT
   - Your Balance: 1,000,000 DDT
   - Owner: Yes

### Scenario 2: Basic Token Transfer
1. **Stay on Account #0**
2. **Transfer 5000 DDT to Account #1**:
   - Recipient: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - Amount: 5000
   - Click "Send DDT"
3. **Confirm transaction in MetaMask**
4. **Verify transaction appears in history**
5. **Switch to Account #1 in MetaMask**
6. **Refresh page and connect token**
7. **Verify balance shows 5000 DDT**

### Scenario 3: Multi-User Transfer Chain
1. **Account #0 → Account #1**: 10000 DDT
2. **Switch to Account #1**
3. **Account #1 → Account #2**: 3000 DDT
4. **Switch to Account #2**
5. **Account #2 → Account #0**: 1000 DDT
6. **Verify all balances and transaction histories**

### Scenario 4: Owner Functions (Minting)
1. **Connect with Account #0** (Owner)
2. **In "Owner Functions" section**:
   - Mint Amount: 50000
   - Click "Mint"
3. **Verify**:
   - Your balance increases by 50000
   - Transaction appears in history as "MINT"
   - Total supply increases

### Scenario 5: Token Burning
1. **Stay on Account #0**
2. **In "Owner Functions" section**:
   - Burn Amount: 25000
   - Click "Burn"
3. **Verify**:
   - Your balance decreases by 25000
   - Transaction appears in history as "BURN"
   - Total supply decreases

### Scenario 6: Error Testing
1. **Try to transfer more than balance**:
   - Amount: 999999999
   - Should show error message
2. **Try invalid recipient address**:
   - Recipient: "invalid-address"
   - Should show "Invalid recipient address"
3. **Switch to Account #1 (non-owner)**
4. **Try to mint tokens**:
   - Should show "Mint failed. Make sure you are the owner."

## 📊 Expected Results

### Initial State
- **Account #0**: 1,000,000 DDT (Owner)
- **Account #1**: 0 DDT
- **Account #2**: 0 DDT
- **Total Supply**: 1,000,000 DDT

### After Scenario 2
- **Account #0**: 995,000 DDT
- **Account #1**: 5,000 DDT
- **Account #2**: 0 DDT

### After Scenario 3
- **Account #0**: 986,000 DDT
- **Account #1**: 7,000 DDT
- **Account #2**: 3,000 DDT

### After Scenarios 4 & 5
- **Account #0**: 1,011,000 DDT (986k + 50k minted - 25k burned)
- **Total Supply**: 1,025,000 DDT (1M + 50k minted - 25k burned)

## 🔍 Verification Methods

### Check Balances via Console
```bash
cd contract
npx hardhat console --network localhost
```

```javascript
const token = await ethers.getContractAt("DAppToken", "0x0165878A594ca255338adfa4d48449f69242Eb8F");

// Check balance
const balance = await token.balanceOf("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
console.log("Balance:", ethers.formatEther(balance), "DDT");

// Check total supply
const supply = await token.totalSupply();
console.log("Total Supply:", ethers.formatEther(supply), "DDT");

// Check owner
const owner = await token.owner();
console.log("Owner:", owner);
```

### Add DDT to MetaMask
1. **In MetaMask, click "Import tokens"**
2. **Token Contract Address**: `0x0165878A594ca255338adfa4d48449f69242Eb8F`
3. **Token Symbol**: DDT
4. **Token Decimals**: 18
5. **Verify token appears in wallet**

## 🚨 Troubleshooting

### Common Issues

**"Failed to connect to token contract"**
- Verify contract address is correct
- Ensure you're on Hardhat network (Chain ID: 31337)
- Check if Hardhat node is running

**"Transaction failed"**
- Check if you have enough ETH for gas
- Verify recipient address is valid
- Ensure you have sufficient token balance

**"Mint failed"**
- Only Account #0 can mint tokens
- Switch to the owner account

**Token not showing in MetaMask**
- Manually add token using contract address
- Refresh MetaMask
- Switch networks and back

### Reset Everything
If you need to start fresh:
1. **Stop Hardhat node** (Ctrl+C)
2. **Restart**: `npx hardhat node`
3. **Redeploy contracts**:
   ```bash
   npx hardhat run scripts/deploy-token.ts --network localhost
   ```
4. **Update contract address in frontend**

## 📱 Mobile Testing

For mobile testing:
1. **Find your computer's IP address**
2. **Use IP instead of localhost**:
   - RPC URL: `http://YOUR_IP:8545`
   - Frontend: `http://YOUR_IP:3001`

## 🎉 Success Criteria

You've successfully tested ERC20 functionality when:
- ✅ Token information displays correctly
- ✅ Transfers work between different accounts
- ✅ Balances update in real-time
- ✅ Transaction history shows all operations
- ✅ Minting increases total supply
- ✅ Burning decreases total supply
- ✅ Error handling works for invalid inputs
- ✅ Only owner can mint tokens
- ✅ MetaMask shows correct DDT balances

---

**Happy Testing! 🚀**

This comprehensive testing ensures your ERC20 implementation is production-ready and demonstrates professional Web3 development skills.
