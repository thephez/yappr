'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import type { ShippingZone } from '@/lib/types'

type RateType = 'flat' | 'weight_tiered' | 'price_tiered'

interface ShippingZoneModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    name: string
    rateType: RateType
    flatRate?: number
    currency: string
    countryPattern?: string
    priority?: number
  }) => Promise<void>
  zone?: ShippingZone | null
}

export function ShippingZoneModal({ isOpen, onClose, onSave, zone }: ShippingZoneModalProps) {
  const [name, setName] = useState('')
  const [rateType, setRateType] = useState<RateType>('flat')
  const [flatRate, setFlatRate] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [countryPattern, setCountryPattern] = useState('')
  const [priority, setPriority] = useState('0')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!zone

  // Pre-fill form when editing
  useEffect(() => {
    if (zone) {
      setName(zone.name || '')
      setRateType(zone.rateType || 'flat')
      setFlatRate(zone.flatRate ? (zone.flatRate / 100).toString() : '')
      setCurrency(zone.currency || 'USD')
      setCountryPattern(zone.countryPattern || '')
      setPriority(zone.priority?.toString() || '0')
    } else {
      // Reset form for new zone
      setName('')
      setRateType('flat')
      setFlatRate('')
      setCurrency('USD')
      setCountryPattern('')
      setPriority('0')
    }
  }, [zone, isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const flatRateInCents = flatRate ? Math.round(parseFloat(flatRate) * 100) : 0
      await onSave({
        name: name.trim(),
        rateType,
        flatRate: rateType === 'flat' ? flatRateInCents : undefined,
        currency,
        countryPattern: countryPattern.trim() || undefined,
        priority: Math.max(0, priority ? parseInt(priority, 10) : 0)
      })
      // Reset form
      setName('')
      setFlatRate('')
      setCountryPattern('')
      setPriority('0')
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
          <h2 className="text-lg font-bold">{isEditing ? 'Edit Shipping Zone' : 'Add Shipping Zone'}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Zone Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Domestic, Europe, Worldwide"
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yappr-500"
              maxLength={63}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Country Pattern (optional)</label>
            <input
              type="text"
              value={countryPattern}
              onChange={(e) => setCountryPattern(e.target.value)}
              placeholder="e.g., US, US|CA, US.IL"
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yappr-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use ISO codes: US, CA, GB, AU, DE, FR. Examples: US, US|CA, US.IL
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              onBlur={() => {
                const val = parseInt(priority, 10)
                if (isNaN(val) || val < 0) setPriority('0')
              }}
              placeholder="0"
              min="0"
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yappr-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower = higher priority. Use to make specific zones (e.g., US.IL) match before general ones (e.g., US).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rate Type</label>
            <select
              value={rateType}
              onChange={(e) => setRateType(e.target.value as RateType)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yappr-500"
            >
              <option value="flat">Flat Rate</option>
              <option value="weight_tiered">Weight-based Tiers</option>
              <option value="price_tiered">Price-based Tiers</option>
            </select>
          </div>

          {rateType === 'flat' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Flat Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={flatRate}
                    onChange={(e) => setFlatRate(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-7 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yappr-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yappr-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="DASH">DASH</option>
                </select>
              </div>
            </div>
          )}

          {rateType !== 'flat' && (
            <p className="text-sm text-gray-500 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              Tiered shipping configuration coming soon. Use flat rate for now.
            </p>
          )}
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
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Zone')}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
