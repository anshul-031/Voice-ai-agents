# TTS Migration: Deepgram to Sarvam Voice

## Summary

Successfully migrated the Text-to-Speech (TTS) service from Deepgram Aura Luna to Sarvam Voice API with Manisha voice.

## Changes Made

### 1. TTS API Route (`app/api/tts/route.ts`)

- **Updated API endpoint**: Changed from Deepgram API to Sarvam AI TTS endpoint
  - Old: `https://api.deepgram.com/v1/speak?model=aura-luna-en`
  - New: `https://api.sarvam.ai/text-to-speech`
- **Updated authentication**: Changed from `Authorization: Token` to `api-subscription-key` header
- **Updated request body**: Configured Sarvam-specific parameters:
  - `inputs`: Array of text to convert
  - `target_language_code`: 'en-IN'
  - `speaker`: 'manisha'
  - `pitch`: 0
  - `pace`: 1.0
  - `loudness`: 1.5
  - `speech_sample_rate`: 8000
  - `enable_preprocessing`: true
  - `model`: 'bulbul:v1'
- **Updated response handling**: Sarvam returns base64 audio directly in JSON (no need to convert from ArrayBuffer)
- **Updated environment variable**: Changed from `DEEPGRAM_API_KEY` to `SARVAM_API_KEY`

### 2. Configuration Status Route (`app/api/config-status/route.ts`)

- Changed TTS configuration check from `DEEPGRAM_API_KEY` to `SARVAM_API_KEY`
- Updated variable name from `deepgramConfigured` to `sarvamConfigured`

### 3. Voice Agent Model (`models/VoiceAgent.ts`)

- Changed default TTS model from 'Deepgram Aura Luna' to 'Sarvam Voice Manisha'

### 4. Agent Modal Component (`components/AgentModal.tsx`)

- Updated default TTS model state from 'Deepgram Aura Luna' to 'Sarvam Voice Manisha'
- Updated TTS model dropdown options:
  - Old options: Deepgram Aura Luna, Deepgram Aura Asteria, ElevenLabs, Google Text-to-Speech
  - New options: Sarvam Voice Manisha, Sarvam Voice Meera, Sarvam Voice Ravi, Sarvam Voice Arjun

### 5. Page Components

- **`app/page.tsx`**: Updated default modelConfig.ttsModel to 'Sarvam Voice Manisha'
- **`app/agents/[id]/page.tsx`**:
  - Updated default modelConfig.ttsModel to 'Sarvam Voice Manisha'
  - Updated error message to reference Sarvam API key instead of Deepgram

### 6. Voice Agents API Route (`app/api/voice-agents/route.ts`)

- Changed default ttsModel fallback from 'Deepgram Aura Luna' to 'Sarvam Voice Manisha'

### 7. Environment Configuration (`.env.local`)

- Created new `.env.local` file with Sarvam API key
- API Key: `sk_x56l2sqd_MlYB0HhUx9TLSNN13JHiK3Up`

### 8. Documentation (`README.md`)

- Updated Features section to mention Sarvam Voice (Manisha)
- Updated API Routes section to reference Sarvam Voice API
- Updated environment configuration example to use `SARVAM_API_KEY`
- Updated API key sources to include Sarvam AI link

## API Configuration Details

### Sarvam Voice API Endpoint

```
POST https://api.sarvam.ai/text-to-speech
```

### Headers

```
api-subscription-key: YOUR_SARVAM_API_KEY
Content-Type: application/json
```

### Request Body

```json
{
  "inputs": ["text to convert"],
  "target_language_code": "en-IN",
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

## Testing Instructions

1. Ensure the `.env.local` file contains the Sarvam API key
2. Start the development server: `npm run dev`
3. Test the TTS functionality:
   - Start a voice call or text chat
   - Verify that AI responses are spoken using Sarvam Voice (Manisha)
   - Check browser console for any errors

## Available Sarvam Voice Options

The dropdown now includes these Sarvam voice options:

- **Manisha** (Default) - Female voice
- **Meera** - Female voice
- **Ravi** - Male voice
- **Arjun** - Male voice

## Notes

- The Sarvam API returns audio in WAV format (8000 Hz sample rate)
- The API supports English (Indian) with `target_language_code: 'en-IN'`
- Audio preprocessing is enabled for better quality
- The base64 audio data is returned directly in the JSON response (no need for ArrayBuffer conversion)

## Migration Complete ✅

All references to Deepgram TTS have been successfully replaced with Sarvam Voice API integration.
