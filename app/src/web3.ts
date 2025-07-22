import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'
import { parseAbi } from 'viem'

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(import.meta.env.VITE_BASE_RPC_URL),
  },
  connectors: [miniAppConnector()],
})

export const treasureContract = {
  address: '0xDB34Da70Cfd694190742E94B7f17769Bc3d84D27',
  abi: parseAbi([
    'function withdrawEth()',
    'function withdrawErc20(address token)',
    'function withdrawErc20Batch(address[] tokens)',
  ]),
} as const

export const auctionContract = {
  address: '0xFC52e33F48Dd3fcd5EE428c160722efda645D74A',
  abi: parseAbi([
    'event BidPlaced(bytes32 indexed castHash, address indexed bidder, uint96 indexed bidderFid, uint256 amount, address authorizer)',
    'event AuctionSettled(bytes32 indexed castHash, address indexed winner, uint96 indexed winnerFid, uint256 amount)',
  ]),
} as const
