// Idk why there's no wagmi hook for events but this should work fine
import { useQuery } from '@tanstack/react-query'
import { Address, parseAbi, parseAbiItem } from 'viem'
import { usePublicClient } from 'wagmi'

import { auctionContract, treasureContract } from '../web3.ts'

// ERC20 tokens held by the treasure contract
export function useErc20Tokens() {
  const viemClient = usePublicClient()

  return useQuery({
    queryKey: ['erc20-tokens'],
    queryFn: async () => {
      if (!viemClient) throw new Error('Viem client not found')

      const filter = await viemClient.createEventFilter({
        event: parseAbiItem(
          'event Transfer(address indexed from, address indexed to, uint256 value)'
        ),
        args: {
          to: treasureContract.address,
        },
        fromBlock: 33214449n,
        strict: true,
      })

      const logs = await viemClient.getFilterLogs({ filter })
      const tokenAddresses = [...new Set(logs.map((log) => log.address))]

      // Get the name of each token
      const tokens = new Array<{
        address: Address
        symbol: string | undefined
      }>()

      const res = await viemClient.multicall({
        contracts: tokenAddresses.map((address) => ({
          address,
          abi: parseAbi(['function symbol() view returns (string)']),
          functionName: 'symbol',
        })),
      })

      for (let i = 0; i < tokenAddresses.length; i++) {
        tokens.push({ address: tokenAddresses[i], symbol: res[i].result })
      }

      return tokens
    },
  })
}

export function useBids() {
  const viemClient = usePublicClient()

  return useQuery({
    queryKey: ['bids'],
    queryFn: async () => {
      if (!viemClient) throw new Error('Viem client not found')

      const filter = await viemClient.createEventFilter({
        event: auctionContract.abi[0],
        args: {
          castHash:
            '0x000000000000000000000000484fe4404b41da7cd5f56915be641fdda34f01b7',
        },
        fromBlock: 33214449n,
        strict: true,
      })

      return (await viemClient.getFilterLogs({ filter })).reverse()
    },
  })
}
