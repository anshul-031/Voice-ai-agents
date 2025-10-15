# Sarvam TTS Model Version Fix

## Issue

The initial Sarvam TTS integration was using an outdated model version (`bulbul:v1`), which caused all TTS requests to fail with a 400 error:

```
Validation Error(s):
- model: Input should be 'bulbul:v2' or 'bulbul:v3-beta'
```

## Fix Applied

Updated the TTS API route to use `bulbul:v2` (the stable, recommended version).

**File Changed**: `app/api/tts/route.ts`

- Changed: `model: 'bulbul:v1'` → `model: 'bulbul:v2'`

## Available Sarvam TTS Models

| Model            | Status        | Description                      |
| ---------------- | ------------- | -------------------------------- |
| `bulbul:v2`      | ✅ **Stable** | Recommended for production use   |
| `bulbul:v3-beta` | ⚠️ Beta       | Latest features, may be unstable |
| `bulbul:v1`      | ❌ Deprecated | No longer supported              |

## Recommendation

**Use `bulbul:v2`** for:

- Production environments
- Stable, reliable TTS generation
- Best balance of quality and performance

**Consider `bulbul:v3-beta`** if you want:

- Latest voice improvements
- Cutting-edge features
- Can tolerate occasional instability

## Testing

After this fix, you should now hear audio when:

1. Starting a call (initial greeting)
2. Bot responds during voice call
3. Bot responds in text chat mode

## If You Want to Try Beta Version

To use the beta model, change in `app/api/tts/route.ts`:

```typescript
model: 'bulbul:v3-beta',
```

---

**Status**: ✅ Fixed - Audio should now work correctly
**Date**: October 13, 2025
