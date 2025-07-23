// Idk why there's no wagmi hook for events but this should work fine
import { useQuery } from '@tanstack/react-query'
import { Address, formatUnits, parseAbi, parseAbiItem } from 'viem'
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
      const amountsPerToken = new Map<Address, bigint>()

      for (const log of logs) {
        amountsPerToken.set(
          log.address,
          (amountsPerToken.get(log.address) ?? 0n) + log.args.value
        )
      }

      const tokenAddresses = [...amountsPerToken.keys()]
      const tokenAddressesWithBalance = tokenAddresses.map((address) => ({
        address,
        balance: amountsPerToken.get(address) ?? 0n,
      }))

      // Get the name of each token
      const tokens = new Array<{
        address: Address
        symbol: string | undefined
        balance: number
        balanceStr: string
      }>()

      const res = await viemClient.multicall({
        contracts: tokenAddressesWithBalance.map(({ address }) => {
          return {
            address,
            abi: parseAbi(['function symbol() view returns (string)']),
            functionName: 'symbol',
          }
        }),
      })

      for (let i = 0; i < tokenAddressesWithBalance.length; i++) {
        const symbol = res[i].result
        const balance = tokenAddressesWithBalance[i].balance

        // Naive attempt to filter out spam
        if (symbol && !symbol.includes('|') && balance > 10000n) {
          const formattedBalance = Number(
            formatUnits(
              balance,
              // Naive implementation that assumes only USDC has 6 decimals
              symbol === 'USDC' ? 6 : 18
            )
          )
          const balanceStr = Number(formattedBalance).toLocaleString()

          tokens.push({
            address: tokenAddressesWithBalance[i].address,
            symbol,
            balance: formattedBalance,
            balanceStr,
          })
        }
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
