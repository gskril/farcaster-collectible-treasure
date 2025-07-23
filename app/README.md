# Mini App

Simple Farcaster mini app / web page to display the current assets in the treasure chest, and the latest bids.

Fun detail: there are no centralized API's or databases, everything is fetched directly from the chain. Tokens and bids are discovered via [event filters](./src/hooks/useEvents.ts), and prices are fetched via the [1inch spot price oracle](./src/hooks/useTokenPrice.ts).
