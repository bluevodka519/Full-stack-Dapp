'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

// Contract Configuration
const DEFAULT_CONTRACT_ADDRESS = '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6'
const CONTRACT_NETWORK = 'Hardhat Local Network'

interface TokenInfo {
  name: string
  symbol: string
  decimals: number
  totalSupply: string
  owner: string
}

interface TokenTransferRecord {
  from: string
  to: string
  amount: string
  hash: string
  timestamp: number
  type: 'transfer' | 'mint' | 'burn' | 'stake' | 'unstake'
}

interface StakeInfo {
  index: number
  amount: string
  startTime: Date
  duration: number
  unlockTime: Date
  claimed: boolean
  reward: string
}

/**
 * Complete ERC20 Token ABI with Staking functionality
 */
const TOKEN_ABI = [
  // Standard ERC20 functions
  "function name() view returns (string)",
  "function symbol() view returns (string)", 
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // Owner functions
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function owner() view returns (address)",

  // ETH management functions (in DAppToken contract)
  "function getEthBalance() view returns (uint256)",
  "function getUserEthBalance(address user) view returns (uint256)",
  "function withdrawMyEth(uint256 amount)",
  "function withdrawAllMyEth()",
  "function withdrawEth(uint256 amount)",
  "function withdrawAllEth()",
  "function emergencyWithdraw(uint256 amount)",
  "receive() external payable",

  // Unstaking functions
  "function unstakeTokens(uint256 stakeIndex)",
  
  // Staking functions
  "function stakeTokens(uint256 amount, uint256 duration)",
  "function unstakeTokens(uint256 stakeIndex)",
  "function getUserStakes(address user) view returns (uint256)",
  "function getStakeDetails(address user, uint256 stakeIndex) view returns (uint256, uint256, uint256, uint256, bool, uint256)",
  "function calculateReward(address user, uint256 stakeIndex) view returns (uint256)",
  "function totalStaked(address) view returns (uint256)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event TokensStaked(address indexed user, uint256 amount, uint256 duration, uint256 unlockTime)",
  "event TokensUnstaked(address indexed user, uint256 amount, uint256 reward)"
]

interface ERC20ManagerProps {
  account: string
  signer: ethers.Signer | null
}

export default function ERC20Manager({ account, signer }: ERC20ManagerProps) {
  // Connection states
  const [tokenAddress, setTokenAddress] = useState<string>(DEFAULT_CONTRACT_ADDRESS)
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [tokenBalance, setTokenBalance] = useState<string>('0')
  const [isOwner, setIsOwner] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  // Transfer states
  const [transferTo, setTransferTo] = useState<string>('')
  const [transferAmount, setTransferAmount] = useState<string>('')

  // Owner function states
  const [mintTo, setMintTo] = useState<string>('')
  const [mintAmount, setMintAmount] = useState<string>('')
  const [burnAmount, setBurnAmount] = useState<string>('')

  // Staking states
  const [stakeAmount, setStakeAmount] = useState<string>('')
  const [selectedStakeDuration, setSelectedStakeDuration] = useState<string>('30')
  const [userStakes, setUserStakes] = useState<StakeInfo[]>([])
  const [totalStaked, setTotalStaked] = useState<string>('0')

  // ETH management states
  const [contractEthBalance, setContractEthBalance] = useState<string>('0')
  const [userEthBalance, setUserEthBalance] = useState<string>('0')
  const [ethDepositAmount, setEthDepositAmount] = useState<string>('')
  const [ethWithdrawAmount, setEthWithdrawAmount] = useState<string>('')

  // History
  const [transferHistory, setTransferHistory] = useState<TokenTransferRecord[]>([])

  // UI states
  const [showContractCode, setShowContractCode] = useState<boolean>(false)

  // Ensure default address is set on component mount
  useEffect(() => {
    if (!tokenAddress) {
      setTokenAddress(DEFAULT_CONTRACT_ADDRESS)
    }
  }, [tokenAddress])

  /**
   * Connect to ERC20 token contract
   */
  const connectToken = async () => {
    if (!signer || !tokenAddress) {
      alert('Please connect wallet and enter token address')
      return
    }

    try {
      setLoading(true)

      const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, signer)
      
      // Get token information
      const [name, symbol, decimals, totalSupply, balance, owner, ethBalance, userEthBal] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
        contract.balanceOf(account),
        contract.owner(),
        contract.getEthBalance(),
        contract.getUserEthBalance(account)
      ])

      const tokenInfo: TokenInfo = {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        owner
      }

      setTokenContract(contract)
      setTokenInfo(tokenInfo)
      setTokenBalance(ethers.formatUnits(balance, decimals))
      setIsOwner(owner.toLowerCase() === account.toLowerCase())
      setContractEthBalance(ethers.formatEther(ethBalance))
      setUserEthBalance(ethers.formatEther(userEthBal))

      // Load staking information
      await updateUserStakes(contract, tokenInfo)

      alert(`Connected to ${name} (${symbol}) successfully!`)
    } catch (error) {
      console.error('Failed to connect token:', error)
      alert('Failed to connect to token contract. Please check the address.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Update token balance
   */
  const updateTokenBalance = async () => {
    if (!tokenContract || !tokenInfo) return

    try {
      const balance = await tokenContract.balanceOf(account)
      setTokenBalance(ethers.formatUnits(balance, tokenInfo.decimals))
    } catch (error) {
      console.error('Failed to update balance:', error)
    }
  }

  /**
   * Transfer tokens
   */
  const transferTokens = async () => {
    if (!tokenContract || !tokenInfo || !transferTo || !transferAmount) {
      alert('Please fill in all fields')
      return
    }

    try {
      setLoading(true)

      const amount = parseFloat(transferAmount)
      if (amount <= 0) {
        alert('Transfer amount must be greater than 0')
        return
      }

      const amountWei = ethers.parseUnits(transferAmount, tokenInfo.decimals)
      const tx = await tokenContract.transfer(transferTo, amountWei)
      await tx.wait()

      // Add to history
      const newRecord: TokenTransferRecord = {
        from: account,
        to: transferTo,
        amount: transferAmount,
        hash: tx.hash,
        timestamp: Date.now(),
        type: 'transfer'
      }
      setTransferHistory(prev => [newRecord, ...prev])

      // Update balance
      await updateTokenBalance()
      setTransferTo('')
      setTransferAmount('')

      alert(`Transferred ${transferAmount} ${tokenInfo.symbol} successfully!`)
    } catch (error) {
      console.error('Transfer failed:', error)
      alert('Transfer failed. Check your balance and try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Mint tokens (Owner only)
   */
  const mintTokens = async () => {
    if (!tokenContract || !tokenInfo || !mintTo || !mintAmount) {
      alert('Please fill in all fields')
      return
    }

    try {
      setLoading(true)

      const amount = parseFloat(mintAmount)
      if (amount <= 0) {
        alert('Mint amount must be greater than 0')
        return
      }

      const amountWei = ethers.parseUnits(mintAmount, tokenInfo.decimals)
      const tx = await tokenContract.mint(mintTo, amountWei)
      await tx.wait()

      // Add to history
      const newRecord: TokenTransferRecord = {
        from: 'Mint',
        to: mintTo,
        amount: mintAmount,
        hash: tx.hash,
        timestamp: Date.now(),
        type: 'mint'
      }
      setTransferHistory(prev => [newRecord, ...prev])

      // Update balance if minting to self
      if (mintTo.toLowerCase() === account.toLowerCase()) {
        await updateTokenBalance()
      }
      setMintTo('')
      setMintAmount('')

      alert(`Minted ${mintAmount} ${tokenInfo.symbol} successfully!`)
    } catch (error) {
      console.error('Mint failed:', error)
      alert('Mint failed. Make sure you are the owner.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Burn tokens
   */
  const burnTokens = async () => {
    if (!tokenContract || !tokenInfo || !burnAmount) {
      alert('Please enter burn amount')
      return
    }

    try {
      setLoading(true)

      const amount = parseFloat(burnAmount)
      if (amount <= 0) {
        alert('Burn amount must be greater than 0')
        return
      }

      const amountWei = ethers.parseUnits(burnAmount, tokenInfo.decimals)
      const tx = await tokenContract.burn(amountWei)
      await tx.wait()

      // Add to history
      const newRecord: TokenTransferRecord = {
        from: account,
        to: 'Burn',
        amount: burnAmount,
        hash: tx.hash,
        timestamp: Date.now(),
        type: 'burn'
      }
      setTransferHistory(prev => [newRecord, ...prev])

      // Update balance
      await updateTokenBalance()
      setBurnAmount('')

      alert(`Burned ${burnAmount} ${tokenInfo.symbol} successfully!`)
    } catch (error) {
      console.error('Burn failed:', error)
      alert('Burn failed. Check your balance and try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Update contract and user ETH balances
   */
  const updateEthBalance = async () => {
    if (!tokenContract) return

    try {
      const [ethBalance, userEthBal] = await Promise.all([
        tokenContract.getEthBalance(),
        tokenContract.getUserEthBalance(account)
      ])
      setContractEthBalance(ethers.formatEther(ethBalance))
      setUserEthBalance(ethers.formatEther(userEthBal))
    } catch (error) {
      console.error('Failed to update ETH balance:', error)
    }
  }

  /**
   * Deposit ETH to contract
   */
  const depositEth = async () => {
    if (!signer || !ethDepositAmount) {
      alert('Please enter deposit amount')
      return
    }

    try {
      setLoading(true)

      const amount = parseFloat(ethDepositAmount)
      if (amount <= 0) {
        alert('Deposit amount must be greater than 0')
        return
      }

      const amountWei = ethers.parseEther(ethDepositAmount)
      const tx = await signer.sendTransaction({
        to: tokenAddress,
        value: amountWei
      })
      await tx.wait()

      // Add to history
      const newRecord: TokenTransferRecord = {
        from: account,
        to: 'Contract',
        amount: ethDepositAmount,
        hash: tx.hash,
        timestamp: Date.now(),
        type: 'transfer'
      }
      setTransferHistory(prev => [newRecord, ...prev])

      // Update balance
      await updateEthBalance()
      setEthDepositAmount('')

      alert(`Deposited ${ethDepositAmount} ETH to contract successfully!`)
    } catch (error) {
      console.error('ETH deposit failed:', error)
      alert('ETH deposit failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Withdraw user's own ETH from contract
   */
  const withdrawMyEth = async () => {
    if (!tokenContract || !ethWithdrawAmount) {
      alert('Please enter withdraw amount')
      return
    }

    try {
      setLoading(true)

      const amount = parseFloat(ethWithdrawAmount)
      if (amount <= 0) {
        alert('Withdraw amount must be greater than 0')
        return
      }

      const userBalance = parseFloat(userEthBalance)
      if (amount > userBalance) {
        alert(`You can only withdraw up to ${userBalance} ETH (your deposited amount)`)
        return
      }

      const amountWei = ethers.parseEther(ethWithdrawAmount)
      const tx = await tokenContract.withdrawMyEth(amountWei)
      await tx.wait()

      // Add to history
      const newRecord: TokenTransferRecord = {
        from: 'Contract',
        to: account,
        amount: ethWithdrawAmount,
        hash: tx.hash,
        timestamp: Date.now(),
        type: 'transfer'
      }
      setTransferHistory(prev => [newRecord, ...prev])

      // Update balance
      await updateEthBalance()
      setEthWithdrawAmount('')

      alert(`Withdrew ${ethWithdrawAmount} ETH from contract successfully!`)
    } catch (error) {
      console.error('ETH withdraw failed:', error)
      alert('ETH withdraw failed. Please check your balance and try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Withdraw all user's ETH from contract
   */
  const withdrawAllMyEth = async () => {
    if (!tokenContract) return

    const userBalance = parseFloat(userEthBalance)
    if (userBalance <= 0) {
      alert('You have no ETH to withdraw')
      return
    }

    try {
      setLoading(true)

      const tx = await tokenContract.withdrawAllMyEth()
      await tx.wait()

      // Add to history
      const newRecord: TokenTransferRecord = {
        from: 'Contract',
        to: account,
        amount: userEthBalance,
        hash: tx.hash,
        timestamp: Date.now(),
        type: 'transfer'
      }
      setTransferHistory(prev => [newRecord, ...prev])

      // Update balance
      await updateEthBalance()

      alert(`Withdrew all your ETH (${userEthBalance} ETH) from contract successfully!`)
    } catch (error) {
      console.error('Withdraw all ETH failed:', error)
      alert('Withdraw all ETH failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Stake tokens for a specific duration
   */
  const stakeTokens = async () => {
    if (!tokenContract || !stakeAmount || !tokenInfo) {
      alert('Please enter stake amount')
      return
    }

    try {
      setLoading(true)

      const amount = parseFloat(stakeAmount)
      if (amount <= 0) {
        alert('Stake amount must be greater than 0')
        return
      }

      const amountWei = ethers.parseUnits(stakeAmount, tokenInfo.decimals)
      const durationInSeconds = parseInt(selectedStakeDuration) * 24 * 60 * 60 // days to seconds

      const tx = await tokenContract.stakeTokens(amountWei, durationInSeconds)
      await tx.wait()

      // Add to history
      const newRecord: TokenTransferRecord = {
        from: account,
        to: 'Staking Contract',
        amount: stakeAmount,
        hash: tx.hash,
        timestamp: Date.now(),
        type: 'stake'
      }
      setTransferHistory(prev => [newRecord, ...prev])

      // Update balances
      await updateTokenBalance()
      await updateUserStakes(tokenContract, tokenInfo)
      setStakeAmount('')

      alert(`Staked ${stakeAmount} ${tokenInfo.symbol} for ${selectedStakeDuration} days successfully!`)
    } catch (error) {
      console.error('Staking failed:', error)
      alert('Staking failed. Check your balance and try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Unstake tokens and claim rewards
   */
  const unstakeTokens = async (stakeIndex: number) => {
    if (!tokenContract || !tokenInfo) return

    try {
      setLoading(true)

      const tx = await tokenContract.unstakeTokens(stakeIndex)
      await tx.wait()

      // Add to history
      const newRecord: TokenTransferRecord = {
        from: 'Staking Contract',
        to: account,
        amount: userStakes[stakeIndex]?.amount || '0',
        hash: tx.hash,
        timestamp: Date.now(),
        type: 'unstake'
      }
      setTransferHistory(prev => [newRecord, ...prev])

      // Update balances
      await updateTokenBalance()
      await updateUserStakes(tokenContract, tokenInfo)

      alert('Tokens unstaked successfully!')
    } catch (error) {
      console.error('Unstaking failed:', error)
      alert('Unstaking failed. Make sure the stake period has ended.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Update user's staking information
   */
  const updateUserStakes = async (contract: ethers.Contract, tokenInfo: TokenInfo) => {
    try {
      const stakeCount = await contract.getUserStakes(account)
      const stakes: StakeInfo[] = []

      for (let i = 0; i < stakeCount; i++) {
        const stakeDetails = await contract.getStakeDetails(account, i)
        stakes.push({
          index: i,
          amount: ethers.formatUnits(stakeDetails[0], tokenInfo.decimals),
          startTime: new Date(Number(stakeDetails[1]) * 1000),
          duration: Number(stakeDetails[2]) / (24 * 60 * 60), // seconds to days
          unlockTime: new Date(Number(stakeDetails[3]) * 1000),
          claimed: stakeDetails[4],
          reward: ethers.formatUnits(stakeDetails[5], tokenInfo.decimals)
        })
      }

      setUserStakes(stakes)

      // Calculate total staked
      const totalStakedAmount = stakes
        .filter(stake => !stake.claimed)
        .reduce((sum, stake) => sum + parseFloat(stake.amount), 0)
      setTotalStaked(totalStakedAmount.toString())
    } catch (error) {
      console.error('Failed to update user stakes:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Token Connection */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">DApp Token Contract</h2>

        {/* Contract Info */}
        <div className="mb-4 p-3 bg-blue-50 rounded border">
          <h3 className="text-sm font-semibold mb-2">📋 Contract Information</h3>
          <div className="text-xs space-y-1">
            <p><span className="font-medium">Network:</span> {CONTRACT_NETWORK}</p>
            <p><span className="font-medium">Address:</span> <code className="bg-gray-100 px-1 rounded">{DEFAULT_CONTRACT_ADDRESS}</code></p>
            <p><span className="font-medium">Features:</span> ERC20 Token + Staking + ETH Management</p>
          </div>
        </div>

        {/* Connection */}
        <div className="space-y-2 mb-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contract address (auto-filled)"
              value={tokenAddress || DEFAULT_CONTRACT_ADDRESS}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="flex-1 px-3 py-2 border rounded text-sm font-mono"
              readOnly={tokenAddress === DEFAULT_CONTRACT_ADDRESS}
            />
            <button
              onClick={connectToken}
              disabled={loading || !account || !signer}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
          {(!account || !signer) && (
            <p className="text-xs text-orange-600">
              ⚠️ Please connect your wallet first using the "Connect MetaMask" button above
            </p>
          )}
        </div>

        {/* Contract Code Toggle */}
        <div className="mb-2">
          <button
            onClick={() => setShowContractCode(!showContractCode)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showContractCode ? '🔼 Hide Contract Code' : '🔽 View Contract Code'}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Contract is pre-deployed on Hardhat local network. Click Connect to start using the DApp.
        </p>

        {/* Contract Code Display */}
        {showContractCode && (
          <div className="mt-4 p-3 bg-gray-100 rounded border">
            <h3 className="text-sm font-semibold mb-2">📄 Smart Contract Code (DAppToken.sol)</h3>
            <div className="text-xs bg-white p-3 rounded border max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-gray-800">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DAppToken
 * @dev Full-featured ERC20 token with staking and ETH management
 * Features:
 * - Standard ERC20 functionality (transfer, approve, etc.)
 * - Token staking with time-locked rewards
 * - ETH deposit and withdrawal management
 * - Owner functions for minting and burning
 */
contract DAppToken {
    // ERC20 Basic Information
    string public name = "DApp Demo Token";
    string public symbol = "DDT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    address public owner;

    // Token balances and allowances
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // ETH balance tracking for each user
    mapping(address => uint256) public ethBalanceOf;

    // Staking functionality
    struct StakeInfo {
        uint256 amount;      // Staked token amount
        uint256 startTime;   // Stake start timestamp
        uint256 duration;    // Stake duration in seconds
        uint256 unlockTime;  // When stake can be withdrawn
        bool claimed;        // Whether stake has been claimed
    }

    mapping(address => StakeInfo[]) public stakes;
    mapping(address => uint256) public totalStaked;

    // Staking rewards: 5% APY for 1 month, 8% for 3 months, etc.
    mapping(uint256 => uint256) public stakingRewards;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event EthDeposited(address indexed from, uint256 value);
    event EthWithdrawn(address indexed to, uint256 value);
    event TokensStaked(address indexed user, uint256 amount, uint256 duration);
    event TokensUnstaked(address indexed user, uint256 amount, uint256 reward);

    // Main Functions:
    // 1. ERC20 functions: transfer(), approve(), transferFrom()
    // 2. Staking functions: stakeTokens(), unstakeTokens()
    // 3. ETH management: deposit ETH, withdrawMyEth()
    // 4. Owner functions: mint(), burn()

    // ... (Full implementation available in contract/contracts/DAppToken.sol)
}`}
              </pre>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <p><strong>Key Features:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li><strong>ERC20 Token:</strong> Standard token with transfer, approve functionality</li>
                <li><strong>Staking System:</strong> Lock tokens for rewards (5%-20% APY based on duration)</li>
                <li><strong>ETH Management:</strong> Deposit and withdraw ETH, tracked per user</li>
                <li><strong>Owner Functions:</strong> Mint new tokens, burn tokens</li>
                <li><strong>Security:</strong> Time-locked staking, user-specific ETH balances</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Token Information */}
      {tokenInfo && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Token Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-medium">Name:</span> {tokenInfo.name}</p>
              <p><span className="font-medium">Symbol:</span> {tokenInfo.symbol}</p>
              <p><span className="font-medium">Decimals:</span> {tokenInfo.decimals}</p>
            </div>
            <div>
              <p><span className="font-medium">Total Supply:</span> {parseFloat(tokenInfo.totalSupply).toLocaleString()} {tokenInfo.symbol}</p>
              <p><span className="font-medium">Your Balance:</span> {parseFloat(tokenBalance).toLocaleString()} {tokenInfo.symbol}</p>
              <p><span className="font-medium">Owner:</span> {isOwner ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Token Operations */}
      {tokenContract && tokenInfo && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Token Operations</h2>

          {/* Transfer Tokens */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3">Transfer Tokens</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ({tokenInfo.symbol})
                </label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="100"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={transferTokens}
                disabled={loading || !transferTo || !transferAmount}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Sending...' : `Send ${tokenInfo.symbol}`}
              </button>
            </div>
          </div>

          {/* Test Token Distribution - Available for all users */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3">Get Test Tokens</h3>
            <div className="p-3 bg-green-50 rounded border">
              <h4 className="text-sm font-semibold mb-2">Request Test Tokens</h4>
              <p className="text-xs text-gray-600 mb-2">
                {isOwner
                  ? "As the contract owner, you can mint tokens for testing"
                  : "Request test tokens to try staking and other features. Note: Only the contract owner can mint tokens."
                }
              </p>
              {isOwner ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setMintTo(account)
                      setMintAmount('1000')
                      mintTokens()
                    }}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    Get 1000 DDT
                  </button>
                  <button
                    onClick={() => {
                      setMintTo(account)
                      setMintAmount('5000')
                      mintTokens()
                    }}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    Get 5000 DDT
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-orange-600 font-medium">
                    ⚠️ You are not the contract owner. To get test tokens:
                  </p>
                  <ol className="text-xs text-gray-600 space-y-1">
                    <li>1. Switch to the first Hardhat account (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)</li>
                    <li>2. Or ask the contract owner to send you some DDT tokens</li>
                    <li>3. Or use the transfer function if you have access to an account with DDT</li>
                  </ol>
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                    <strong>Contract Owner:</strong> {tokenInfo?.owner ? `${tokenInfo.owner.slice(0, 6)}...${tokenInfo.owner.slice(-4)}` : 'Loading...'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Owner Functions */}
          {isOwner && (
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-3">Owner Functions</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mint Tokens */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Mint Tokens</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Recipient address"
                      value={mintTo}
                      onChange={(e) => setMintTo(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Amount"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <button
                      onClick={mintTokens}
                      disabled={loading || !mintTo || !mintAmount}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {loading ? 'Minting...' : 'Mint Tokens'}
                    </button>
                  </div>
                </div>

                {/* Burn Tokens */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Burn Tokens</h4>
                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Amount to burn"
                      value={burnAmount}
                      onChange={(e) => setBurnAmount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      onClick={burnTokens}
                      disabled={loading || !burnAmount}
                      className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {loading ? 'Burning...' : 'Burn Tokens'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ETH Management */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3">ETH Management</h3>

            {/* ETH Balances */}
            <div className={`grid gap-4 mb-4 ${isOwner ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              <div className="p-3 bg-white rounded border">
                <p className="text-sm font-medium text-gray-700">Your ETH in Contract</p>
                <p className="text-2xl font-bold text-blue-600">{parseFloat(userEthBalance).toLocaleString()} ETH</p>
              </div>
              {isOwner && (
                <div className="p-3 bg-white rounded border">
                  <p className="text-sm font-medium text-gray-700">Total Contract ETH</p>
                  <p className="text-2xl font-bold text-purple-600">{parseFloat(contractEthBalance).toLocaleString()} ETH</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Deposit ETH */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Deposit ETH to Contract</h4>
                <div className="space-y-2">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.1"
                    value={ethDepositAmount}
                    onChange={(e) => setEthDepositAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={depositEth}
                    disabled={loading || !ethDepositAmount}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Depositing...' : 'Deposit ETH'}
                  </button>
                </div>
              </div>

              {/* Withdraw Your ETH */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Withdraw Your ETH</h4>
                <div className="space-y-2">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.1"
                    value={ethWithdrawAmount}
                    onChange={(e) => setEthWithdrawAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={withdrawMyEth}
                      disabled={loading || !ethWithdrawAmount || userEthBalance === '0'}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {loading ? 'Withdrawing...' : 'Withdraw'}
                    </button>
                    <button
                      onClick={withdrawAllMyEth}
                      disabled={loading || userEthBalance === '0'}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      Withdraw All
                    </button>
                  </div>
                  {userEthBalance === '0' && (
                    <p className="text-xs text-gray-500">
                      You have no ETH deposited in the contract
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Token Staking */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3">Token Staking</h3>

            {/* Staking Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-white rounded border">
                <p className="text-sm font-medium text-gray-700">Your Staked Balance</p>
                <p className="text-xl font-bold text-green-600">{parseFloat(totalStaked).toLocaleString()} {tokenInfo.symbol}</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <p className="text-sm font-medium text-gray-700">Active Stakes</p>
                <p className="text-xl font-bold text-green-600">{userStakes.filter(s => !s.claimed).length}</p>
              </div>
            </div>

            {/* Stake Tokens */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ({tokenInfo.symbol})
                </label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="100"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <select
                  value={selectedStakeDuration}
                  onChange={(e) => setSelectedStakeDuration(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="30">1 Month (5% APY)</option>
                  <option value="90">3 Months (8% APY)</option>
                  <option value="180">6 Months (12% APY)</option>
                  <option value="365">1 Year (20% APY)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={stakeTokens}
                  disabled={loading || !stakeAmount}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Staking...' : 'Stake Tokens'}
                </button>
              </div>
            </div>

            {/* Active Stakes */}
            {userStakes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Your Stakes</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userStakes.map((stake, index) => (
                    <div key={index} className="bg-white p-3 rounded border text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <p className="font-medium text-gray-700">Amount</p>
                          <p className="text-green-600 font-bold">{parseFloat(stake.amount).toLocaleString()} {tokenInfo.symbol}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Duration</p>
                          <p>{stake.duration} days</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Reward</p>
                          <p className="text-green-600 font-bold">{parseFloat(stake.reward).toLocaleString()} {tokenInfo.symbol}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Status</p>
                          {stake.claimed ? (
                            <div>
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Claimed</span>
                            </div>
                          ) : new Date() >= stake.unlockTime ? (
                            <div>
                              <button
                                onClick={() => unstakeTokens(index)}
                                disabled={loading}
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs disabled:opacity-50 mb-1"
                              >
                                Unstake
                              </button>
                              <p className="text-xs text-green-600">Ready to unstake!</p>
                            </div>
                          ) : (
                            <div>
                              <button
                                disabled={true}
                                className="px-3 py-1 bg-gray-300 text-gray-500 rounded text-xs cursor-not-allowed mb-1"
                              >
                                Unstake
                              </button>
                              <p className="text-xs text-gray-500">
                                Locked until: {stake.unlockTime.toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Transaction History */}
          {transferHistory.length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-3">Transaction History</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {transferHistory.map((record, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">Type:</span>
                          <span className={`ml-1 px-2 py-1 rounded text-xs ${
                            record.type === 'mint' ? 'bg-green-100 text-green-800' :
                            record.type === 'burn' ? 'bg-red-100 text-red-800' :
                            record.type === 'stake' ? 'bg-purple-100 text-purple-800' :
                            record.type === 'unstake' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {record.type.toUpperCase()}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">From:</span> {record.from.slice(0, 6)}...{record.from.slice(-4)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">To:</span> {record.to.slice(0, 6)}...{record.to.slice(-4)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Amount:</span> {parseFloat(record.amount).toLocaleString()} {tokenInfo.symbol}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(record.timestamp).toLocaleString()}
                        </p>
                        <a
                          href={`https://etherscan.io/tx/${record.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          View on Explorer
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
