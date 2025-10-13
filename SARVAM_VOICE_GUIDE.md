# Sarvam TTS Voice Options Quick Reference

## Available Voices

### 1. Manisha (Default) 🎤

- **Gender**: Female
- **Best For**: Customer service, professional communication, banking
- **Tone**: Clear, friendly, professional
- **Use Case**: Your default voice for Riya (bank collection agent)

### 2. Meera 🎤

- **Gender**: Female
- **Best For**: Softer, more empathetic communication
- **Tone**: Warm, gentle, conversational
- **Use Case**: Customer support, healthcare, education

### 3. Arvind 🎤

- **Gender**: Male
- **Best For**: Authoritative, formal communication
- **Tone**: Deep, professional, confident
- **Use Case**: Banking, legal, corporate announcements

## Voice Parameters

### Adjustable Settings (in `app/api/tts/route.ts`)

```typescript
{
  pitch: 0,          // Range: -20 to 20 (0 = neutral)
  pace: 1.0,         // Range: 0.5 to 2.0 (1.0 = normal)
  loudness: 1.5,     // Range: 0.5 to 2.0 (1.0 = normal)
  speech_sample_rate: 8000  // 8000 or 16000 Hz
}
```

### Recommendations by Use Case

#### For Collection Calls (Current Setup)

```typescript
speaker: 'manisha',
pitch: 0,           // Neutral, not too aggressive
pace: 1.0,          // Clear, easy to understand
loudness: 1.5       // Slightly louder for clarity
```

#### For Customer Support

```typescript
speaker: 'meera',
pitch: 2,           // Slightly higher, friendlier
pace: 0.9,          // Slightly slower, more patient
loudness: 1.3       // Moderate volume
```

#### For Corporate Announcements

```typescript
speaker: 'arvind',
pitch: -2,          // Slightly deeper, authoritative
pace: 0.95,         // Deliberate pace
loudness: 1.4       // Clear and audible
```

## Language Support

Sarvam TTS is optimized for:

- **Hindi** (hi-IN) - Primary
- **Hinglish** (Hindi + English mixed) - Excellent
- **English with Indian accent** - Good

## How to Change Voice

### Method 1: Update Default (for all new agents)

Edit `app/api/tts/route.ts`:

```typescript
speaker: 'meera',  // Change from 'manisha' to 'meera' or 'arvind'
```

### Method 2: Per Agent (through UI)

1. Go to Dashboard
2. Edit/Create agent
3. Select TTS Model from dropdown:
   - Sarvam Manisha
   - Sarvam Meera
   - Sarvam Arvind

### Method 3: Dynamic Selection (future enhancement)

You can extend the code to parse the `ttsModel` field:

```typescript
const voiceMap = {
  "Sarvam Manisha": "manisha",
  "Sarvam Meera": "meera",
  "Sarvam Arvind": "arvind",
};
const speaker = voiceMap[ttsModel] || "manisha";
```

## Audio Quality Tips

### For Best Results:

1. **Sample Rate**:

   - Use 8000 Hz for phone/web calls (current)
   - Use 16000 Hz for high-quality recordings

2. **Preprocessing**:

   - Always keep `enable_preprocessing: true`
   - Automatically handles numbers, dates, abbreviations

3. **Text Formatting**:
   - Use proper punctuation for natural pauses
   - Write numbers as words for better pronunciation
   - Use Hindi Devanagari script for Hindi words

## Common Issues & Solutions

### Issue: Voice sounds robotic

**Solution**: Increase `pace` to 1.1 and adjust `pitch` by ±2

### Issue: Audio too quiet

**Solution**: Increase `loudness` to 1.8 or 2.0

### Issue: Speech too fast

**Solution**: Reduce `pace` to 0.9

### Issue: Hindi pronunciation incorrect

**Solution**: Use Devanagari script instead of romanized Hindi

## Testing Different Voices

### Test Command

You can test voices using curl:

```bash
curl -X POST https://api.sarvam.ai/text-to-speech \
  -H "api-subscription-key: sk_x56l2sqd_MlYB0HhUx9TLSNN13JHiK3Up" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": ["नमस्ते, मैं परीक्षण कर रहा हूं"],
    "target_language_code": "hi-IN",
    "speaker": "manisha",
    "model": "bulbul:v2"
  }'
```

### Test Different Speakers

Replace `"speaker": "manisha"` with:

- `"meera"` for Meera voice
- `"arvind"` for Arvind voice

## Voice Selection Guidelines

| Use Case         | Recommended Voice | Reason               |
| ---------------- | ----------------- | -------------------- |
| Bank Collections | Manisha           | Professional, clear  |
| Customer Service | Meera             | Friendly, empathetic |
| Surveys          | Meera             | Approachable         |
| Corporate        | Arvind            | Authoritative        |
| Healthcare       | Meera             | Gentle, caring       |
| Education        | Manisha           | Clear enunciation    |
| Government       | Arvind            | Formal               |
| Sales            | Manisha           | Confident            |

## Future Voice Options

Sarvam AI regularly adds new voices. Check their documentation for:

- Regional accents
- Different age groups
- Emotion-based voices

---

**Current Configuration**: Manisha (Female, Professional)
**Status**: ✅ Active and working
