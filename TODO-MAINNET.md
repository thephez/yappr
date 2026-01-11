# Pre-Mainnet TODO

Tasks to complete before deploying to Dash mainnet.

## Contract Changes

- [ ] **Merge avatar into profile document** - Currently `profile` and `avatar` are separate document types requiring 2 queries per user. The `avatarId` reference field on profile isn't used. Merging would:
  - Reduce queries (1 instead of 21 for 20 posts)
  - Simplify `enrichPostsBatch()` to fetch everything in one batch query
  - Avatar data is only ~50 bytes (seed + style JSON)
  - Remove unused `avatarId` field or repurpose for actual avatar data

- [ ] **Redesign DM contract** - Current design has redundancy and ownership issues:

  **Remove from current design:**
  - `recipientId` from every message (redundant with conversationId)
  - `read` field (recipient can't update sender-owned documents)
  - `directMessage` from main contract (using separate DM contract)

  **New document types:**
  ```
  conversationInvite:
    - recipientId (32 bytes)
    - conversationId (32 bytes)
    - indexes: (recipientId, $createdAt) for inbox
    - Purpose: notify recipient of new conversation

  directMessage:
    - conversationId (32 bytes only, no recipientId)
    - encryptedContent
    - indexes: (conversationId, $createdAt)

  readReceipt:
    - conversationId (32 bytes)
    - lastReadAt (timestamp) or lastReadMessageId
    - indexes:
      - unique ($ownerId, conversationId) - one per user per conversation
      - (conversationId) - so other party can query read status
    - Purpose: user-owned, updatable read tracking
  ```

  **Benefits:**
  - Saves 32 bytes per message (no recipientId after first)
  - Proper read receipts (each user owns their own)
  - Clean separation: inbox notifications vs messages vs read status

- [ ] **Remove `notification` from main contract** - Not implemented, and has the same `read` field ownership problem. Notifications may need a different architecture (recipient-owned documents created by a service, or client-side tracking).

- [ ] **Remove unused document types** - Consider removing until actually needed:
  - `mute` - removing entirely, just use `block` instead
  - `list` / `listMember` - no service/UI

- [ ] **Remove redundant `ownerBlocks` index** - The `ownerBlocks` index exists to support `orderBy: $createdAt` but actual usage doesn't need chronological ordering. The `ownerAndBlocked` index can serve `$ownerId` queries alone since it's the first field.

- [ ] **Remove unused profile fields** - Not implemented in UI:
  - `avatarId` (if merging avatar into profile)
  - `website`
  - `location`
  - `bannerUrl`

## Performance

- [ ] Review batch query patterns for efficiency
- [ ] Audit all N+1 query situations

## Security

- [ ] Audit private key handling
- [ ] Review all state transition validations
