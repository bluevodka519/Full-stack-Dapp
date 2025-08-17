'use client'

import { useState } from 'react'
import { ethers } from 'ethers'

/**
 * ERC20 Token Contract ABI
 * Standard ERC20 functions for token interaction
 */
const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function owner() view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
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
  type: 'transfer' | 'mint' | 'burn'
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
      const [name, symbol, decimals, totalSupply, balance, owner] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
        contract.balanceOf(account),
        contract.owner()
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
      const receipt = await tx.wait()

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
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {record.type.toUpperCase()}
                      </span>
                    </p>
                    {record.type === 'transfer' && (
                      <p className="text-sm">
                        <span className="font-medium">To:</span> {record.to.slice(0, 10)}...{record.to.slice(-8)}
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-medium">Amount:</span> {record.amount} {tokenInfo?.symbol}
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
