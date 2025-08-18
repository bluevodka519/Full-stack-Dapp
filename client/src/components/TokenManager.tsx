'use client'

import { useState } from 'react'
import { ethers } from 'ethers'

/**
 * Enhanced DApp Token Contract ABI
 * Complete ABI with all functions and events
 */
const TOKEN_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "_initialSupply", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "spender", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "Burn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "EthDeposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "EthWithdrawn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "Mint",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "previousOwner", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "newOwner", "type": "address"}
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  },
  {"stateMutability": "payable", "type": "fallback"},
  {
    "inputs": [
      {"internalType": "address", "name": "", "type": "address"},
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_spender", "type": "address"},
      {"internalType": "uint256", "name": "_value", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_value", "type": "uint256"}],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_owner", "type": "address"},
      {"internalType": "address", "name": "_spender", "type": "address"}
    ],
    "name": "getAllowance",
    "outputs": [{"internalType": "uint256", "name": "remaining", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_owner", "type": "address"}],
    "name": "getBalance",
    "outputs": [{"internalType": "uint256", "name": "balance", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getEthBalance",
    "outputs": [{"internalType": "uint256", "name": "balance", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_to", "type": "address"},
      {"internalType": "uint256", "name": "_value", "type": "uint256"}
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_to", "type": "address"},
      {"internalType": "uint256", "name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_from", "type": "address"},
      {"internalType": "address", "name": "_to", "type": "address"},
      {"internalType": "uint256", "name": "_value", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_newOwner", "type": "address"}],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawAllEth",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}],
    "name": "withdrawEth",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {"stateMutability": "payable", "type": "receive"}
]

/**
 * Interface for token transaction records
 */
interface TokenTransferRecord {
  from: string
  to: string
  amount: string
  hash: string
  timestamp: number
  type: 'transfer' | 'mint' | 'burn' | 'eth_deposit' | 'eth_withdraw'
}

/**
 * Interface for token information
 */
interface TokenInfo {
  name: string
  symbol: string
  decimals: number
  totalSupply: string
  address: string
}

interface TokenManagerProps {
  signer: ethers.JsonRpcSigner | null
  account: string
  updateBalance: () => Promise<void>
}

export default function TokenManager({ signer, account, updateBalance }: TokenManagerProps) {
  // Token states
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null)
  const [tokenAddress, setTokenAddress] = useState<string>('')
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [tokenBalance, setTokenBalance] = useState<string>('0')
  const [tokenTransferTo, setTokenTransferTo] = useState<string>('')
  const [tokenTransferAmount, setTokenTransferAmount] = useState<string>('')
  const [tokenTransferHistory, setTokenTransferHistory] = useState<TokenTransferRecord[]>([])
  const [tokenLoading, setTokenLoading] = useState(false)
  const [mintAmount, setMintAmount] = useState<string>('')
  const [burnAmount, setBurnAmount] = useState<string>('')
  const [isOwner, setIsOwner] = useState(false)

  // ETH functionality states
  const [contractEthBalance, setContractEthBalance] = useState<string>('0')
  const [ethDepositAmount, setEthDepositAmount] = useState<string>('')
  const [ethWithdrawAmount, setEthWithdrawAmount] = useState<string>('')

  /**
   * Connect to ERC20 token contract
   */
  const connectToken = async () => {
    if (!signer || !tokenAddress) {
      alert('Please connect wallet and enter token address first')
      return
    }

    try {
      setTokenLoading(true)
      const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, signer)
      setTokenContract(contract)

      // Get token information
      const [name, symbol, decimals, totalSupply, balance, owner, ethBalance] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
        contract.balanceOf(account),
        contract.owner(),
        contract.getEthBalance()
      ])

      const tokenInfo: TokenInfo = {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        address: tokenAddress
      }

      setTokenInfo(tokenInfo)
      setTokenBalance(ethers.formatUnits(balance, decimals))
      setIsOwner(owner.toLowerCase() === account.toLowerCase())
      setContractEthBalance(ethers.formatEther(ethBalance))

      alert(`Connected to ${name} (${symbol}) successfully!`)
    } catch (error) {
      console.error('Failed to connect to token:', error)
      alert('Failed to connect to token contract. Please check the address.')
    } finally {
      setTokenLoading(false)
    }
  }

  /**
   * Update token balance
   */
  const updateTokenBalance = async () => {
    if (!tokenContract || !account || !tokenInfo) return

    try {
      const balance = await tokenContract.balanceOf(account)
      setTokenBalance(ethers.formatUnits(balance, tokenInfo.decimals))
    } catch (error) {
      console.error('Failed to update token balance:', error)
    }
  }

  /**
   * Transfer tokens to another address
   */
  const transferTokens = async () => {
    if (!tokenContract || !tokenTransferTo || !tokenTransferAmount || !tokenInfo) {
      alert('Please fill in all fields')
      return
    }

    try {
      setTokenLoading(true)

      // Validate address
      if (!ethers.isAddress(tokenTransferTo)) {
        alert('Invalid recipient address')
        return
      }

      // Validate amount
      const amount = parseFloat(tokenTransferAmount)
      if (amount <= 0) {
        alert('Amount must be greater than 0')
        return
      }

      // Convert to wei
      const amountWei = ethers.parseUnits(tokenTransferAmount, tokenInfo.decimals)

      // Send transaction
      const tx = await tokenContract.transfer(tokenTransferTo, amountWei)
      await tx.wait()

      // Add to history
      const newRecord: TokenTransferRecord = {
        from: account,
        to: tokenTransferTo,
        amount: tokenTransferAmount,
        hash: tx.hash,
        timestamp: Date.now(),
        type: 'transfer'
      }
      setTokenTransferHistory(prev => [newRecord, ...prev])

      // Update balances
      await updateTokenBalance()
      await updateBalance()

      // Clear form
      setTokenTransferTo('')
      setTokenTransferAmount('')

      alert(`Transfer successful! Hash: ${tx.hash}`)
    } catch (error) {
      console.error('Token transfer failed:', error)
      alert('Token transfer failed')
    } finally {
      setTokenLoading(false)
    }
  }

  /**
   * Mint new tokens (owner only)
   */
  const mintTokens = async () => {
    if (!tokenContract || !mintAmount || !tokenInfo) {
      alert('Please enter mint amount')
      return
    }

    try {
      setTokenLoading(true)

      const amount = parseFloat(mintAmount)
      if (amount <= 0) {
        alert('Mint amount must be greater than 0')
        return
      }

      const amountWei = ethers.parseUnits(mintAmount, tokenInfo.decimals)
      const tx = await tokenContract.mint(account, amountWei)
      await tx.wait()

      // Add to history
      const newRecord: TokenTransferRecord = {
        from: ethers.ZeroAddress,
        to: account,
        amount: mintAmount,
        hash: tx.hash,
        timestamp: Date.now(),
        type: 'mint'
      }
      setTokenTransferHistory(prev => [newRecord, ...prev])

      // Update balance
      await updateTokenBalance()
      setMintAmount('')

      alert(`Minted ${mintAmount} ${tokenInfo.symbol} successfully!`)
    } catch (error) {
      console.error('Mint failed:', error)
      alert('Mint failed. Make sure you are the owner.')
    } finally {
      setTokenLoading(false)
    }
  }

  /**
   * Burn tokens
   */
  const burnTokens = async () => {
    if (!tokenContract || !burnAmount || !tokenInfo) {
      alert('Please enter burn amount')
      return
    }

    try {
      setTokenLoading(true)

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
        to: ethers.ZeroAddress,
        amount: burnAmount,
        hash: tx.hash,
        timestamp: Date.now(),
        type: 'burn'
      }
      setTokenTransferHistory(prev => [newRecord, ...prev])

      // Update balance
      await updateTokenBalance()
      setBurnAmount('')

      alert(`Burned ${burnAmount} ${tokenInfo.symbol} successfully!`)
    } catch (error) {
      console.error('Burn failed:', error)
      alert('Burn failed. Check your balance.')
    } finally {
      setTokenLoading(false)
    }
  }

  /**
   * Deposit ETH to contract
   */
  const depositEth = async () => {
    if (!tokenContract || !ethDepositAmount) {
      alert('Please enter deposit amount')
      return
    }

    try {
      setTokenLoading(true)

      const amount = parseFloat(ethDepositAmount)
      if (amount <= 0) {
        alert('Deposit amount must be greater than 0')
        return
      }

      const amountWei = ethers.parseEther(ethDepositAmount)
      const tx = await signer!.sendTransaction({
        to: tokenAddress,
        value: amountWei
      })
      await tx.wait()

      // Add to history
      const newRecord: TokenTransferRecord = {
        from: account,
        to: tokenAddress,
        amount: ethDepositAmount,
        hash: tx.hash,
        timestamp: Date.now(),
        type: 'eth_deposit'
      }
      setTokenTransferHistory(prev => [newRecord, ...prev])

      // Update ETH balance
      await updateEthBalance()
      setEthDepositAmount('')

      alert(`Deposited ${ethDepositAmount} ETH successfully!`)
    } catch (error) {
      console.error('ETH deposit failed:', error)
      alert('ETH deposit failed. Check your balance.')
    } finally {
      setTokenLoading(false)
    }
  }

  /**
   * Withdraw ETH from contract (owner only)
   */
  const withdrawEth = async () => {
    if (!tokenContract || !ethWithdrawAmount || !isOwner) {
      alert('Please enter withdraw amount (owner only)')
      return
    }

    try {
      setTokenLoading(true)

      const amount = parseFloat(ethWithdrawAmount)
      if (amount <= 0) {
        alert('Withdraw amount must be greater than 0')
        return
      }

      const amountWei = ethers.parseEther(ethWithdrawAmount)
      const tx = await tokenContract.withdrawEth(amountWei)
      await tx.wait()

      // Add to history
      const newRecord: TokenTransferRecord = {
        from: tokenAddress,
        to: account,
        amount: ethWithdrawAmount,
        hash: tx.hash,
        timestamp: Date.now(),
        type: 'eth_withdraw'
      }
      setTokenTransferHistory(prev => [newRecord, ...prev])

      // Update ETH balance
      await updateEthBalance()
      setEthWithdrawAmount('')

      alert(`Withdrew ${ethWithdrawAmount} ETH successfully!`)
    } catch (error) {
      console.error('ETH withdrawal failed:', error)
      alert('ETH withdrawal failed. Check contract balance.')
    } finally {
      setTokenLoading(false)
    }
  }

  /**
   * Withdraw all ETH from contract (owner only)
   */
  const withdrawAllEth = async () => {
    if (!tokenContract || !isOwner) {
      alert('Owner only function')
      return
    }

    try {
      setTokenLoading(true)

      const tx = await tokenContract.withdrawAllEth()
      await tx.wait()

      // Add to history
      const newRecord: TokenTransferRecord = {
        from: tokenAddress,
        to: account,
        amount: contractEthBalance,
        hash: tx.hash,
        timestamp: Date.now(),
        type: 'eth_withdraw'
      }
      setTokenTransferHistory(prev => [newRecord, ...prev])

      // Update ETH balance
      await updateEthBalance()

      alert(`Withdrew all ETH (${contractEthBalance} ETH) successfully!`)
    } catch (error) {
      console.error('ETH withdrawal failed:', error)
      alert('ETH withdrawal failed.')
    } finally {
      setTokenLoading(false)
    }
  }

  /**
   * Update contract ETH balance
   */
  const updateEthBalance = async () => {
    if (!tokenContract) return

    try {
      const ethBalance = await tokenContract.getEthBalance()
      setContractEthBalance(ethers.formatEther(ethBalance))
    } catch (error) {
      console.error('Failed to update ETH balance:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Token Connection */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">ERC20 Token Connection</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Enter token contract address"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={connectToken}
            disabled={tokenLoading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {tokenLoading ? 'Connecting...' : 'Connect Token'}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Deploy DAppToken contract first, then enter the contract address
        </p>
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

      {/* Token Transfer */}
      {tokenContract && tokenInfo && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Transfer Tokens</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={tokenTransferTo}
                onChange={(e) => setTokenTransferTo(e.target.value)}
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
                value={tokenTransferAmount}
                onChange={(e) => setTokenTransferAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={transferTokens}
              disabled={tokenLoading || !tokenTransferTo || !tokenTransferAmount}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {tokenLoading ? 'Sending...' : `Send ${tokenInfo.symbol}`}
            </button>
          </div>
        </div>
      )}

      {/* Owner Functions */}
      {tokenContract && tokenInfo && isOwner && (
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Owner Functions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mint Tokens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mint Amount ({tokenInfo.symbol})
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  placeholder="1000"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <button
                  onClick={mintTokens}
                  disabled={tokenLoading || !mintAmount}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  Mint
                </button>
              </div>
            </div>

            {/* Burn Tokens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Burn Amount ({tokenInfo.symbol})
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  placeholder="100"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={burnTokens}
                  disabled={tokenLoading || !burnAmount}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  Burn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ETH Management */}
      {tokenContract && tokenInfo && (
        <div className="p-4 bg-purple-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">ETH Management</h2>

          {/* Contract ETH Balance */}
          <div className="mb-4 p-3 bg-white rounded border">
            <p className="text-sm font-medium text-gray-700">Contract ETH Balance</p>
            <p className="text-xl font-bold text-purple-600">{contractEthBalance} ETH</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deposit ETH */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deposit ETH to Contract
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  placeholder="1.0"
                  value={ethDepositAmount}
                  onChange={(e) => setEthDepositAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={depositEth}
                  disabled={tokenLoading || !ethDepositAmount}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  Deposit
                </button>
              </div>
            </div>

            {/* Withdraw ETH (Owner Only) */}
            {isOwner && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Withdraw ETH (Owner Only)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.5"
                    value={ethWithdrawAmount}
                    onChange={(e) => setEthWithdrawAmount(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={withdrawEth}
                    disabled={tokenLoading || !ethWithdrawAmount}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    Withdraw
                  </button>
                </div>
                <button
                  onClick={withdrawAllEth}
                  disabled={tokenLoading || contractEthBalance === '0'}
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  Withdraw All ETH
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Token Transaction History */}
      {tokenTransferHistory.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Token Transaction History</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tokenTransferHistory.map((record, index) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Type:</span> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        record.type === 'mint' ? 'bg-green-100 text-green-800' :
                        record.type === 'burn' ? 'bg-red-100 text-red-800' :
                        record.type === 'eth_deposit' ? 'bg-purple-100 text-purple-800' :
                        record.type === 'eth_withdraw' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {record.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </p>
                    {(record.type === 'transfer' || record.type === 'eth_deposit' || record.type === 'eth_withdraw') && (
                      <p className="text-sm">
                        <span className="font-medium">
                          {record.type === 'eth_withdraw' ? 'From:' : 'To:'}
                        </span> {record.to.slice(0, 10)}...{record.to.slice(-8)}
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-medium">Amount:</span> {record.amount} {
                        record.type.includes('eth') ? 'ETH' : tokenInfo?.symbol
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(record.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <a
                    href={`https://etherscan.io/tx/${record.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 text-xs"
                  >
                    View TX
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
