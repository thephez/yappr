'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { Sidebar } from '@/components/layout/sidebar'
import { RightSidebar } from '@/components/layout/right-sidebar'
import { Button } from '@/components/ui/button'
import { AddressForm, ShippingSelector, PaymentSelector, PolicyAgreement, OrderReview } from '@/components/checkout'
import { withAuth, useAuth } from '@/contexts/auth-context'
import { useSdk } from '@/contexts/sdk-context'
import { useSettingsStore } from '@/lib/store'
import { cartService } from '@/lib/services/cart-service'
import { storeService } from '@/lib/services/store-service'
import { shippingZoneService } from '@/lib/services/shipping-zone-service'
import { storeOrderService } from '@/lib/services/store-order-service'
import { privateFeedCryptoService } from '@/lib/services/private-feed-crypto-service'
import { identityService } from '@/lib/services/identity-service'
import { parseStorePolicies } from '@/lib/utils/policies'
import type { Store, CartItem, ShippingAddress, BuyerContact, ParsedPaymentUri, ShippingZone, StorePolicy } from '@/lib/types'

/**
 * Normalize key data from various formats to Uint8Array
 */
function normalizeKeyData(data: unknown): Uint8Array | null {
  if (!data) return null
  if (data instanceof Uint8Array) return data
  if (Array.isArray(data)) return new Uint8Array(data)
  if (typeof data === 'string') {
    try {
      return new Uint8Array(Buffer.from(data, 'base64'))
    } catch {
      return null
    }
  }
  return null
}

function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeId = searchParams.get('storeId')
  const { user } = useAuth()
  const { isReady: sdkReady } = useSdk()
  const potatoMode = useSettingsStore((s) => s.potatoMode)

  const [store, setStore] = useState<Store | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderCreated, setOrderCreated] = useState(false)
  const [step, setStep] = useState<'address' | 'shipping' | 'payment' | 'policies' | 'review'>('address')
  const [error, setError] = useState<string | null>(null)

  // Policies
  const [storePolicies, setStorePolicies] = useState<StorePolicy[]>([])
  const [agreedPolicies, setAgreedPolicies] = useState<Set<number>>(new Set())

  // Address form
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US'
  })

  // Contact
  const [buyerContact, setBuyerContact] = useState<BuyerContact>({})

  // Shipping
  const [matchedZone, setMatchedZone] = useState<ShippingZone | null>(null)
  const [shippingCost, setShippingCost] = useState(0)
  const [zonesLoadFailed, setZonesLoadFailed] = useState(false)
  const [hasNoZones, setHasNoZones] = useState(false)

  // Payment
  const [selectedPaymentUri, setSelectedPaymentUri] = useState<ParsedPaymentUri | null>(null)
  const [txid, setTxid] = useState('')
  const [notes, setNotes] = useState('')

  // Load store and cart items
  useEffect(() => {
    if (!sdkReady) return
    if (!storeId) {
      router.push('/cart')
      return
    }

    const loadData = async () => {
      try {
        setIsLoading(true)
        const [storeData, items] = await Promise.all([
          storeService.getById(storeId),
          Promise.resolve(cartService.getItemsForStore(storeId))
        ])

        if (!storeData || items.length === 0) {
          router.push('/cart')
          return
        }

        setStore(storeData)
        setCartItems(items)

        // Parse store policies
        if (storeData) {
          setStorePolicies(parseStorePolicies(storeData.policies))
        }

        // Select first payment URI by default
        if (storeData.paymentUris && storeData.paymentUris.length > 0) {
          setSelectedPaymentUri(storeData.paymentUris[0])
        }
      } catch (error) {
        console.error('Failed to load checkout data:', error)
        router.push('/cart')
      } finally {
        setIsLoading(false)
      }
    }

    loadData().catch(console.error)
  }, [sdkReady, storeId, router])

  // Calculate shipping when address changes
  useEffect(() => {
    if (!sdkReady || !storeId || !shippingAddress.postalCode || !shippingAddress.country) return

    const calculateShipping = async () => {
      try {
        setZonesLoadFailed(false)

        // First try to get zones to check if store has any configured
        const zones = await shippingZoneService.getByStore(storeId)

        if (zones.length === 0) {
          // Store has no shipping zones - allow checkout without shipping cost
          setHasNoZones(true)
          setMatchedZone(null)
          setShippingCost(0)
          return
        }

        setHasNoZones(false)
        const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
        const weight = await cartService.getTotalWeight(storeId)

        const { zone, cost } = await shippingZoneService.calculateShipping(
          storeId,
          shippingAddress,
          { totalWeight: weight, subtotal }
        )

        setMatchedZone(zone)
        setShippingCost(cost)
      } catch (error) {
        console.error('Failed to calculate shipping:', error)
        // If zones failed to load, allow checkout anyway
        setZonesLoadFailed(true)
        setMatchedZone(null)
        setShippingCost(0)
      }
    }

    calculateShipping().catch(console.error)
  }, [sdkReady, storeId, shippingAddress, cartItems])

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  }, [cartItems])

  const total = useMemo(() => {
    return subtotal + shippingCost
  }, [subtotal, shippingCost])

  const currency = cartItems[0]?.currency || 'USD'

  const handleAddressSubmit = () => {
    setStep('shipping')
  }

  const handleShippingSubmit = () => {
    // Allow checkout if: zone matched, zones failed to load, or store has no zones
    if (!matchedZone && !zonesLoadFailed && !hasNoZones) {
      setError('We cannot ship to this address. Please check your shipping address.')
      return
    }
    setStep('payment')
  }

  const handlePaymentSubmit = () => {
    if (!selectedPaymentUri) return
    setStep('policies')
  }

  const handlePoliciesSubmit = () => {
    setStep('review')
  }

  const handlePolicyAgreementChange = (index: number, agreed: boolean) => {
    setAgreedPolicies((prev) => {
      const next = new Set(prev)
      if (agreed) {
        next.add(index)
      } else {
        next.delete(index)
      }
      return next
    })
  }

  const handlePlaceOrder = async () => {
    if (!user?.identityId || !store || !selectedPaymentUri) return

    setIsSubmitting(true)
    setError(null)

    try {
      const payload = storeOrderService.buildOrderPayload(
        cartItems,
        shippingAddress,
        buyerContact,
        shippingCost,
        selectedPaymentUri.uri,
        currency,
        notes || undefined
      )

      // Add txid if provided
      if (txid) {
        payload.txid = txid
      }

      // Fetch seller's encryption public key
      const sellerIdentity = await identityService.getIdentity(store.ownerId)
      if (!sellerIdentity) {
        throw new Error('Could not fetch seller identity')
      }

      const encryptionKey = sellerIdentity.publicKeys.find(
        (k) => k.purpose === 1 && k.type === 0 && !k.disabledAt
      )
      if (!encryptionKey?.data) {
        throw new Error('Seller does not have an encryption key')
      }

      const sellerPublicKey = normalizeKeyData(encryptionKey.data)
      if (!sellerPublicKey) {
        throw new Error('Could not parse seller encryption key')
      }

      // Serialize payload to bytes
      const payloadJson = JSON.stringify(payload)
      const encoder = new TextEncoder()
      const payloadBytes = encoder.encode(payloadJson)

      // Build AAD (Additional Authenticated Data) for context binding
      // Format: "yappr/order/v1" - simple context string
      const aad = encoder.encode('yappr/order/v1')

      // Encrypt with ECIES (ephemeral ECDH + XChaCha20-Poly1305)
      // Returns: ephemeralPubKey (33 bytes) || ciphertext
      const encryptedPayload = await privateFeedCryptoService.eciesEncrypt(
        sellerPublicKey,
        payloadBytes,
        aad
      )

      // Generate random nonce (stored separately for contract compatibility)
      // Note: ECIES derives its own nonce via HKDF, this is additional metadata
      const nonce = new Uint8Array(24)
      crypto.getRandomValues(nonce)

      await storeOrderService.createOrder(user.identityId, {
        storeId: store.id,
        sellerId: store.ownerId,
        encryptedPayload,
        nonce
      })

      // Clear cart items for this store
      cartService.removeStoreItems(store.id)

      setOrderCreated(true)
    } catch (err) {
      console.error('Failed to create order:', err)
      setError(err instanceof Error ? err.message : 'Failed to create order')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-40px)] flex">
        <Sidebar />
        <div className="flex-1 flex justify-center min-w-0">
          <main className="w-full max-w-[700px] md:border-x border-gray-200 dark:border-gray-800 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yappr-500" />
          </main>
        </div>
        <RightSidebar />
      </div>
    )
  }

  if (orderCreated) {
    return (
      <div className="min-h-[calc(100vh-40px)] flex">
        <Sidebar />
        <div className="flex-1 flex justify-center min-w-0">
          <main className="w-full max-w-[700px] md:border-x border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center p-8">
            <CheckCircleIcon className="h-20 w-20 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
            <p className="text-gray-500 text-center max-w-sm mb-6">
              Your order has been sent to the seller. They will process it and provide updates.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => router.push('/orders')}>
                View Orders
              </Button>
              <Button onClick={() => router.push('/store')}>
                Continue Shopping
              </Button>
            </div>
          </main>
        </div>
        <RightSidebar />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-40px)] flex">
      <Sidebar />

      <div className="flex-1 flex justify-center min-w-0">
        <main className="w-full max-w-[700px] md:border-x border-gray-200 dark:border-gray-800">
          <header className={`sticky top-[40px] z-40 bg-white/80 dark:bg-neutral-900/80 border-b border-gray-200 dark:border-gray-800 ${potatoMode ? '' : 'backdrop-blur-xl'}`}>
            <div className="flex items-center gap-4 p-4">
              <button
                onClick={() => step === 'address' ? router.back() : setStep(
                  step === 'shipping' ? 'address' :
                  step === 'payment' ? 'shipping' :
                  step === 'policies' ? 'payment' : 'policies'
                )}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold">Checkout</h1>
            </div>

            {/* Progress Steps */}
            <div className="flex px-4 pb-4">
              {['address', 'shipping', 'payment', 'policies', 'review'].map((s, i) => (
                <div key={s} className="flex-1 flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === s
                        ? 'bg-yappr-500 text-white'
                        : ['address', 'shipping', 'payment', 'policies', 'review'].indexOf(step) > i
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                    }`}
                  >
                    {i + 1}
                  </div>
                  {i < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        ['address', 'shipping', 'payment', 'policies', 'review'].indexOf(step) > i
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-800'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </header>

          {error && (
            <div className="m-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Address Step */}
          {step === 'address' && (
            <AddressForm
              address={shippingAddress}
              contact={buyerContact}
              onAddressChange={setShippingAddress}
              onContactChange={setBuyerContact}
              onSubmit={handleAddressSubmit}
            />
          )}

          {/* Shipping Step */}
          {step === 'shipping' && (
            <ShippingSelector
              matchedZone={matchedZone}
              shippingCost={shippingCost}
              currency={currency}
              city={shippingAddress.city}
              country={shippingAddress.country}
              zonesLoadFailed={zonesLoadFailed}
              hasNoZones={hasNoZones}
              onSubmit={handleShippingSubmit}
            />
          )}

          {/* Payment Step */}
          {step === 'payment' && (
            <PaymentSelector
              paymentUris={store?.paymentUris || []}
              selected={selectedPaymentUri}
              onSelect={setSelectedPaymentUri}
              txid={txid}
              onTxidChange={setTxid}
              onSubmit={handlePaymentSubmit}
            />
          )}

          {/* Policies Step */}
          {step === 'policies' && (
            <PolicyAgreement
              policies={storePolicies}
              agreedIndexes={agreedPolicies}
              onAgreementChange={handlePolicyAgreementChange}
              onSubmit={handlePoliciesSubmit}
            />
          )}

          {/* Review Step */}
          {step === 'review' && (
            <OrderReview
              store={store}
              items={cartItems}
              shippingAddress={shippingAddress}
              shippingCost={shippingCost}
              subtotal={subtotal}
              total={total}
              currency={currency}
              notes={notes}
              onNotesChange={setNotes}
              onSubmit={handlePlaceOrder}
              isSubmitting={isSubmitting}
            />
          )}
        </main>
      </div>

      <RightSidebar />
    </div>
  )
}

export default withAuth(CheckoutPage)
