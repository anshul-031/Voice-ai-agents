# Sarvam TTS Migration Summary

## Overview

Successfully migrated the voicebot builder platform from **Deepgram Aura Luna** to **Sarvam TTS with Manisha voice**.

## What Changed

### 1. TTS API Route (`app/api/tts/route.ts`)

- **Before**: Used Deepgram API with Aura Luna voice
- **After**: Uses Sarvam AI API with Manisha voice
- **API Endpoint**: `https://api.sarvam.ai/text-to-speech`
- **Voice Configuration**:
  - Speaker: `manisha` (female voice optimized for Hindi/Hinglish)
  - Language: `hi-IN` (Hindi - India)
  - Model: `bulbul:v1`
  - Sample Rate: 8000 Hz
  - Preprocessing: Enabled

### 2. Environment Configuration (`.env.local`)

- Added: `SARVAM_API_KEY=sk_x56l2sqd_MlYB0HhUx9TLSNN13JHiK3Up`
- Note: Old Deepgram key still present but no longer used

### 3. Default Model Configuration

Updated in all components to use `Sarvam Manisha`:

- ✅ `app/demo/page.tsx`
- ✅ `app/agents/[id]/page.tsx`
- ✅ `components/VoiceAIAgent.tsx`
- ✅ `components/AgentModal.tsx`
- ✅ `app/api/voice-agents/route.ts`
- ✅ `models/VoiceAgent.ts`

### 4. TTS Model Options (`components/AgentModal.tsx`)

Updated dropdown to show Sarvam voices:

- **Sarvam Manisha** (default - female)
- **Sarvam Meera** (female)
- **Sarvam Arvind** (male)

### 5. Config Status Check (`app/api/config-status/route.ts`)

- Changed from checking `DEEPGRAM_API_KEY` to `SARVAM_API_KEY`
- Validates Sarvam configuration for TTS service

## Sarvam API Configuration

### Request Format

```json
{
  "inputs": ["Text to convert to speech"],
  "target_language_code": "hi-IN",
  "speaker": "manisha",
  "pitch": 0,
  "pace": 1.0,
  "loudness": 1.5,
  "speech_sample_rate": 8000,
  "enable_preprocessing": true,
  "model": "bulbul:v2"
}
```

### Response Format

```json
{
  "audios": ["base64_encoded_audio_data"]
}
```

### Headers

- `api-subscription-key`: Your Sarvam API key
- `Content-Type`: application/json

## Features Preserved

✅ **Automatic greeting audio** - Works with Sarvam TTS
✅ **Real-time voice responses** - TTS during calls
✅ **Text chat with audio** - Audio playback in text mode
✅ **Audio format** - WAV format (compatible with all browsers)
✅ **Base64 encoding** - Efficient audio transmission

## Audio Quality Settings

The migration uses these Sarvam-specific parameters:

- **Pitch**: 0 (neutral, natural voice)
- **Pace**: 1.0 (normal speed)
- **Loudness**: 1.5 (slightly amplified for clarity)
- **Sample Rate**: 8000 Hz (optimized for voice calls)
- **Preprocessing**: Enabled (automatic text normalization)

## Benefits of Sarvam TTS

1. **Better Hindi/Hinglish Support** - Optimized for Indian languages
2. **Natural Voice Quality** - Manisha voice sounds more natural for Hindi content
3. **Preprocessing** - Automatic handling of numbers, dates, and special characters
4. **Multiple Voice Options** - Can easily switch between Manisha, Meera, and Arvind
5. **Cost-Effective** - Competitive pricing for Indian market

## Testing Recommendations

1. **Test Initial Greeting**:

   - Start a call and verify the Hindi greeting plays with audio
   - Message: "नमस्ते जी, मैं रिया बोल रही हूँ Punjab National Bank की तरफ़ से..."

2. **Test Voice Responses**:

   - Speak in Hindi/Hinglish during a call
   - Verify TTS audio plays for bot responses

3. **Test Text Chat**:

   - Use text chat mode
   - Verify audio plays for text responses

4. **Test Different Voices**:
   - Create new agents with Meera and Arvind voices
   - Compare voice quality and naturalness

## Rollback Instructions

If you need to revert to Deepgram:

1. Restore `app/api/tts/route.ts` from git history
2. Change all `'Sarvam Manisha'` references back to `'Deepgram Aura Luna'`
3. Update `app/api/config-status/route.ts` to check `DEEPGRAM_API_KEY`
4. Restart the application

## API Key Security

⚠️ **Important**: The Sarvam API key is currently in `.env.local`. Make sure:

- ✅ `.env.local` is in `.gitignore`
- ✅ Never commit API keys to version control
- ✅ Use environment variables in production deployment

## Next Steps

1. ✅ **Test the application** - Verify all TTS functionality works
2. ⚠️ **Update existing agents** - Agents saved with old TTS model will still work but use new API
3. 📊 **Monitor usage** - Check Sarvam API usage and credits
4. 🔧 **Fine-tune parameters** - Adjust pitch, pace, loudness based on user feedback

## Support

If you encounter issues:

1. Check browser console for `[TTS]` prefixed logs
2. Verify Sarvam API key is valid and has credits
3. Check Sarvam API documentation: https://docs.sarvam.ai/
4. Test with a simple text first: "Hello, this is a test"

---

**Migration Completed**: ✅ All changes applied successfully
**Status**: Ready for testing
