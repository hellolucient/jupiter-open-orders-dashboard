import { NextResponse } from 'next/server'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

export async function GET() {
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=solana,bonk-inu&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json'
        },
        next: {
          revalidate: 60 // Cache for 1 minute
        }
      }
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
} 