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
  estimatedOutput
}: DCAOrderCardProps) {
  return (
    <div className={`p-4 bg-gray-800 rounded-lg mb-3 border ${
      type === 'buy' ? 'border-green-500/20' : 'border-red-500/20'
    }`}>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <div className="text-gray-400">Total Amount</div>
          <div>{totalAmount}</div>
        </div>
        <div className="flex justify-between">
          <div className="text-gray-400">Split Info</div>
          <div>{splitInfo}</div>
        </div>
        <div className="flex justify-between">
          <div className="text-gray-400">Order Size</div>
          <div>{orderSize}</div>
        </div>
        <div className="flex justify-between">
          <div className="text-gray-400">Frequency</div>
          <div>{frequency}</div>
        </div>
        <div className="flex justify-between">
          <div className="text-gray-400">Status</div>
          <div className={status === 'Active' ? 'text-green-500' : 'text-gray-400'}>
            {status}
          </div>
        </div>
        <div className="flex justify-between">
          <div className="text-gray-400">Remaining Amount</div>
          <div>{remainingAmount}</div>
        </div>
        {estimatedOutput && (
          <div className="flex justify-between">
            <div className="text-gray-400">Estimated Output</div>
            <div>{estimatedOutput}</div>
          </div>
        )}
        <div className="flex justify-between">
          <div className="text-gray-400">Last Update</div>
          <div className="text-sm">{timestamp}</div>
        </div>
      </div>
    </div>
  )
} 