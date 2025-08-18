'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import Counter from '@/components/Counter'
import ERC20Manager from '@/components/ERC20Manager'
import ETHTransfer from '@/components/ETHTransfer'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'smart-contract' | 'erc20' | 'eth-transfer'>('smart-contract')

  // Wallet states
  const [account, setAccount] = useState<string>('')
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [balance, setBalance] = useState<string>('0')
  const [isConnected, setIsConnected] = useState<boolean>(false)

  /**
   * Connect to MetaMask wallet
   */
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        const balance = await provider.getBalance(address)

        setAccount(address)
        setSigner(signer)
        setBalance(ethers.formatEther(balance))
        setIsConnected(true)

        console.log('Wallet connected:', address)
      } catch (error) {
        console.error('Failed to connect wallet:', error)
        alert('Failed to connect wallet. Please try again.')
      }
    } else {
      alert('MetaMask is not installed. Please install MetaMask to continue.')
    }
  }

  /**
   * Update ETH balance
   */
  const updateBalance = async () => {
    if (signer) {
      try {
        const provider = signer.provider
        if (provider) {
          const balance = await provider.getBalance(account)
          setBalance(ethers.formatEther(balance))
        }
      } catch (error) {
        console.error('Failed to update balance:', error)
      }
    }
  }

  /**
   * Check if wallet is already connected
   */
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const address = await signer.getAddress()
            const balance = await provider.getBalance(address)

            setAccount(address)
            setSigner(signer)
            setBalance(ethers.formatEther(balance))
            setIsConnected(true)
          }
        } catch (error) {
          console.error('Failed to check wallet connection:', error)
        }
      }
    }

    checkConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Full Stack DApp
          </h1>
          <p className="text-gray-600">
            Decentralized Application with Smart Contracts, ERC20 Tokens & ETH Transfer
          </p>

          {/* Wallet Connection */}
          <div className="mt-6">
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
              >
                Connect MetaMask
              </button>
            ) : (
              <div className="bg-white rounded-lg p-4 shadow-md inline-block">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Connected</p>
                    <p className="text-xs text-gray-500">{account.slice(0, 6)}...{account.slice(-4)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{parseFloat(balance).toFixed(4)} ETH</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setActiveTab('smart-contract')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'smart-contract'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              Smart Contract
            </button>
            <button
              onClick={() => setActiveTab('erc20')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'erc20'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 hover:text-green-500'
              }`}
            >
              ERC20 Tokens
            </button>
            <button
              onClick={() => setActiveTab('eth-transfer')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'eth-transfer'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 hover:text-purple-500'
              }`}
            >
              ETH Transfer
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {!isConnected ? (
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Connect Your Wallet to Get Started
              </h3>
              <p className="text-gray-500 mb-6">
                Please connect your MetaMask wallet to interact with the DApp
              </p>
              <button
                onClick={connectWallet}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
              >
                Connect MetaMask
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'smart-contract' && <Counter />}
              {activeTab === 'erc20' && <ERC20Manager account={account} signer={signer} />}
              {activeTab === 'eth-transfer' && <ETHTransfer account={account} signer={signer} balance={balance} updateBalance={updateBalance} />}
            </>
          )}
        </div>

        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>Full Stack DApp - Smart Contracts, ERC20 Tokens & ETH Operations</p>
        </footer>
      </div>
    </div>
  );
}
