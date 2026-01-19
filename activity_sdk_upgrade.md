# SDK Upgrade Activity Log

## Purpose
Track progress on upgrading @dashevo/evo-sdk from dev.9 to dev.11.

---

<!-- Add entries below as work progresses -->

## 2026-01-19: Phase 1 Complete - Core Infrastructure

### Changes Made

1. **Updated package.json**: Changed `@dashevo/evo-sdk` from `^3.0.0-dev.9` to `^3.0.0-dev.11`

2. **Created `lib/services/signer-service.ts`**: New service for managing IdentitySigner objects
   - `createSigner(privateKeyWif, network)`: Creates IdentitySigner from WIF
   - `createSignerFromHex(privateKeyHex, network)`: Creates IdentitySigner from hex
   - `createIdentityPublicKey(keyData)`: Creates WASM IdentityPublicKey object
   - `getSigningKeyData(publicKeys, securityLevel, keyId)`: Finds appropriate signing key
   - `createSignerAndKey(privateKeyWif, keyData, network)`: Convenience method for both
   - Exports `KeyPurpose`, `SecurityLevel`, `KeyType` constants

3. **Created `lib/services/document-builder-service.ts`**: New service for building WASM Document objects
   - `buildDocumentForCreate(...)`: Builds Document for creation (auto-generates ID)
   - `buildDocumentForReplace(...)`: Builds Document for updates (requires revision)
   - `buildDocumentForDelete(...)`: Builds identifier object for deletion
   - `normalizeDocumentResponse(document)`: Normalizes SDK responses
   - `getDocumentId(document)`: Extracts document ID from WASM object

4. **Updated `lib/services/index.ts`**: Exported new services

### Build Status

- **New services compile successfully** - no lint errors
- **Build fails** due to old API usage in:
  - `state-transition-service.ts` (Phase 2)
  - `dpns-service.ts` (Phase 4)
  - `identity-service.ts` (Phase 3)

This is expected - the old API (`privateKeyWif`, `entropyHex`, etc.) no longer exists in dev.11.

### Testing

Cannot run dev server until Phases 2-4 update the consuming code. Infrastructure services are ready for use.

### Next Steps

Phase 2: Refactor `state-transition-service.ts` to use new typed APIs with:
- `signerService` for creating signers
- `documentBuilderService` for building documents
