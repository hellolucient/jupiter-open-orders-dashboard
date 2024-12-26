# Jupiter Open Orders Dashboard

A dashboard for monitoring Jupiter DCA and Limit Orders for LOGOS and CHAOS tokens.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main dashboard page
│   └── layout.tsx         # Root layout
│
├── components/
│   ├── charts/
│   │   └── VolumeChart.tsx    # Shared volume visualization
│   ├── shared/
│   │   ├── TokenSection.tsx   # Token-specific dashboard section
│   │   ├── DashboardHeader.tsx
│   │   └── OrderTabs.tsx      # DCA/Limit order view switcher
│   └── ui/
│       └── loading-spinner.tsx # Generic loading indicator
│
├── lib/
│   ├── dca/                   # DCA (Dollar Cost Average) Feature
│   │   ├── components/
│   │   │   └── DCAOrderCard.tsx
│   │   ├── hooks/
│   │   │   └── useDCAData.ts  # DCA data fetching and state
│   │   ├── scripts/
│   │   │   ├── fetchDCAHistory.ts
│   │   │   └── runAnalyzer.ts
│   │   └── types/
│   │       └── index.ts       # DCA-specific types
│   │
│   ├── limitOrders/           # Limit Orders Feature
│   │   ├── components/
│   │   │   └── LimitOrderCard.tsx
│   │   ├── hooks/
│   │   │   └── useLimitOrders.ts  # LO data fetching and state
│   │   ├── scripts/
│   │   │   ├── exportLimitOrders.ts
│   │   │   └── runAnalyzerTest.ts
│   │   └── types/
│   │       └── index.ts       # LO-specific types
│   │
│   └── shared/               # Shared utilities
│       ├── hooks/
│       │   └── useAutoRefresh.ts
│       ├── types/
│       │   ├── token.ts      # Token interfaces
│       │   ├── api.ts        # API response types
│       │   └── chart.ts      # Chart data types
│       └── tokenConfig.ts    # Token configuration
│
└── types/                    # Type re-exports
    └── index.ts

data/                        # Script outputs (git-ignored)
├── dca/                     # DCA analysis outputs
└── limit-orders/            # Limit order analysis outputs
```

## Key Components

### DCA (Dollar Cost Average)
- `useDCAData`: Hook for fetching and managing DCA positions
- `DCAOrderCard`: Component for displaying individual DCA orders
- Scripts for analyzing DCA order history and performance

### Limit Orders
- `useLimitOrders`: Hook for fetching and managing limit orders
- `LimitOrderCard`: Component for displaying individual limit orders
- Scripts for exporting and analyzing limit order data

### Shared
- `TokenSection`: Main component for displaying token-specific data
- `VolumeChart`: Chart component for visualizing order volumes
- Token configuration and shared types

## Scripts

### DCA Scripts
- `fetchDCAHistory.ts`: Fetches and analyzes DCA order history
- `runAnalyzer.ts`: Analyzes DCA order performance

### Limit Order Scripts
- `exportLimitOrders.ts`: Exports current limit orders
- `runAnalyzerTest.ts`: Tests limit order analysis functionality

## Development

```bash
# Start development server
npm run dev

# Run DCA analysis
npm run test-dca

# Run limit order analysis
npm run test-lo

# Export data
npm run export-limit-orders
npm run fetch-dca-history
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
