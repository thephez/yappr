# Learnings

## 2026-01-18: Contract Schema Design for Private Feeds

**Key observations:**
1. The `canBeDeleted: false` property in Dash Platform contracts is CRITICAL for the LKH (Logical Key Hierarchy) rekey mechanism. The `privateFeedRekey` documents must be immutable because node key versions are derived from the complete historical sequence of `revokedLeaf` values. Deleting any rekey document would break key derivation for all followers.

2. Two unique indices on `privateFeedGrant` (`ownerAndRecipient` and `ownerAndLeaf`) are needed to prevent both duplicate grants to the same recipient AND the critical security issue of assigning the same leaf index to multiple recipients (which would cause them to share identical path keys).

3. Byte arrays in Dash Platform contracts use `type: array` with `byteArray: true`, not a separate bytes type. The `maxItems`/`minItems` properties specify the exact byte count constraints.

4. For the notification type enum, used camelCase (`privateFeedRequest`) rather than snake_case to match the existing enum values (`like`, `repost`, `follow`, etc.)

**No issues encountered** - the contract registration was straightforward and the schema matched the SPEC requirements.

## 2026-01-18: PrivateFeedCryptoService Implementation

**Key observations:**

1. **@noble package import paths changed in v2.x**: The newer versions of `@noble/ciphers` and `@noble/hashes` require `.js` extension in import paths (e.g., `@noble/ciphers/chacha.js` not `@noble/ciphers/chacha`). Additionally, `sha256` moved from `@noble/hashes/sha256` to `@noble/hashes/sha2.js`.

2. **HKDF API requires Uint8Array for salt**: The HKDF function in `@noble/hashes` requires `Uint8Array | undefined` for the salt parameter, not strings. Using `new Uint8Array(0)` as an empty salt constant resolved this.

3. **secp256k1 ECDH returns full point**: When using `secp256k1.getSharedSecret()`, the returned value includes the point prefix byte. For ECIES, we need only the x-coordinate, so we slice `sharedPoint.slice(1, 33)` to get the 32-byte x-coordinate for hashing.

4. **XChaCha20-Poly1305 cipher is created per-operation**: The `xchacha20poly1305()` function from `@noble/ciphers` returns a cipher object with `.encrypt()` and `.decrypt()` methods. The cipher must be constructed with the AAD at creation time, not passed to encrypt/decrypt.

5. **Lint prefers assignment in loop condition over non-null assertion**: Instead of `while (stack.length > 0) { const n = stack.pop()! }`, TypeScript/ESLint prefers `while ((n = stack.pop()) !== undefined)` to avoid non-null assertions.

**No blockers encountered** - the service implementation follows the SPEC precisely and all build/lint checks pass.

## 2026-01-18: PrivateFeedKeyStore Implementation

**Key observations:**

1. **Base64 encoding for Uint8Array in localStorage**: localStorage only stores strings, so Uint8Array (keys, CEKs) must be encoded. Used manual base64 encoding with `btoa`/`atob` and binary string conversion rather than adding a dependency like `base64-js`. This is sufficient for the key sizes involved (32-byte keys, path of ~11 keys).

2. **SSR safety is critical**: Next.js renders components on the server where `localStorage` is undefined. All storage access must be wrapped with `typeof window === 'undefined'` checks. Created a reusable `isStorageAvailable()` helper that also tests storage access works (handles private browsing mode).

3. **Available leaves is a derived cache, not authoritative**: Per SPEC §6.3, the authoritative source of leaf assignments is the set of active `PrivateFeedGrant` documents. The local `availableLeaves` cache improves performance but must be re-derived from grants on recovery. The platform's unique index on `($ownerId, leafIndex)` prevents collisions even with stale cache.

4. **Consistent key prefix pattern**: Used `yappr:pf:` prefix as specified in PRD §3.4. Individual keys within this namespace use descriptive names like `feed_seed`, `path_keys:${ownerId}`, `cached_cek:${ownerId}` to keep storage organized and debuggable.

5. **Follower keys are per-feed-owner**: Unlike owner keys (single set), follower keys are stored per followed feed using the ownerId as part of the key. This allows following multiple private feeds while keeping keys separate.

**No issues encountered** - straightforward implementation following existing patterns from `secure-storage.ts`.

