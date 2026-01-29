/**
 * Upload Module
 *
 * Provides a provider-agnostic upload system for Yappr.
 * Currently supports Storacha (IPFS) as the upload backend.
 */

export * from './types'
export * from './errors'
export { providerRegistry } from './provider-registry'
export { getStorachaProvider, StorachaProvider } from './providers/storacha/storacha-provider'
export type { StorachaCredentials } from './providers/storacha/storacha-provider'
export {
  hasStorachaCredentials,
  getStorachaCredentials,
  clearStorachaCredentials,
} from './providers/storacha/credential-storage'
