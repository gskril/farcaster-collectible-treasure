import { Coins, Trophy } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './components/ui/card'
import { useBalance } from 'wagmi'
import { treasureContract } from './web3'
import { formatEther, formatUnits } from 'viem'
import { useBids, useErc20Tokens } from './hooks/useEvents'
import { truncateAddress } from './lib/utils'

function App() {
  // Show: The latest bid: xxUSDC by @user
  // Total value of treasure: $xx
  const { data: ethBalance } = useBalance(treasureContract)
  const { data: tokens } = useErc20Tokens()
  const { data: bids } = useBids()

  return (
    <main className="container max-w-md mx-auto px-4 py-8">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="bg-gradient-to-r from-amber-400 to-yellow-600 p-4 rounded-full mb-4">
          <Trophy className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Collectible Treasure Chest</h1>
        <p className="text-muted-foreground">
          Win the auction to claim the treasure within this smart contract.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Contract Assets
          </CardTitle>
          <CardDescription>
            Current assets locked in the treasure chest
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Coins className="h-5 w-5 text-blue-600" />
                </div>
                <span>Ethereum</span>
              </div>
              <span className="font-bold">
                {formatEther(ethBalance?.value ?? 0n)} ETH
              </span>
            </div>

            {tokens && (
              <span>
                Also includes{' '}
                {tokens.map((token) => `$${token.symbol}`).join(', ')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Latest Auction Bids
          </CardTitle>
          <CardDescription>
            Recent bids for the collectible cast
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bids?.map(({ args }, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {truncateAddress(args.bidder)}
                  </div>
                </div>
                <span className="font-bold">
                  {formatUnits(args.amount, 6)} USDC
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* <div className="space-y-4">
        <Button
          className="w-full"
          onClick={claimETH}
          disabled={!canClaim || ethBalance === '0' || isLoading}
        >
          <Coins className="mr-2 h-4 w-4" />
          Claim ETH
          {!isAuctionSettled && (
            <span className="ml-2 text-xs">(Auction not settled)</span>
          )}
          {isAuctionSettled && !isOwner && (
            <span className="ml-2 text-xs">(Not NFT owner)</span>
          )}
        </Button>

        <Button
          className="w-full"
          onClick={claimERC20s}
          disabled={!canClaim || tokens.length === 0 || isLoading}
        >
          <Gem className="mr-2 h-4 w-4" />
          Claim ERC20 Tokens
          {!isAuctionSettled && (
            <span className="ml-2 text-xs">(Auction not settled)</span>
          )}
          {isAuctionSettled && !isOwner && (
            <span className="ml-2 text-xs">(Not NFT owner)</span>
          )}
        </Button>
      </div> */}

      {/* <div className="mt-4 text-center text-sm text-muted-foreground">
        {isAuctionSettled
            ? isOwner
              ? 'You own the NFT key! You can claim the treasure.'
              : "Auction settled. You don't own the NFT key."
            : 'Waiting for auction to settle...'}
      </div> */}
    </main>
  )
}

export default App
