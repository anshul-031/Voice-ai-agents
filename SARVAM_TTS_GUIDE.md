# Sarvam Voice TTS - Quick Reference

## Environment Setup

Add this to your `.env.local` file:

```bash
SARVAM_API_KEY=sk_x56l2sqd_MlYB0HhUx9TLSNN13JHiK3Up
```

## API Usage

### Endpoint

```
POST https://api.sarvam.ai/text-to-speech
```

### Request Example

```javascript
const response = await fetch("https://api.sarvam.ai/text-to-speech", {
  method: "POST",
  headers: {
    "api-subscription-key": process.env.SARVAM_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    inputs: ["Hello, this is a test message."],
    target_language_code: "en-IN",
    speaker: "manisha",
    pitch: 0,
    pace: 1.0,
    loudness: 1.5,
    speech_sample_rate: 8000,
    enable_preprocessing: true,
    model: "bulbul:v2",
  }),
});

const data = await response.json();
const base64Audio = data.audios[0];
```

## Available Parameters

### Required

- **inputs**: Array of strings to convert to speech
- **target_language_code**: Language code (e.g., 'en-IN' for Indian English)
- **speaker**: Voice name ('manisha', 'meera', 'ravi', 'arjun')

### Optional

- **pitch**: Voice pitch adjustment (-20 to 20, default: 0)
- **pace**: Speech speed (0.5 to 2.0, default: 1.0)
- **loudness**: Audio volume (0.5 to 2.0, default: 1.5)
- **speech_sample_rate**: Audio quality (8000 or 16000 Hz)
- **enable_preprocessing**: Text normalization (true/false)
- **model**: TTS model version ('bulbul:v2')

## Voice Options

- **manisha** - Female voice (default)
- **meera** - Female voice
- **ravi** - Male voice
- **arjun** - Male voice

## Response Format

```json
{
  "audios": ["base64_encoded_audio_string"]
}
```

## Testing

Run these commands to test:

```bash
# Start development server
npm run dev

# Open browser at http://localhost:3000
# Click mic button and speak or use text chat
# Verify audio playback uses Sarvam Voice
```

## Troubleshooting

### No audio playback?

- Check that `SARVAM_API_KEY` is set in `.env.local`
- Verify API key is valid
- Check browser console for errors

### Poor audio quality?

- Try increasing `speech_sample_rate` to 16000
- Adjust `loudness` parameter (1.0-2.0)
- Enable `enable_preprocessing: true`

### Wrong voice?

- Check `speaker` parameter matches desired voice
- Available: 'manisha', 'meera', 'ravi', 'arjun'

## Links

- Sarvam AI Website: https://www.sarvam.ai/
- API Documentation: Contact Sarvam AI for detailed docs
