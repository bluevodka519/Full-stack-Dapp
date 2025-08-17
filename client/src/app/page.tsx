import Counter from '@/components/Counter'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Solidity Full Stack DApp
          </h1>
          <p className="text-gray-600">
            Decentralized Application built with Hardhat + Next.js + ethers.js
          </p>
        </header>

        <Counter />

        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>Learning Project - Counter Smart Contract Interaction Demo</p>
        </footer>
      </div>
    </div>
  );
}
