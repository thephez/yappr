'use client'

/**
 * Password-encrypted storage for persistent credential storage
 * Uses PBKDF2 for key derivation and AES-GCM for encryption
 */

const STORAGE_KEY = 'yappr_encrypted_credentials'
const PBKDF2_ITERATIONS = 100000

interface EncryptedCredential {
  identityId: string
  encryptedPrivateKey: string
  iv: string
  salt: string
  createdAt: number
  version: 1
}

interface StoredCredentials {
  credentials: EncryptedCredential[]
  lastUsedIdentityId: string | null
}

/**
 * Get stored credentials from localStorage
 */
function getStoredCredentials(): StoredCredentials {
  if (typeof window === 'undefined') {
    return { credentials: [], lastUsedIdentityId: null }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return { credentials: [], lastUsedIdentityId: null }
    }
    return JSON.parse(stored)
  } catch {
    return { credentials: [], lastUsedIdentityId: null }
  }
}

/**
 * Save credentials to localStorage
 */
function saveStoredCredentials(data: StoredCredentials): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Check if any stored credentials exist
 */
export function hasAnyStoredCredentials(): boolean {
  const data = getStoredCredentials()
  return data.credentials.length > 0
}

/**
 * Check if stored credential exists for an identity
 */
export function hasStoredCredential(identityId: string): boolean {
  const data = getStoredCredentials()
  return data.credentials.some(c => c.identityId === identityId)
}

/**
 * Get the last used identity ID for pre-filling login form
 */
export function getLastUsedIdentityId(): string | null {
  const data = getStoredCredentials()
  return data.lastUsedIdentityId
}

/**
 * Store private key encrypted with password
 */
export async function storeEncryptedCredential(
  identityId: string,
  privateKey: string,
  password: string
): Promise<boolean> {
  try {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Derive key from password
    const key = await deriveKeyFromPassword(password, salt)

    // Encrypt the private key
    const encrypted = await encryptWithKey(privateKey, key, iv)

    // Create credential entry
    const credential: EncryptedCredential = {
      identityId,
      encryptedPrivateKey: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv),
      salt: arrayBufferToBase64(salt),
      createdAt: Date.now(),
      version: 1
    }

    // Update storage
    const data = getStoredCredentials()

    // Remove existing credential for this identity if any
    data.credentials = data.credentials.filter(c => c.identityId !== identityId)

    // Add new credential
    data.credentials.push(credential)
    data.lastUsedIdentityId = identityId

    saveStoredCredentials(data)

    return true
  } catch (error) {
    console.error('Failed to store encrypted credential:', error)
    return false
  }
}

/**
 * Retrieve and decrypt private key using password
 * Returns private key on success, null if not found
 * Throws error if password is wrong
 */
export async function retrieveDecryptedCredential(
  identityId: string,
  password: string
): Promise<string | null> {
  const data = getStoredCredentials()
  const credential = data.credentials.find(c => c.identityId === identityId)

  if (!credential) {
    return null
  }

  try {
    // Derive key from password using stored salt
    const salt = base64ToArrayBuffer(credential.salt)
    const key = await deriveKeyFromPassword(password, new Uint8Array(salt))

    // Decrypt the private key
    const iv = base64ToArrayBuffer(credential.iv)
    const ciphertext = base64ToArrayBuffer(credential.encryptedPrivateKey)

    const privateKey = await decryptWithKey(ciphertext, key, new Uint8Array(iv))

    // Update last used
    data.lastUsedIdentityId = identityId
    saveStoredCredentials(data)

    return privateKey
  } catch (error) {
    // Decryption failed - likely wrong password
    throw new Error('Invalid password')
  }
}

/**
 * Remove stored credential for an identity
 */
export function removeStoredCredential(identityId: string): void {
  const data = getStoredCredentials()
  data.credentials = data.credentials.filter(c => c.identityId !== identityId)

  // Update lastUsedIdentityId if needed
  if (data.lastUsedIdentityId === identityId) {
    data.lastUsedIdentityId = data.credentials.length > 0
      ? data.credentials[data.credentials.length - 1].identityId
      : null
  }

  saveStoredCredentials(data)
}

/**
 * Clear all stored credentials
 */
export function clearAllStoredCredentials(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Verify password is correct for stored credential
 */
export async function verifyPassword(
  identityId: string,
  password: string
): Promise<boolean> {
  try {
    const result = await retrieveDecryptedCredential(identityId, password)
    return result !== null
  } catch {
    return false
  }
}

/**
 * Change password for stored credential
 */
export async function changePassword(
  identityId: string,
  oldPassword: string,
  newPassword: string
): Promise<boolean> {
  try {
    // Decrypt with old password
    const privateKey = await retrieveDecryptedCredential(identityId, oldPassword)
    if (!privateKey) {
      return false
    }

    // Re-encrypt with new password
    return await storeEncryptedCredential(identityId, privateKey, newPassword)
  } catch {
    return false
  }
}

// --- Internal cryptographic functions ---

/**
 * Derive AES-256 key from password using PBKDF2
 */
async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  // Derive AES key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt data using AES-GCM
 */
async function encryptWithKey(
  data: string,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  return crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  )
}

/**
 * Decrypt data using AES-GCM
 */
async function decryptWithKey(
  ciphertext: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

/**
 * Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
