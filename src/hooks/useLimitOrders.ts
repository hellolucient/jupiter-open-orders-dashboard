import { useEffect, useState, useCallback } from 'react';
import { Connection } from '@solana/web3.js';
import { JupiterLimitOrdersAPI } from '../lib/limitOrders/client';
import { LimitOrder } from '../lib/limitOrders/types';

// Refresh interval in milliseconds (30 seconds)
const REFRESH_INTERVAL = 30_000;

interface OrderSummary {
  buyOrders: number;
  sellOrders: number;
  buyVolume: number;
  sellVolume: number;
}

interface TokenOrderSummary {
  CHAOS: OrderSummary;
  LOGOS: OrderSummary;
}

export function useLimitOrders(autoRefresh = false) {
  const [connection] = useState(() => 
    new Connection(process.env.NEXT_PUBLIC_RPC_URL || '')
  );
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [summary, setSummary] = useState<TokenOrderSummary>({
    CHAOS: { buyOrders: 0, sellOrders: 0, buyVolume: 0, sellVolume: 0 },
    LOGOS: { buyOrders: 0, sellOrders: 0, buyVolume: 0, sellVolume: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Calculate summary from orders
  const calculateSummary = (orders: LimitOrder[]): TokenOrderSummary => {
    console.log('useLimitOrders - Starting summary calculation with orders:', orders.length);
    
    const initial = {
      CHAOS: { buyOrders: 0, sellOrders: 0, buyVolume: 0, sellVolume: 0 },
      LOGOS: { buyOrders: 0, sellOrders: 0, buyVolume: 0, sellVolume: 0 }
    };

    const summary = orders.reduce((acc, order) => {
      const token = order.tokenType;
      if (order.orderType === 'BUY') {
        acc[token].buyOrders++;
        acc[token].buyVolume += Math.round(order.takingAmount);
      } else {
        acc[token].sellOrders++;
        acc[token].sellVolume += Math.round(order.makingAmount);
      }
      return acc;
    }, initial);

    console.log('useLimitOrders - Calculated summary:', summary);
    return summary;
  };

  // Fetch orders function
  const fetchOrders = useCallback(async () => {
    console.log('🔍 useLimitOrders - Starting fetch');
    
    if (!process.env.NEXT_PUBLIC_RPC_URL) {
      console.error('❌ useLimitOrders - No RPC URL configured');
      setError(new Error('RPC URL not configured'));
      return;
    }

    try {
      // Clear existing state before fetching
      setOrders([]);
      setSummary({
        CHAOS: { buyOrders: 0, sellOrders: 0, buyVolume: 0, sellVolume: 0 },
        LOGOS: { buyOrders: 0, sellOrders: 0, buyVolume: 0, sellVolume: 0 }
      });
      setError(null);
      setLoading(true);

      const api = new JupiterLimitOrdersAPI(connection);
      console.log('✅ useLimitOrders - API initialized');
      
      const fetchedOrders = await api.getLimitOrders();
      console.log('📦 useLimitOrders - Orders fetched:', {
        total: fetchedOrders.length,
        firstOrder: fetchedOrders[0],
        lastOrder: fetchedOrders[fetchedOrders.length - 1]
      });
      
      const calculatedSummary = calculateSummary(fetchedOrders);
      
      // Set new state all at once
      setOrders(fetchedOrders);
      setSummary(calculatedSummary);
      
      console.log('💾 useLimitOrders - State updated:', {
        ordersLength: fetchedOrders.length,
        summary: calculatedSummary
      });
    } catch (err) {
      console.error('❌ useLimitOrders - Error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch limit orders'));
    } finally {
      setLoading(false);
    }
  }, [connection]);

  // Initial fetch and refresh setup
  useEffect(() => {
    console.log('useLimitOrders - useEffect triggered');
    fetchOrders();

    // Set up auto-refresh only if enabled
    let intervalId: NodeJS.Timeout | undefined;
    if (autoRefresh) {
      intervalId = setInterval(fetchOrders, REFRESH_INTERVAL);
    }

    // Cleanup
    return () => {
      console.log('useLimitOrders - Cleaning up interval');
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchOrders, autoRefresh]);

  return {
    orders,
    summary,
    loading,
    error,
    refresh: fetchOrders,
    isInitialized: !loading || orders.length > 0
  };
} 