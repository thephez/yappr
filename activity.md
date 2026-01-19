# Activity

## 2026-01-18: Data Contract Update for Private Feeds

**Task:** Update data contract with private feed document types and post modifications

**Changes made:**
1. Updated `contracts/yappr-social-contract-actual.json` with 4 new document types:
   - `followRequest` - For requesting access to a private feed (with unique index on targetId + $ownerId)
   - `privateFeedGrant` - For approved private followers (with unique indices on owner+recipient and owner+leafIndex)
   - `privateFeedRekey` - For revocation operations, marked as `canBeDeleted: false` and `mutable: false` (CRITICAL for security)
   - `privateFeedState` - For feed initialization state, marked as `canBeDeleted: false` and `mutable: false`

2. Modified `post` document type with new optional fields for private posts:
   - `encryptedContent` (bytes, max 1024) - AEAD ciphertext for private content
   - `epoch` (uint32) - Epoch number for key derivation
   - `nonce` (bytes[24]) - XChaCha20-Poly1305 nonce

3. Extended `notification` type enum with three new values:
   - `privateFeedRequest`
   - `privateFeedApproved`
   - `privateFeedRevoked`

4. Updated `lib/constants.ts`:
   - Changed `YAPPR_CONTRACT_ID` to new contract: `FNDUsTkqMQ1Wv4qhvg25VqHRnLLfCwwvw1YFMUL9iQ7e`
   - Added new document type constants: `FOLLOW_REQUEST`, `PRIVATE_FEED_GRANT`, `PRIVATE_FEED_REKEY`, `PRIVATE_FEED_STATE`

**Screenshot:** `screenshots/contract-update-private-feeds.png`
