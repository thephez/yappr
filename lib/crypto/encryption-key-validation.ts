import { parsePrivateKey } from './wif'

export type EncryptionKeyValidationErrorType =
  | 'INVALID_KEY_FORMAT'
  | 'IDENTITY_NOT_FOUND'
  | 'NO_ENCRYPTION_KEY'
  | 'KEY_MISMATCH'

export interface EncryptionKeyValidationResult {
  isValid: boolean
  privateKey?: Uint8Array
  publicKey?: Uint8Array
  keyId?: number
  error?: string
  errorType?: EncryptionKeyValidationErrorType
  noKeyOnIdentity?: boolean
}

/**
 * Validate that the provided key matches the encryption key (purpose=1, type=0)
 * on the user's identity.
 *
 * This prevents users from accidentally using auth/high keys for encryption operations.
 *
 * @param keyInput - The key in WIF or hex format
 * @param identityId - The user's identity ID
 * @returns Validation result with the parsed key if valid
 */
export async function validateEncryptionKey(
  keyInput: string,
  identityId: string
): Promise<EncryptionKeyValidationResult> {
  // Step 1: Parse the key (WIF or hex)
  let keyBytes: Uint8Array
  try {
    const parsed = parsePrivateKey(keyInput.trim())
    keyBytes = parsed.privateKey
  } catch (parseError) {
    return {
      isValid: false,
      error: parseError instanceof Error ? parseError.message : 'Invalid key format',
      errorType: 'INVALID_KEY_FORMAT',
    }
  }

  // Step 2: Derive public key from private key
  const { privateFeedCryptoService } = await import('@/lib/services')
  let derivedPubKey: Uint8Array
  try {
    derivedPubKey = privateFeedCryptoService.getPublicKey(keyBytes)
  } catch {
    return {
      isValid: false,
      error: 'Invalid private key format',
      errorType: 'INVALID_KEY_FORMAT',
    }
  }

  // Step 3: Fetch user's identity
  const { identityService } = await import('@/lib/services/identity-service')
  const identityData = await identityService.getIdentity(identityId)
  if (!identityData) {
    return {
      isValid: false,
      error: 'Could not fetch identity data',
      errorType: 'IDENTITY_NOT_FOUND',
    }
  }

  // Step 4: Find encryption key on identity (purpose = 1 for ENCRYPTION, type = 0 for ECDSA_SECP256K1)
  const encryptionPubKey = identityData.publicKeys.find(
    (key) => key.purpose === 1 && key.type === 0
  )

  if (!encryptionPubKey) {
    return {
      isValid: false,
      error: 'No encryption key found on your identity.',
      errorType: 'NO_ENCRYPTION_KEY',
      noKeyOnIdentity: true,
    }
  }

  // Step 5: Parse on-chain public key data (can be Uint8Array, hex string, or base64)
  let onChainPubKeyBytes: Uint8Array | null = null
  if (encryptionPubKey.data) {
    if (encryptionPubKey.data instanceof Uint8Array) {
      onChainPubKeyBytes = encryptionPubKey.data
    } else if (typeof encryptionPubKey.data === 'string') {
      // Could be hex or base64
      if (/^[0-9a-fA-F]+$/.test(encryptionPubKey.data)) {
        // Hex
        onChainPubKeyBytes = new Uint8Array(encryptionPubKey.data.length / 2)
        for (let i = 0; i < onChainPubKeyBytes.length; i++) {
          onChainPubKeyBytes[i] = parseInt(encryptionPubKey.data.substr(i * 2, 2), 16)
        }
      } else {
        // Assume base64
        const binary = atob(encryptionPubKey.data)
        onChainPubKeyBytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          onChainPubKeyBytes[i] = binary.charCodeAt(i)
        }
      }
    }
  }

  // Step 6: Compare derived public key with on-chain public key
  if (onChainPubKeyBytes) {
    const matches =
      derivedPubKey.length === onChainPubKeyBytes.length &&
      derivedPubKey.every((b, i) => b === onChainPubKeyBytes[i])

    if (!matches) {
      return {
        isValid: false,
        error: 'This key does not match the encryption key on your identity',
        errorType: 'KEY_MISMATCH',
      }
    }
  }

  // Key is valid
  return {
    isValid: true,
    privateKey: keyBytes,
    publicKey: derivedPubKey,
    keyId: encryptionPubKey.id,
  }
}
