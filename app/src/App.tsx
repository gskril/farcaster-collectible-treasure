import { Coins, Trophy } from 'lucide-react'
import {
  useAccount,
  useBalance,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { Abi, Address, formatUnits } from 'viem'
import { PropsWithChildren, useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { toast } from 'sonner'

import { useAuctionStatus, useBids, useErc20Tokens } from './hooks/useEvents'
import { truncateAddress } from './lib/utils'
import { treasureContract } from './web3'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './components/ui/card'
import { Spinner } from './components/spinner'
import { useErc20Price } from './hooks/useTokenPrice'
import { Button } from './components/ui/button'

function App() {
  const { data: ethBalance } = useBalance({
    ...treasureContract,
    blockNumber: 33259579n,
  })
  const tokens = useErc20Tokens()
  const bids = useBids()
  const { address } = useAccount()
  const { data: auction } = useAuctionStatus()

  const { data: ethValue } = useErc20Price(
    '0x4200000000000000000000000000000000000006', // WETH
    Number(ethBalance?.formatted)
  )

  useEffect(() => {
    sdk.actions.ready()
  }, [])

  return (
    <main className="container max-w-md mx-auto px-4 py-8">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="bg-gradient-to-r from-amber-400 to-yellow-600 p-4 rounded-full mb-4">
          <Trophy className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Collectible Treasure</h1>
        <p className="text-muted-foreground">
          Collect Greg's cast to unlock the treasure within this smart contract.
        </p>
      </div>

      {auction?.status === 'settled' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Auction Settled</CardTitle>
            <CardDescription>
              The auction has been settled.{' '}
              {auction.winner === address
                ? 'You'
                : truncateAddress(auction.winner!)}{' '}
              can claim the treasure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <TransactionButton
                auctionWinner={auction.winner}
                func={{
                  ...treasureContract,
                  functionName: 'withdrawEth',
                }}
              >
                Claim ETH
              </TransactionButton>
              <TransactionButton
                auctionWinner={auction.winner}
                func={{
                  ...treasureContract,
                  functionName: 'withdrawErc20Batch',
                  args: [tokens.data?.map(({ address }) => address) ?? []],
                }}
              >
                Claim ERC20s
              </TransactionButton>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Treasure
          </CardTitle>
          <CardDescription>
            Assets received during the auction with their current value.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Coins className="h-5 w-5 text-blue-600" />
                </div>
                <span>ETH</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {Number(ethBalance?.formatted).toFixed(5)}
                </span>
                {ethValue && <span className="font-bold">${ethValue}</span>}
              </div>
            </div>

            {tokens.isLoading && (
              <div className="flex items-center gap-1.5">
                <Spinner />
                <p>Fetching other tokens...</p>
              </div>
            )}

            {tokens.isError && (
              <div className="flex items-center gap-1.5">
                <p>Error fetching other tokens</p>
              </div>
            )}

            {tokens.data?.map((token) => (
              <TokenRow token={token} key={address} />
            ))}
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
            {bids.isLoading && (
              <div className="flex items-center gap-1.5">
                <Spinner />
                <p>Fetching latest bids...</p>
              </div>
            )}

            {bids.data?.map(({ args }, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {address === args.bidder
                      ? 'You'
                      : truncateAddress(args.bidder)}
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
    </main>
  )
}

type TokenRowProps = NonNullable<
  ReturnType<typeof useErc20Tokens>['data']
>[number]

function TokenRow({ token }: { token: TokenRowProps }) {
  const { address, symbol, balance, balanceStr } = token
  const price = useErc20Price(address, balance)

  return (
    <div className="flex justify-between items-center" key={address}>
      <div className="flex items-center gap-2">
        <div className="bg-blue-100 p-2 rounded-full">
          <Coins className="h-5 w-5 text-blue-600" />
        </div>
        <span>{symbol}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{balanceStr}</span>
        {price.data && (
          <span className="font-bold">
            ${Number(price.data).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  )
}

function TransactionButton({
  auctionWinner,
  func,
  children,
}: PropsWithChildren<{
  auctionWinner: Address | undefined
  // TODO: Type this better
  func: {
    address: Address
    abi: Abi
    functionName: string
    args?: unknown[]
  }
}>) {
  const { address } = useAccount()
  const tx = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash: tx.data })

  useEffect(() => {
    if (receipt.isSuccess) {
      toast.success('Transaction successful')
      tx.reset()
    }

    if (receipt.isError) {
      toast.error('Transaction failed')
      tx.reset()
    }
  }, [receipt, tx])

  return (
    <Button
      loading={tx.isPending || receipt.isLoading}
      disabled={auctionWinner !== address}
      onClick={() => {
        tx.writeContract(func)
      }}
    >
      {children}
    </Button>
  )
}

export default App
