# Jupiter Open Orders Dashboard

This is a dashboard for viewing Jupiter DCA and Limit Orders.

## DCA Orders

The dashboard shows active DCA (Dollar Cost Average) orders for CHAOS and LOGOS tokens. Important notes:

### Flash Fills vs Regular DCA Orders

- Orders initiated with `initiateFlashFill` instruction are filtered out as they represent immediate execution rather than ongoing DCA orders
- Flash fills can also occur in regular DCA orders when no price limits are set (no minOutAmount/maxOutAmount)
  - These orders will execute immediately when the next cycle hits, as there are no price constraints
  - They are treated differently from orders initiated with `initiateFlashFill`
- Only orders with remaining cycles and unused deposits are shown
- The analysis focuses on CHAOS and LOGOS token pairs

### Price Limits and Estimated Output

For buy orders, the estimated output tokens are calculated based on:
- If minOutAmount is set: That's the minimum total tokens they'll get for the entire order
- If no price limits: Current market price is used to estimate output (`remainingAmount / currentPrice`)

For sell orders, the output is simply the remaining amount to be sold.

### DCA Account Fields

Each DCA account contains the following fields:

- `user`: The owner of the DCA position
- `inputMint`: The mint address of the input token
- `outputMint`: The mint address of the output token
- `idx`: Position index
- `nextCycleAt`: Timestamp for the next cycle execution
- `inDeposited`: Total amount deposited for input token
- `inWithdrawn`: Amount of input token withdrawn
- `outWithdrawn`: Amount of output token withdrawn
- `inUsed`: Amount of input token used in swaps
- `outReceived`: Amount of output token received from swaps
- `inAmountPerCycle`: Amount of input token to use per cycle
- `cycleFrequency`: Time between cycles in seconds
- `nextCycleAmountLeft`: Remaining amount for the next cycle
- `inAccount`: Input token account
- `outAccount`: Output token account
- `minOutAmount`: Minimum output amount per swap (price protection)
- `maxOutAmount`: Maximum output amount per swap (price protection)
- `keeperInBalanceBeforeBorrow`: Keeper's input token balance before borrowing
- `dcaOutBalanceBeforeSwap`: DCA output token balance before swap
- `createdAt`: Position creation timestamp
- `bump`: Account bump seed

## Getting Started

First, create a `.env` file with your Helius RPC URL:
```env
NEXT_PUBLIC_RPC_URL=https://rpc.helius.xyz/?api-key=YOUR_API_KEY
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Analysis Scripts

The project includes scripts to analyze DCA and Limit orders:

```bash
# Analyze DCA orders
npm run test-dca

# Analyze Limit orders
npm run test-lo
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
