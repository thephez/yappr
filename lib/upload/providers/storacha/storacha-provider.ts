'use client'

/**
 * Storacha Upload Provider
 *
 * Implementation of UploadProvider for Storacha (formerly web3.storage).
 * Handles email-based authentication, space management, and IPFS uploads.
 */

import type { UploadProvider, ProviderStatus, UploadOptions, UploadResult, StorachaCredentials } from '../../types'
import { UploadException, UploadErrorCode } from '../../errors'
import {
  storeStorachaCredentials,
  getStorachaCredentials,
  clearStorachaCredentials,
  hasStorachaCredentials,
} from './credential-storage'

// Re-export for convenience
export type { StorachaCredentials }

// Storacha client types (dynamically imported)
type StorachaClient = Awaited<ReturnType<typeof import('@storacha/client').create>>
type Account = Awaited<ReturnType<StorachaClient['login']>>

const SPACE_NAME = 'yappr-uploads'
const VERIFICATION_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
const IPFS_GATEWAY = 'https://w3s.link/ipfs' // Storacha's gateway

/**
 * Storacha upload provider implementation
 */
export class StorachaProvider implements UploadProvider {
  readonly name = 'Storacha'

  private client: StorachaClient | null = null
  private status: ProviderStatus = 'disconnected'
  private identityId: string | null = null
  private connectedEmail: string | null = null

  /**
   * Set the identity ID for credential storage
   */
  setIdentityId(identityId: string): void {
    this.identityId = identityId
  }

  /**
   * Get the connected email
   */
  getConnectedEmail(): string | null {
    return this.connectedEmail
  }

  /**
   * Get the space DID if connected
   */
  getSpaceDid(): string | null {
    if (!this.client || this.status !== 'connected') {
      return null
    }
    return this.client.currentSpace()?.did() ?? null
  }

  /**
   * Setup with email - full flow including verification
   * Returns when the user has clicked the verification link
   */
  async setupWithEmail(email: string, signal?: AbortSignal): Promise<void> {
    if (!this.identityId) {
      throw new UploadException(UploadErrorCode.CREDENTIAL_ERROR, 'Identity ID not set')
    }

    this.status = 'connecting'

    try {
      // Dynamically import to avoid SSR issues
      const { create } = await import('@storacha/client')

      // Create a new client
      this.client = await create()

      this.status = 'verification_pending'

      // Login with email - this sends verification email and waits for click
      let account: Account
      try {
        account = await Promise.race([
          this.client.login(email as `${string}@${string}`, { signal }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new UploadException(UploadErrorCode.VERIFICATION_TIMEOUT, 'Email verification timed out')),
              VERIFICATION_TIMEOUT_MS
            )
          )
        ])
      } catch (error) {
        if (error instanceof UploadException) {
          throw error
        }
        throw new UploadException(
          UploadErrorCode.VERIFICATION_FAILED,
          'Email verification failed',
          error instanceof Error ? error : undefined
        )
      }

      // Wait for plan if new account
      try {
        await account.plan.wait()
      } catch (error) {
        // Plan wait can fail for various reasons, log but continue
        console.warn('Plan wait failed (may be expected for existing accounts):', error)
      }

      // Check for existing spaces or create new one
      const spaces = this.client.spaces()
      const space = spaces.find(s => s.name === SPACE_NAME)
      let spaceDid: `did:key:${string}`

      if (!space) {
        try {
          // Create a new space associated with the account
          const ownedSpace = await this.client.createSpace(SPACE_NAME, { account })
          spaceDid = ownedSpace.did()
        } catch (error) {
          throw new UploadException(
            UploadErrorCode.SPACE_CREATION_FAILED,
            'Failed to create upload space',
            error instanceof Error ? error : undefined
          )
        }
      } else {
        spaceDid = space.did()
      }

      // Set as current space
      await this.client.setCurrentSpace(spaceDid)

      // Export and store credentials
      await this.saveCredentials(email, spaceDid)

      this.connectedEmail = email
      this.status = 'connected'
    } catch (error) {
      this.status = 'error'
      this.client = null
      if (error instanceof UploadException) {
        throw error
      }
      throw new UploadException(
        UploadErrorCode.CONNECTION_FAILED,
        'Failed to connect to Storacha',
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Connect using stored credentials
   */
  async connect(): Promise<void> {
    if (!this.identityId) {
      throw new UploadException(UploadErrorCode.CREDENTIAL_ERROR, 'Identity ID not set')
    }

    // Check for stored credentials
    const credentials = getStorachaCredentials(this.identityId)
    if (!credentials) {
      throw new UploadException(UploadErrorCode.NOT_CONNECTED, 'No stored credentials found')
    }

    this.status = 'connecting'

    try {
      await this.restoreFromCredentials(credentials)
      this.connectedEmail = credentials.email
      this.status = 'connected'
    } catch (error) {
      this.status = 'error'
      this.client = null
      throw new UploadException(
        UploadErrorCode.CONNECTION_FAILED,
        'Failed to restore connection',
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Restore client from credentials
   */
  private async restoreFromCredentials(credentials: StorachaCredentials): Promise<void> {
    const { create } = await import('@storacha/client')
    const { AgentData } = await import('@storacha/access/agent')

    // Parse the stored agent data
    const exportedData = JSON.parse(atob(credentials.agentData))

    // Restore agent data from export
    const agentData = AgentData.fromExport(exportedData)

    // Create client with restored agent data
    this.client = await create({ principal: agentData.principal })

    // Import the proofs/delegations
    const delegations = Array.from(agentData.delegations.values())
    for (const delegationEntry of delegations) {
      await this.client.agent.addProof(delegationEntry.delegation)
    }

    // Set the current space
    await this.client.setCurrentSpace(credentials.spaceDid as `did:key:${string}`)
  }

  /**
   * Save credentials for later restoration
   */
  private async saveCredentials(email: string, spaceDid: string): Promise<void> {
    if (!this.identityId || !this.client) {
      throw new UploadException(UploadErrorCode.CREDENTIAL_ERROR, 'Cannot save credentials without client')
    }

    // Export agent data and encode as base64
    // Access agent's underlying data for export via internal API
    // Note: This uses internal Storacha API - may need updates if SDK changes
    try {
      const internalClient = this.client as unknown as { _agent?: { data?: { export?: () => unknown } } }
      if (!internalClient._agent?.data?.export) {
        throw new Error('Storacha SDK structure changed - unable to export agent data')
      }
      const exported = internalClient._agent.data.export()
      if (!exported) {
        throw new Error('Agent data export returned empty')
      }
      const agentDataB64 = btoa(JSON.stringify(exported))

      const credentials: StorachaCredentials = {
        email,
        agentData: agentDataB64,
        spaceDid,
      }

      storeStorachaCredentials(this.identityId, credentials)
    } catch (error) {
      throw new UploadException(
        UploadErrorCode.CREDENTIAL_ERROR,
        'Failed to export authentication data',
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Disconnect from the provider
   */
  async disconnect(clearCredentials = true): Promise<void> {
    this.client = null
    this.connectedEmail = null
    this.status = 'disconnected'

    if (clearCredentials && this.identityId) {
      clearStorachaCredentials(this.identityId)
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected' && this.client !== null
  }

  /**
   * Get current status
   */
  getStatus(): ProviderStatus {
    return this.status
  }

  /**
   * Check if credentials exist for the current identity
   */
  hasStoredCredentials(): boolean {
    if (!this.identityId) return false
    return hasStorachaCredentials(this.identityId)
  }

  /**
   * Get stored credentials (for backup purposes)
   */
  getCredentials(): StorachaCredentials | null {
    if (!this.identityId) return null
    return getStorachaCredentials(this.identityId)
  }

  /**
   * Restore from backup credentials (without email verification)
   */
  async restoreFromBackup(credentials: StorachaCredentials): Promise<void> {
    if (!this.identityId) {
      throw new UploadException(UploadErrorCode.CREDENTIAL_ERROR, 'Identity ID not set')
    }

    this.status = 'connecting'

    try {
      await this.restoreFromCredentials(credentials)

      // Save to local storage
      storeStorachaCredentials(this.identityId, credentials)

      this.connectedEmail = credentials.email
      this.status = 'connected'
    } catch (error) {
      this.status = 'error'
      this.client = null
      throw new UploadException(
        UploadErrorCode.CONNECTION_FAILED,
        'Failed to restore from backup',
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Upload an image file
   */
  async uploadImage(file: File, options?: UploadOptions): Promise<UploadResult> {
    if (!this.client || this.status !== 'connected') {
      throw new UploadException(UploadErrorCode.NOT_CONNECTED, 'Not connected to Storacha')
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new UploadException(UploadErrorCode.INVALID_FILE, 'Only image files are supported')
    }

    // Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      throw new UploadException(UploadErrorCode.INVALID_FILE, 'Image must be under 10MB')
    }

    try {
      // Report initial progress
      options?.onProgress?.(0)

      // Upload the file
      const cid = await this.client.uploadFile(file, {
        onShardStored: (meta) => {
          // Approximate progress based on shards
          // This is a rough estimate since we don't know total shards upfront
          console.log('Shard stored:', meta.cid.toString())
          options?.onProgress?.(50)
        }
      })

      // Report completion
      options?.onProgress?.(100)

      const cidString = cid.toString()
      return {
        cid: cidString,
        size: file.size,
        mime: file.type,
        url: `${IPFS_GATEWAY}/${cidString}`
      }
    } catch (error) {
      // Check for quota errors
      const errorMsg = error instanceof Error ? error.message : String(error)
      if (errorMsg.includes('quota') || errorMsg.includes('limit')) {
        throw new UploadException(UploadErrorCode.QUOTA_EXCEEDED, 'Storage quota exceeded')
      }

      throw new UploadException(
        UploadErrorCode.STORAGE_ERROR,
        'Failed to upload file',
        error instanceof Error ? error : undefined
      )
    }
  }
}

// Singleton instance
let storachaProviderInstance: StorachaProvider | null = null

/**
 * Get the Storacha provider singleton
 */
export function getStorachaProvider(): StorachaProvider {
  if (!storachaProviderInstance) {
    storachaProviderInstance = new StorachaProvider()
  }
  return storachaProviderInstance
}
