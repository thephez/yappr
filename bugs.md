# Bug Reports

## BUG-003: sdk.identities.update() fails with WasmSdkError even with CRITICAL key

**Date Reported:** 2026-01-19
**Severity:** HIGH (Blocking)
**Status:** Open
**Affects:** E2E Test 1.1 - Enable Private Feed Happy Path

### Summary
After fixing BUG-002 (security level validation), the `sdk.identities.update()` call still fails with a generic `WasmSdkError`. The CRITICAL key validation passes successfully, but the SDK operation itself fails.

### Steps to Reproduce
1. Log in with an identity
2. Navigate to Settings > Private Feed
3. Click "Add Encryption Key to Identity"
4. Generate and save encryption key
5. Enter CRITICAL key (cSDRgCCkGBwnbtDSXJ2aQWGvfdcZ1ay1Tmh3DVWFt85FHepsuUHV for testing-identity-1)
6. Click "Add Encryption Key"

### Expected Behavior
The encryption key should be added to the identity on Dash Platform.

### Actual Behavior
An error dialog appears showing "Unknown error". The console shows:
```
Signing key validated: keyId=2, securityLevel=1   ← BUG-002 FIXED
Adding encryption key (id=4) to identity 9qRC7aPC3xTFwGJvMpwHfycU4SA49mx4Fc3Bh6jCT8v2...
Calling sdk.identities.update with privateKeyWif length: 52
Error adding encryption key: WasmSdkError   ← NEW ERROR
```

### Technical Details
- Security level validation passes (keyId=2, securityLevel=1 = CRITICAL)
- Error occurs inside `sdk.identities.update()` call
- Error type: `WasmSdkError` (generic, no additional details)

### Possible Root Causes
1. **Network/DAPI issues** - The SDK may be failing to connect to DAPI nodes
2. **SDK version incompatibility** - The SDK version may not be compatible with current platform state
3. **State transition parameters** - The `IdentityPublicKeyInCreation` object may be missing required fields
4. **Platform validation** - The platform may be rejecting the state transition for other reasons

### Investigation Steps
1. Check if `sdk.identities.update()` works with other operations (not just adding keys)
2. Examine the SDK source code for better error details
3. Try updating the SDK version
4. Check platform logs or state transition errors via DAPI

### Related Files
- `lib/services/identity-service.ts` - `addEncryptionKey()` method
- `components/auth/add-encryption-key-modal.tsx` - UI component
- `@dashevo/evo-sdk` - External SDK

### Screenshots
- `screenshots/bug002-fix-validation-passed.png` - Shows error after validation passed

### Notes
- BUG-002 has been fixed - CRITICAL key validation is working correctly
- This is a deeper SDK/platform issue that needs further investigation
- May require examining the raw state transition or DAPI responses
