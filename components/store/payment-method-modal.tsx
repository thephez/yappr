'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    scheme: string
    address: string
    label?: string
  }) => Promise<void>
}

export function PaymentMethodModal({ isOpen, onClose, onSave }: PaymentMethodModalProps) {
  const [scheme, setScheme] = useState('dash:')
  const [address, setAddress] = useState('')
  const [label, setLabel] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!address.trim()) return

    setIsSubmitting(true)
    try {
      await onSave({
        scheme,
        address: address.trim(),
        label: label.trim() || undefined
      })
      // Reset form
      setAddress('')
      setLabel('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold">Add Payment Method</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Payment Type</label>
            <select
              value={scheme}
              onChange={(e) => setScheme(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yappr-500"
            >
              <option value="dash:">Dash</option>
              <option value="bitcoin:">Bitcoin</option>
              <option value="ethereum:">Ethereum</option>
              <option value="litecoin:">Litecoin</option>
              <option value="paypal:">PayPal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address / Username *</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={scheme === 'dash:' ? 'XxxxxxxxxxxxxxxxxxxxxxxxxYYYYYY' : 'Enter address'}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yappr-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              {scheme === 'dash:' && 'Your Dash wallet address'}
              {scheme === 'bitcoin:' && 'Your Bitcoin wallet address'}
              {scheme === 'ethereum:' && 'Your Ethereum wallet address'}
              {scheme === 'paypal:' && 'Your PayPal email or username'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Main Wallet, Business Account"
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yappr-500"
            />
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting || !address.trim()}
          >
            {isSubmitting ? 'Adding...' : 'Add Payment'}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
