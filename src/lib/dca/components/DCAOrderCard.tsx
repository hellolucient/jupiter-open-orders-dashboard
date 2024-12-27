'use client'

interface DCAOrderCardProps {
  type: string
  totalAmount: string
  splitInfo: string
  orderSize: string
  frequency: string
  status: string
  remainingAmount: string
  timestamp: string
  estimatedOutput?: string
  minExecutionPrice?: number
  maxExecutionPrice?: number
  minEstimatedOutput?: string
  maxEstimatedOutput?: string
  priceToken?: string
}

export function DCAOrderCard({
  type,
  totalAmount,
  splitInfo,
  orderSize,
  frequency,
  status,
  remainingAmount,
  timestamp,
  estimatedOutput,
  minExecutionPrice,
  maxExecutionPrice,
  minEstimatedOutput,
  maxEstimatedOutput,
  priceToken
}: DCAOrderCardProps) {
  const isBuy = type === 'buy'
  const colorClass = isBuy ? 'text-green-500' : 'text-red-500'
  const dotColorClass = isBuy ? 'bg-green-500' : 'bg-red-500'
  const orderType = isBuy ? 'BUY' : 'SELL'

  // Format date to be more readable
  const formatDate = (dateStr: string) => {
    try {
      // Parse local time format DD/MM/YYYY, HH:mm:ss
      const [datePart, timePart] = dateStr.split(', ');
      const [day, month, year] = datePart.split('/');
      const [hours, minutes, seconds] = timePart.split(':');

      // First create date in local time
      const localDate = new Date(
        parseInt(year),
        parseInt(month) - 1,  // months are 0-based
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      );

      // Get the UTC time values
      const utcYear = localDate.getUTCFullYear();
      const utcMonth = localDate.getUTCMonth();
      const utcDay = localDate.getUTCDate();
      const utcHours = localDate.getUTCHours();
      const utcMinutes = localDate.getUTCMinutes();
      const utcSeconds = localDate.getUTCSeconds();

      // Create a new date with UTC values
      const utcDate = new Date(Date.UTC(utcYear, utcMonth, utcDay, utcHours, utcMinutes, utcSeconds));

      // Format in UTC
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZoneName: 'short'
      }).format(utcDate);
    } catch (error) {
      console.error('Error formatting date:', error, dateStr);
      return dateStr; // Return original string if parsing fails
    }
  }

  // Format price with consistent decimals
  const formatPrice = (value: number | undefined) => {
    if (typeof value === 'undefined') return 'Market Price'
    // For very small numbers (less than 0.000001), show more decimal places
    if (value > 0 && value < 0.000001) {
      return value.toLocaleString('en-US', { minimumFractionDigits: 12, maximumFractionDigits: 12 })
    }
    return value.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })
  }

  return (
    <div className={`p-4 bg-gray-800 rounded-lg mb-3 border ${
      isBuy ? 'border-green-500/20' : 'border-red-500/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full ${dotColorClass}`} />
          <span className={`ml-2 font-medium ${colorClass}`}>{orderType}</span>
        </div>
        <div className="text-gray-400 text-sm">
          {formatDate(timestamp)}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="grid grid-cols-2">
          <div className="text-gray-400">Total Amount</div>
          <div className="text-right">{totalAmount}</div>
        </div>
        <div className="grid grid-cols-2">
          <div className="text-gray-400">Split Info</div>
          <div className="text-right">{splitInfo}</div>
        </div>
        <div className="grid grid-cols-2">
          <div className="text-gray-400">Order Size</div>
          <div className="text-right">{orderSize}</div>
        </div>
        <div className="grid grid-cols-2">
          <div className="text-gray-400">Frequency</div>
          <div className="text-right">{frequency}</div>
        </div>
        <div className="grid grid-cols-2">
          <div className="text-gray-400">Status</div>
          <div className={`text-right ${status === 'Active' ? 'text-green-500' : 'text-gray-400'}`}>
            {status}
          </div>
        </div>
        <div className="grid grid-cols-2">
          <div className="text-gray-400">Remaining Amount</div>
          <div className="text-right">{remainingAmount}</div>
        </div>
        {isBuy && (
          <>
            <div className="grid grid-cols-2">
              <div className="text-gray-400">Min. Execution Price</div>
              <div className="text-right">{minExecutionPrice ? `${formatPrice(minExecutionPrice)} ${priceToken}` : 'N/A'}</div>
            </div>
            <div className="grid grid-cols-2">
              <div className="text-gray-400">Max. Estimated Output</div>
              <div className="text-right">{maxEstimatedOutput || 'N/A'}</div>
            </div>
            <div className="grid grid-cols-2">
              <div className="text-gray-400">Max. Execution Price</div>
              <div className="text-right">{maxExecutionPrice ? `${formatPrice(maxExecutionPrice)} ${priceToken}` : 'N/A'}</div>
            </div>
            <div className="grid grid-cols-2">
              <div className="text-gray-400">Min. Estimated Output</div>
              <div className="text-right">{minEstimatedOutput || 'N/A'}</div>
            </div>
          </>
        )}
        {!isBuy && (
          <>
            {minExecutionPrice && (
              <div className="grid grid-cols-2">
                <div className="text-gray-400">Execution Price</div>
                <div className="text-right">{formatPrice(minExecutionPrice)} {priceToken}</div>
              </div>
            )}
            {estimatedOutput && (
              <div className="grid grid-cols-2">
                <div className="text-gray-400">Estimated Output</div>
                <div className="text-right">{estimatedOutput}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 