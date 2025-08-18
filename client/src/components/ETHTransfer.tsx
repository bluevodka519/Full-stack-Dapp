'use client'

import { useState } from 'react'
import { ethers } from 'ethers'

interface ETHTransferRecord {
  from: string
  to: string
  amount: string
  hash: string
  timestamp: number
}

interface ETHTransferProps {
  account: string
  signer: ethers.Signer | null
  balance: string
  updateBalance: () => void
}

export default function ETHTransfer({ account, signer, balance, updateBalance }: ETHTransferProps) {
  const [transferTo, setTransferTo] = useState<string>('')
  const [transferAmount, setTransferAmount] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [transferHistory, setTransferHistory] = useState<ETHTransferRecord[]>([])

  /**
   * Transfer ETH to another address
   */
  const transferETH = async () => {
    if (!signer || !transferTo || !transferAmount) {
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

      // Check if user has enough balance
      const currentBalance = parseFloat(balance)
      if (amount > currentBalance) {
        alert('Insufficient balance')
        return
      }

      const amountWei = ethers.parseEther(transferAmount)
      
      const tx = await signer.sendTransaction({
        to: transferTo,
        value: amountWei
      })
      
      await tx.wait()

      // Add to history
      const newRecord: ETHTransferRecord = {
        from: account,
        to: transferTo,
        amount: transferAmount,
        hash: tx.hash,
        timestamp: Date.now()
      }
      setTransferHistory(prev => [newRecord, ...prev])

      // Update balance
      updateBalance()
      setTransferTo('')
      setTransferAmount('')

      alert(`Transferred ${transferAmount} ETH successfully!`)
    } catch (error) {
      console.error('ETH transfer failed:', error)
      alert('ETH transfer failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ETH Transfer */}
      <div className="p-4 bg-purple-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">ETH Transfer</h2>
        
        {/* Current Balance */}
        <div className="p-3 bg-white rounded border mb-4">
          <p className="text-sm font-medium text-gray-700">Your ETH Balance</p>
          <p className="text-2xl font-bold text-purple-600">{parseFloat(balance).toFixed(4)} ETH</p>
        </div>

        {/* Transfer Form */}
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={transferETH}
            disabled={loading || !transferTo || !transferAmount}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send ETH'}
          </button>
        </div>

        {/* Quick Amount Buttons */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Quick Amounts:</p>
          <div className="flex gap-2">
            {['0.01', '0.1', '0.5', '1.0'].map((amount) => (
              <button
                key={amount}
                onClick={() => setTransferAmount(amount)}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
              >
                {amount} ETH
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transfer History */}
      {transferHistory.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">ETH Transfer History</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {transferHistory.map((record, index) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">From:</span> {record.from.slice(0, 6)}...{record.from.slice(-4)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">To:</span> {record.to.slice(0, 6)}...{record.to.slice(-4)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Amount:</span> {parseFloat(record.amount).toFixed(4)} ETH
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

      {/* Usage Instructions */}
      <div className="p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-md font-semibold mb-2">Usage Instructions:</h3>
        <ol className="text-sm text-gray-700 space-y-1">
          <li>1. Make sure you have sufficient ETH balance</li>
          <li>2. Enter the recipient's Ethereum address</li>
          <li>3. Specify the amount of ETH to send</li>
          <li>4. Click "Send ETH" and confirm the transaction in MetaMask</li>
          <li>5. Wait for transaction confirmation</li>
        </ol>
        <div className="mt-3 p-2 bg-yellow-100 rounded">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Always double-check the recipient address before sending. 
            ETH transactions are irreversible once confirmed on the blockchain.
          </p>
        </div>
      </div>
    </div>
  )
}
