import { wagmiConfig } from '@/web3'
import { useQuery } from '@tanstack/react-query'
import { Address, parseAbi, publicActions } from 'viem'
import { base } from 'viem/chains'

export function useErc20Price(address: Address, amount: number) {
  return useQuery({
    queryKey: ['erc20-price', address],
    queryFn: () => getErc20Price(address, amount),
    enabled: !!address && !!amount,
  })
}

async function getErc20Price(token: Address, amount: number) {
  const viemClient = wagmiConfig
    .getClient({ chainId: base.id })
    .extend(publicActions)

  const usdc = {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    decimals: 6,
  } as const

  if (token.toLowerCase() === usdc.address.toLowerCase()) {
    return amount
  }

  const decimals = await viemClient.readContract({
    address: token,
    abi: parseAbi(['function decimals() view returns (uint8)']),
    functionName: 'decimals',
  })

  const res = await viemClient.readContract({
    address: '0x52cbE0f49CcdD4Dc6E9C13BAb024EABD2842045B', // 1inch Oracle
    abi: parseAbi([
      'function getRate(address srcsourceToken, address dstsourceToken, bool useWrappers) view returns (uint256 weightedRate)',
    ]),
    functionName: 'getRate',
    args: [usdc.address, token, false],
  })

  if (res === 0n) {
    return null
  }

  const numerator = 10 ** usdc.decimals
  const denominator = 10 ** decimals
  const conversionFactor = numerator / (1e18 * denominator)
  const price = 1 / (Number(res) * conversionFactor)

  return (price * amount).toFixed(2)
}
