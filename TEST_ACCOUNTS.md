# 🔑 Test Accounts for ERC20 Testing

## Hardhat Local Network Test Accounts

When you run `npx hardhat node`, you get 20 pre-funded test accounts. Here are the details:

### Account #0 (Contract Owner)
- **Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Balance**: 10,000 ETH
- **Role**: Contract deployer and DAppToken owner (has 1,000,000 DDT tokens)

### Account #1 (Test User A)
- **Address**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Private Key**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **Balance**: 10,000 ETH
- **Role**: Primary test user for transfers

### Account #2 (Test User B)
- **Address**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **Private Key**: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
- **Balance**: 10,000 ETH
- **Role**: Secondary test user for transfers

### Account #3 (Test User C)
- **Address**: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- **Private Key**: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`
- **Balance**: 10,000 ETH
- **Role**: Third test user for multi-party testing

### Account #4 (Test User D)
- **Address**: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`
- **Private Key**: `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a`
- **Balance**: 10,000 ETH
- **Role**: Fourth test user

### Account #5 (Test User E)
- **Address**: `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc`
- **Private Key**: `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba`
- **Balance**: 10,000 ETH
- **Role**: Fifth test user

## 🧪 ERC20 Testing Scenarios

### Scenario 1: Basic Token Transfer
1. **Connect with Account #0** (Owner)
2. **Go to ERC20 Tokens tab**
3. **Connect to token**: `0x0165878A594ca255338adfa4d48449f69242Eb8F`
4. **Transfer 1000 DDT to Account #1**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
5. **Switch to Account #1** in MetaMask
6. **Verify balance** shows 1000 DDT

### Scenario 2: Multi-User Testing
1. **Account #0 → Account #1**: Transfer 5000 DDT
2. **Account #0 → Account #2**: Transfer 3000 DDT
3. **Account #1 → Account #2**: Transfer 1000 DDT
4. **Account #2 → Account #3**: Transfer 500 DDT

### Scenario 3: Owner Functions Testing
1. **Connect with Account #0** (Owner)
2. **Mint 10000 DDT** to Account #1
3. **Burn 1000 DDT** from your balance
4. **Verify total supply** changes accordingly

### Scenario 4: Error Testing
1. **Try to transfer more than balance** (should fail)
2. **Try to transfer to invalid address** (should fail)
3. **Try to mint with non-owner account** (should fail)

## 🔧 MetaMask Setup Instructions

### Step 1: Add Hardhat Network
1. Open MetaMask
2. Click network dropdown → "Add Network"
3. **Network Name**: Hardhat Local
4. **RPC URL**: http://127.0.0.1:8545
5. **Chain ID**: 31337
6. **Currency Symbol**: ETH

### Step 2: Import Test Accounts
1. Click account icon → "Import Account"
2. Paste private key from above
3. Repeat for multiple accounts
4. Name them (e.g., "Test User A", "Test User B")

### Step 3: Add DDT Token
1. In MetaMask, click "Import tokens"
2. **Token Contract Address**: `0x0165878A594ca255338adfa4d48449f69242Eb8F`
3. **Token Symbol**: DDT
4. **Token Decimals**: 18

## 🎯 Quick Test Commands

### Deploy Fresh Contracts
```bash
cd contract
npx hardhat run scripts/deploy-counter.ts --network localhost
npx hardhat run scripts/deploy-token.ts --network localhost
```

### Check Token Balance
```bash
npx hardhat console --network localhost
```
Then in console:
```javascript
const token = await ethers.getContractAt("DAppToken", "0x0165878A594ca255338adfa4d48449f69242Eb8F");
const balance = await token.balanceOf("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
console.log(ethers.formatEther(balance));
```

## 🚨 Important Notes

1. **Private Keys**: These are test keys only - NEVER use on mainnet
2. **Reset Network**: Restart Hardhat node to reset all balances
3. **Token Owner**: Only Account #0 can mint new tokens
4. **Gas Fees**: All transactions use test ETH (free)
5. **Network Reset**: Balances reset when you restart Hardhat node

## 🔄 Reset Instructions

If you need to reset everything:
1. Stop Hardhat node (Ctrl+C)
2. Restart: `npx hardhat node`
3. Redeploy contracts
4. Update contract addresses in frontend

## 📱 Mobile Testing

For mobile testing, use the network IP:
- **RPC URL**: http://YOUR_IP_ADDRESS:8545
- Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

---

**Happy Testing! 🎉**

Use these accounts to thoroughly test all ERC20 functionality including transfers, minting, burning, and error handling.
