'use client'

import { CreditCardIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import type { ParsedPaymentUri } from '@/lib/types'

interface PaymentSelectorProps {
  paymentUris: ParsedPaymentUri[]
  selected: ParsedPaymentUri | null
  onSelect: (uri: ParsedPaymentUri) => void
  txid: string
  onTxidChange: (txid: string) => void
  onSubmit: () => void
}

export function PaymentSelector({
  paymentUris,
  selected,
  onSelect,
  txid,
  onTxidChange,
  onSubmit
}: PaymentSelectorProps) {
  const copyPaymentAddress = () => {
    if (!selected) return
    const address = selected.uri.replace(/^[a-z]+:/, '')
    void navigator.clipboard.writeText(address)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-lg font-medium">
        <CreditCardIcon className="h-5 w-5 text-yappr-500" />
        Payment
      </div>

      {paymentUris.length > 0 ? (
        <div className="space-y-3">
          {paymentUris.map((uri, i) => (
            <button
              key={i}
              onClick={() => onSelect(uri)}
              className={`w-full p-4 border rounded-lg text-left transition-colors ${
                selected?.uri === uri.uri
                  ? 'border-yappr-500 bg-yappr-50 dark:bg-yappr-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <p className="font-medium">{uri.label || uri.scheme.replace(':', '')}</p>
              <p className="text-sm text-gray-500 font-mono truncate">{uri.uri}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg text-yellow-700">
          This store has not configured payment methods.
        </div>
      )}

      {selected && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
          <p className="text-sm text-gray-500 mb-2">Send payment to:</p>
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
            <code className="flex-1 text-sm truncate">
              {selected.uri.replace(/^[a-z]+:/, '')}
            </code>
            <button
              onClick={copyPaymentAddress}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
            >
              <ClipboardDocumentIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Transaction ID (optional)
            </label>
            <input
              type="text"
              value={txid}
              onChange={(e) => onTxidChange(e.target.value)}
              placeholder="Enter after payment"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-yappr-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can add this after placing your order
            </p>
          </div>
        </div>
      )}

      <Button
        className="w-full"
        onClick={onSubmit}
        disabled={!selected}
      >
        Review Order
      </Button>
    </div>
  )
}
