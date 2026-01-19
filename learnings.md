# Learnings

## 2026-01-18: Contract Schema Design for Private Feeds

**Key observations:**
1. The `canBeDeleted: false` property in Dash Platform contracts is CRITICAL for the LKH (Logical Key Hierarchy) rekey mechanism. The `privateFeedRekey` documents must be immutable because node key versions are derived from the complete historical sequence of `revokedLeaf` values. Deleting any rekey document would break key derivation for all followers.

2. Two unique indices on `privateFeedGrant` (`ownerAndRecipient` and `ownerAndLeaf`) are needed to prevent both duplicate grants to the same recipient AND the critical security issue of assigning the same leaf index to multiple recipients (which would cause them to share identical path keys).

3. Byte arrays in Dash Platform contracts use `type: array` with `byteArray: true`, not a separate bytes type. The `maxItems`/`minItems` properties specify the exact byte count constraints.

4. For the notification type enum, used camelCase (`privateFeedRequest`) rather than snake_case to match the existing enum values (`like`, `repost`, `follow`, etc.)

**No issues encountered** - the contract registration was straightforward and the schema matched the SPEC requirements.

