# Test Fixes & API Corrections Summary

## Issues Fixed

### 1. **Sarvam API Model Version Error** ✅

**Problem**: The TTS API was using `bulbul:v1` which is deprecated.

**Error Message**:

```
Validation Error(s): model: Input should be 'bulbul:v2' or 'bulbul:v3-beta'
```

**Fix**: Updated `app/api/tts/route.ts` to use `model: 'bulbul:v2'`

---

### 2. **Test Files Still Referenced Deepgram** ✅

**Problem**: All test files were still checking for `DEEPGRAM_API_KEY` and expecting Deepgram API responses.

**Files Updated**:

- `__tests__/api/tts.test.ts` - Complete rewrite for Sarvam API
  - Changed `DEEPGRAM_API_KEY` → `SARVAM_API_KEY`
  - Updated mock responses from `arrayBuffer` to `json` with `audios` array
  - Updated API endpoint verification to `https://api.sarvam.ai/text-to-speech`
  - Updated authentication header check to `api-subscription-key`
- `__tests__/api/config-status.test.ts`
  - Changed all `DEEPGRAM_API_KEY` → `SARVAM_API_KEY`
  - Updated test case name from "missing Deepgram key" to "missing Sarvam key"
- `__tests__/api/tts.status-mapping.test.ts`
  - Changed `DEEPGRAM_API_KEY` → `SARVAM_API_KEY`
- `__tests__/api/tts.extra.test.ts`
  - Changed `DEEPGRAM_API_KEY` → `SARVAM_API_KEY`
  - Updated mock response format
- `__tests__/api/tts.invalid-key-catch.test.ts`
  - Changed `DEEPGRAM_API_KEY` → `SARVAM_API_KEY`

---

### 3. **Component Tests Had Wrong Default TTS Model** ✅

**Problem**: Tests expected `'Deepgram Aura Luna'` but code now uses `'Sarvam Voice Manisha'`

**Files Updated**:

- `__tests__/components/AgentModal.test.tsx`
  - Updated all test expectations to use `'Sarvam Voice Manisha'`
- `__tests__/api/voice-agents-id.test.ts`
  - Updated default ttsModel expectation
- `__tests__/api/voice-agents.test.ts`
  - Updated TTS model references

---

## Key Changes Made

### API Response Format Change

**Before (Deepgram)**:

```javascript
const mockResponse = {
  ok: true,
  arrayBuffer: async () => new ArrayBuffer(1024),
};
const audioBuffer = await response.arrayBuffer();
const base64Audio = Buffer.from(audioBuffer).toString("base64");
```

**After (Sarvam)**:

```javascript
const mockResponse = {
  ok: true,
  json: async () => ({ audios: ["base64AudioDataHere"] }),
};
const data = await response.json();
const base64Audio = data.audios[0];
```

### Authentication Header Change

**Before (Deepgram)**:

```javascript
headers: {
    'Authorization': `Token ${apiKey}`,
    'Content-Type': 'application/json'
}
```

**After (Sarvam)**:

```javascript
headers: {
    'api-subscription-key': apiKey,
    'Content-Type': 'application/json'
}
```

### API Endpoint Change

**Before**: `https://api.deepgram.com/v1/speak?model=aura-luna-en`

**After**: `https://api.sarvam.ai/text-to-speech`

---

## Documentation Updates

### Updated Files:

1. ✅ `TTS_MIGRATION_SUMMARY.md` - Changed model from v1 to v2
2. ✅ `SARVAM_TTS_GUIDE.md` - Updated model version
3. ✅ `MIGRATION_COMPLETE.md` - Updated model version

---

## Test Status After Fixes

All test files have been updated to:

- Use `SARVAM_API_KEY` environment variable
- Expect Sarvam API response format (JSON with `audios` array)
- Use correct default TTS model (`'Sarvam Voice Manisha'`)
- Verify Sarvam API endpoint and headers

---

## How to Verify

### Run Tests

```bash
npm test
```

### Start Dev Server

```bash
npm run dev
```

### Test TTS Functionality

1. Open http://localhost:3000
2. Click microphone or message button
3. Send a message
4. Verify audio plays with Sarvam Voice (Manisha)

---

## Environment Variable Checklist

Make sure your `.env.local` contains:

```bash
ASSEMBLYAI_API_KEY=your_assemblyai_key
GEMINI_API_KEY=your_gemini_key
SARVAM_API_KEY=sk_x56l2sqd_MlYB0HhUx9TLSNN13JHiK3Up
```

---

## ✅ All Issues Resolved

1. ✅ API model version corrected (v1 → v2)
2. ✅ All test files updated for Sarvam API
3. ✅ Default TTS model updated in all tests
4. ✅ Documentation updated with correct model version
5. ✅ Mock responses use correct Sarvam format

**Status**: Ready for testing! 🎉
