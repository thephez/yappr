/**
 * Shared formatting utilities for the storefront
 */

/**
 * Format a price in cents/satoshis to a display string
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  if (currency === 'DASH') {
    return `${(price / 100000000).toFixed(4)} DASH`
  }
  if (currency === 'BTC') {
    return `${(price / 100000000).toFixed(8)} BTC`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(price / 100)
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString()
}

/**
 * Format an order ID for display (truncated)
 */
export function formatOrderId(id: string): string {
  return `${id.slice(0, 8)}...`
}
