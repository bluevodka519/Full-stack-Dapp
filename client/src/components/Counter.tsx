'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

/**
 * Counter Contract Configuration
 */
const DEFAULT_COUNTER_ADDRESS = '0x610178dA211FEF7D417bC0e6FeD39F05609AD788'
const COUNTER_NETWORK = 'Hardhat Local Network'

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
 * Props interface for Counter component
 */
interface CounterProps {
  account?: string
  signer?: ethers.Signer | null
}

export default function Counter({ account, signer }: CounterProps) {
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [counterValue, setCounterValue] = useState<string>('0')
  const [contractAddress, setContractAddress] = useState<string>(DEFAULT_COUNTER_ADDRESS)
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)

  // Connect Contract
  const connectContract = async () => {
    if (!signer || !contractAddress) {
      alert('Please connect wallet first')
      return
    }

    try {
      setLoading(true)
      const contract = new ethers.Contract(contractAddress, COUNTER_ABI, signer)
      setContract(contract)

      // Read current value
      const value = await contract.x()
      setCounterValue(value.toString())
      setConnected(true)

      console.log('Contract connected successfully!')
    } catch (error) {
      console.error('Failed to connect contract:', error)
      alert('Failed to connect contract, please check if address is correct')
    } finally {
      setLoading(false)
    }
  }

  // Increment counter by 1
  const increment = async () => {
    if (!contract) return

    try {
      setLoading(true)
      const tx = await contract.inc()
      await tx.wait()

      // Update counter value
      const newValue = await contract.x()
      setCounterValue(newValue.toString())
      
      console.log('Counter incremented successfully!')
    } catch (error) {
      console.error('Failed to increment:', error)
      alert('Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  // Increment counter by specified amount
  const incrementBy = async (amount: number) => {
    if (!contract) return

    try {
      setLoading(true)
      const tx = await contract.incBy(amount)
      await tx.wait()

      // Update counter value
      const newValue = await contract.x()
      setCounterValue(newValue.toString())
      
      console.log(`Counter incremented by ${amount} successfully!`)
    } catch (error) {
      console.error('Failed to increment:', error)
      alert('Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  // Auto-connect when wallet is available
  useEffect(() => {
    if (account && signer && !connected && contractAddress) {
      connectContract()
    }
  }, [account, signer, connected, contractAddress])

  if (!account || !signer) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">
          Please connect your MetaMask wallet to interact with the Counter contract
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Smart Contract Interaction</h1>

      {/* Contract Connection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Contract Connection</h2>
        
        {/* Contract Info */}
        <div className="mb-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
          <div className="text-xs space-y-1">
            <p><span className="font-medium">Network:</span> {COUNTER_NETWORK}</p>
            <p><span className="font-medium">Address:</span> <code className="bg-gray-100 px-1 rounded">{DEFAULT_COUNTER_ADDRESS}</code></p>
            <p><span className="font-medium">Features:</span> Counter with increment operations</p>
          </div>
        </div>

        {/* Connection */}
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Contract address (auto-filled)"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            className="flex-1 px-3 py-2 border rounded text-sm font-mono"
            readOnly={contractAddress === DEFAULT_COUNTER_ADDRESS}
          />
          <button
            onClick={connectContract}
            disabled={loading || !account || !signer}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Connecting...' : connected ? 'Reconnect' : 'Connect'}
          </button>
        </div>
        
        {(!account || !signer) && (
          <p className="text-xs text-orange-600">
            ⚠️ Please connect your wallet first using the "Connect MetaMask" button above
          </p>
        )}
        
        {connected && (
          <p className="text-xs text-green-600">
            ✅ Contract connected successfully
          </p>
        )}
      </div>

      {/* Counter Interaction */}
      {connected && (
        <div className="mb-6 p-4 bg-white rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Contract Interaction</h2>
          
          {/* Current Value Display */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-blue-600 mb-2">
              Current Value: {counterValue}
            </h3>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => increment()}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Processing...' : '+1'}
            </button>
            <button
              onClick={() => incrementBy(5)}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Processing...' : '+5'}
            </button>
            <button
              onClick={() => incrementBy(10)}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Processing...' : '+10'}
            </button>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Instructions:</h3>
        <ol className="text-sm text-gray-600 space-y-1">
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
        </ol>
      </div>
    </div>
  )
}
