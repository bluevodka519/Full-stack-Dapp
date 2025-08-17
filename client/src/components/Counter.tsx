'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import TokenManager from './TokenManager'

/**
 * Counter Contract ABI - Application Binary Interface
 * Defines the contract functions we can interact with
 */
const COUNTER_ABI = [
  "function x() view returns (uint256)",      // Read current counter value
  "function inc() external",                  // Increment by 1
  "function incBy(uint256 by) external",     // Increment by specified amount
  "event Increment(uint256 by)"              // Event emitted on increment
]



/**
 * Local Hardhat Network Configuration
 * Used for connecting MetaMask to local development blockchain
 */
const HARDHAT_NETWORK = {
  chainId: '0x7A69', // 31337 in hex
  chainName: 'Hardhat Local',
  rpcUrls: ['http://127.0.0.1:8545'],
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  }
}

/**
 * Interface for transfer transaction records
 * Used to track ETH transfer history
 */
interface TransferRecord {
  from: string      // Sender address
  to: string        // Recipient address
  amount: string    // Transfer amount in ETH
  hash: string      // Transaction hash
  timestamp: number // Unix timestamp
}



export default function Counter() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [account, setAccount] = useState<string>('')
  const [balance, setBalance] = useState<string>('0')
  const [counterValue, setCounterValue] = useState<string>('0')
  const [contractAddress, setContractAddress] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'counter' | 'transfer' | 'token'>('counter')

  // Transfer states
  const [transferTo, setTransferTo] = useState<string>('')
  const [transferAmount, setTransferAmount] = useState<string>('')
  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([])
  const [transferLoading, setTransferLoading] = useState(false)



  /**
   * Updates the current account's ETH balance
   * Called after transactions to reflect balance changes
   */
  const updateBalance = async () => {
    if (!provider || !account) return

    try {
      const balance = await provider.getBalance(account)
      setBalance(ethers.formatEther(balance))
    } catch (error) {
      console.error('Failed to get balance:', error)
    }
  }

  /**
   * Connects to MetaMask wallet and sets up provider/signer
   * Also attempts to switch to Hardhat local network
   */
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!')
        return
      }

      setLoading(true)

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      setProvider(provider)
      setSigner(signer)
      setAccount(address)
      setIsConnected(true)

      // Get initial balance
      const balance = await provider.getBalance(address)
      setBalance(ethers.formatEther(balance))

      // Try to switch to Hardhat network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HARDHAT_NETWORK.chainId }],
        })
      } catch (switchError: any) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [HARDHAT_NETWORK],
          })
        }
      }

    } catch (error) {
      console.error('Failed to connect wallet:', error)
      alert('Failed to connect wallet')
    } finally {
      setLoading(false)
    }
  }

  // Connect Contract
  const connectContract = async () => {
    if (!signer || !contractAddress) {
      alert('Please connect wallet and enter contract address first')
      return
    }

    try {
      const contract = new ethers.Contract(contractAddress, COUNTER_ABI, signer)
      setContract(contract)

      // Read current value
      const value = await contract.x()
      setCounterValue(value.toString())

      alert('Contract connected successfully!')
    } catch (error) {
      console.error('Failed to connect contract:', error)
      alert('Failed to connect contract, please check if address is correct')
    }
  }

  // Increment Counter
  const increment = async () => {
    if (!contract) return

    try {
      setLoading(true)
      const tx = await contract.inc()
      await tx.wait()

      // Update display value
      const value = await contract.x()
      setCounterValue(value.toString())

      alert('Transaction successful!')
    } catch (error) {
      console.error('Transaction failed:', error)
      alert('Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  // Increment by specified amount
  const incrementBy = async (amount: number) => {
    if (!contract) return

    try {
      setLoading(true)
      const tx = await contract.incBy(amount)
      await tx.wait()

      // Update display value
      const value = await contract.x()
      setCounterValue(value.toString())

      // Update balance after transaction
      await updateBalance()

      alert('Transaction successful!')
    } catch (error) {
      console.error('Transaction failed:', error)
      alert('Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  // Transfer ETH
  const transferETH = async () => {
    if (!signer || !transferTo || !transferAmount) {
      alert('Please fill in all fields')
      return
    }

    try {
      setTransferLoading(true)

      // Validate address
      if (!ethers.isAddress(transferTo)) {
        alert('Invalid recipient address')
        return
      }

      // Validate amount
      const amount = parseFloat(transferAmount)
      if (amount <= 0) {
        alert('Amount must be greater than 0')
        return
      }

      // Send transaction
      const tx = await signer.sendTransaction({
        to: transferTo,
        value: ethers.parseEther(transferAmount)
      })

      // Wait for confirmation
      const receipt = await tx.wait()

      // Add to history
      const newRecord: TransferRecord = {
        from: account,
        to: transferTo,
        amount: transferAmount,
        hash: tx.hash,
        timestamp: Date.now()
      }
      setTransferHistory(prev => [newRecord, ...prev])

      // Update balance
      await updateBalance()

      // Clear form
      setTransferTo('')
      setTransferAmount('')

      alert(`Transfer successful! Hash: ${tx.hash}`)
    } catch (error) {
      console.error('Transfer failed:', error)
      alert('Transfer failed')
    } finally {
      setTransferLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Full Stack DApp
      </h1>

      {/* Wallet Connection Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Wallet Status</h2>
        {!isConnected ? (
          <button
            onClick={connectWallet}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        ) : (
          <div>
            <p className="text-green-600">✅ Connected</p>
            <p className="text-sm text-gray-600">Account: {account}</p>
            <p className="text-sm text-gray-600">Balance: {parseFloat(balance).toFixed(4)} ETH</p>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      {isConnected && (
        <div className="mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('counter')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'counter'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Smart Contract
            </button>
            <button
              onClick={() => setActiveTab('transfer')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'transfer'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ETH Transfer
            </button>
            <button
              onClick={() => setActiveTab('token')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'token'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ERC20 Tokens
            </button>
          </div>
        </div>
      )}

      {/* Counter Tab Content */}
      {isConnected && activeTab === 'counter' && (
        <>
          {/* Contract Connection */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Contract Connection</h2>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Enter contract address"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="flex-1 px-3 py-2 border rounded"
              />
              <button
                onClick={connectContract}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Connect Contract
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Tip: Start Hardhat network and deploy contract first, then enter contract address
            </p>
          </div>

          {/* Contract Interaction */}
          {contract && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Contract Interaction</h2>

              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-blue-600">
                  Current Value: {counterValue}
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={increment}
                  disabled={loading}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {loading ? 'Processing...' : '+1'}
                </button>
                <button
                  onClick={() => incrementBy(5)}
                  disabled={loading}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {loading ? 'Processing...' : '+5'}
                </button>
                <button
                  onClick={() => incrementBy(10)}
                  disabled={loading}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {loading ? 'Processing...' : '+10'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Transfer Tab Content */}
      {isConnected && activeTab === 'transfer' && (
        <>
          {/* Transfer Form */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Send ETH</h2>

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
                  Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.1"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={transferETH}
                disabled={transferLoading || !transferTo || !transferAmount}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {transferLoading ? 'Sending...' : 'Send ETH'}
              </button>
            </div>
          </div>

          {/* Transfer History */}
          {transferHistory.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Transfer History</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {transferHistory.map((record, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">To:</span> {record.to.slice(0, 10)}...{record.to.slice(-8)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Amount:</span> {record.amount} ETH
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
        </>
      )}

      {/* Token Tab Content */}
      {isConnected && activeTab === 'token' && (
        <TokenManager
          signer={signer}
          account={account}
          updateBalance={updateBalance}
        />
      )}

      {/* Usage Instructions */}
      <div className="p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Instructions:</h3>
        <ol className="text-sm text-gray-700 space-y-1">
          <li>1. Ensure MetaMask browser extension is installed</li>
          <li>2. Start Hardhat local network: <code className="bg-gray-200 px-1 rounded">npx hardhat node</code></li>
          <li>3. Deploy contracts:
            <ul className="ml-4 mt-1 space-y-1">
              <li>• Counter: <code className="bg-gray-200 px-1 rounded">npx hardhat run scripts/deploy-counter.ts --network localhost</code></li>
              <li>• Token: <code className="bg-gray-200 px-1 rounded">npx hardhat run scripts/deploy-token.ts --network localhost</code></li>
            </ul>
          </li>
          <li>4. Click "Connect MetaMask" and switch to Hardhat network</li>
          <li>5. Use Smart Contract tab to interact with Counter contract</li>
          <li>6. Use ETH Transfer tab to send ETH between accounts</li>
          <li>7. Use ERC20 Tokens tab to interact with DApp Demo Token (DDT)</li>
        </ol>
      </div>
    </div>
  )
}

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}
