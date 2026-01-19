# Bug Reports

## Active Bugs

### BUG-004: Private posts without teaser fail with JsonSchemaError

**Status:** OPEN
**Severity:** HIGH (P0 - Blocks core feature)
**Date Reported:** 2026-01-19
**Test:** E2E Test 2.2 - Create Private Post - No Teaser

#### Summary
Creating a private post without a teaser (visibility="private") fails with a JsonSchemaError because the implementation sets `content` to an empty string, but the data contract requires `content` to have a minimum length of 1 character.

#### Error Message
```
WasmSdkError details: {kind: 17, code: -1, message: Failed to broadcast transition: Protocol error: JsonSchemaError: "" is shorter than 1 character, path: /content}
```

#### Root Cause
In `lib/services/private-feed-service.ts`, the `createPrivatePost()` method (line 407) sets:
```typescript
content: teaser || '', // Teaser or empty string for private-only posts
```

When no teaser is provided (for "Private" visibility without teaser), `content` becomes an empty string `''`.

However, the data contract `contracts/yappr-social-contract-actual.json` defines:
```json
"content": {
  "type": "string",
  "position": 0,
  "maxLength": 500,
  "minLength": 1,  // <-- This constraint rejects empty strings
  "description": "Post content (public content or teaser for private posts)"
}
```

The contract requires `content` to be at least 1 character, so empty string fails validation.

#### Affected Code
- **File:** `lib/services/private-feed-service.ts`
- **Function:** `createPrivatePost()` (line 406-411)
- **Also affects:** `createInheritedPrivateReply()` (line 507-508) - same issue with `content: ''`

#### Impact
- Users cannot create private posts using "Private" visibility (no teaser)
- E2E Test 2.2 fails
- This blocks a core feature of the private feeds functionality

#### Possible Fixes
1. **Option A - Use placeholder text:** Set `content` to a placeholder like `"🔒"` or `"[Private]"` for private posts without teaser
2. **Option B - Update contract:** Change the contract to allow `minLength: 0` for content (requires contract migration)
3. **Option C - Always require teaser:** Remove "Private" (no teaser) visibility option, only allow "Private with Teaser"

**Recommended:** Option A - Use a minimal placeholder. This is the least disruptive fix and maintains backwards compatibility with the existing contract.

#### Screenshots
- `screenshots/e2e-test2.2-private-post-compose.png` - Compose modal ready to post (before error)

#### Reproduction Steps
1. Log in as a user with private feed enabled
2. Open compose modal
3. Select "Private" visibility (not "Private with Teaser")
4. Enter any content
5. Click Post
6. **Result:** Error appears, post fails to create

## Resolved Bugs

### BUG-003: sdk.identities.update() fails with WasmSdkError (RESOLVED)

**Resolution:** SDK upgraded from dev.9 to dev.11. The issue was confirmed to be a bug in the older SDK version. Identity update operations now work correctly with MASTER keys.

**Date Resolved:** 2026-01-19
