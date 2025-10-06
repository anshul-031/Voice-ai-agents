# Microphone Troubleshooting Guide

## Common Issues and Solutions

### Issue: Microphone Not Listening

If the microphone button shows "Listening" but doesn't capture audio, follow these steps:

#### 1. **Check Browser Console Logs**
Open Developer Tools (F12) and look for these log messages:

**Expected logs when starting:**
```
[Home] handleMicToggle called
[useVoiceRecorder] startRecording called
[useVoiceRecorder] Requesting microphone access...
[useVoiceRecorder] Microphone access granted
[useVoiceRecorder] Starting MediaRecorder...
[useVoiceRecorder] MediaRecorder started
[useVoiceRecorder] Starting VAD monitoring...
```

**Audio level logs (should appear every ~500ms):**
```
[useVoiceRecorder] Audio level: 0.0234, Threshold: 0.005, isListening: true
```

#### 2. **Check Audio Levels**
When the microphone is listening, you should see:
- An audio level indicator bar below the "Conversation" header
- Audio level values in the console (should be > 0 when you speak)

**If audio level is always 0:**
- Your microphone might be muted in system settings
- Browser doesn't have permission to access the microphone
- Microphone is being used by another application

#### 3. **Verify Microphone Permissions**

**Chrome/Edge:**
1. Click the lock icon in the address bar
2. Ensure "Microphone" is set to "Allow"
3. Reload the page

**Firefox:**
1. Click the microphone icon in the address bar
2. Ensure microphone access is allowed
3. Reload the page

**Safari:**
1. Go to Safari > Settings > Websites > Microphone
2. Ensure the site has "Allow" permission
3. Reload the page

#### 4. **Check System Microphone Settings**

**Windows:**
1. Right-click speaker icon → "Sound settings"
2. Go to "Input" section
3. Select correct microphone device
4. Test your microphone and ensure levels are showing

**macOS:**
1. System Settings → Sound → Input
2. Select correct microphone
3. Speak and check if input level bars move

**Linux:**
1. Open Sound Settings
2. Go to Input tab
3. Select correct input device
4. Test microphone levels

#### 5. **Audio Detection Threshold**

The app uses a silence threshold of **0.005 RMS**. If your microphone is too quiet:

1. Increase microphone boost in system settings
2. Speak closer to the microphone
3. Speak louder and more clearly

You can adjust the threshold in the code:
```typescript
// In app/page.tsx
const { isListening, isProcessing, audioLevel, startRecording, stopRecording } = useVoiceRecorder({
    onSegmentReady: handleAudioSegment,
    silenceTimeout: 750,
    silenceThreshold: 0.003, // Lower = more sensitive (try 0.001 - 0.01)
});
```

#### 6. **Check Browser Compatibility**

**Supported Browsers:**
- Chrome/Edge 88+
- Firefox 94+
- Safari 14.1+

**Not supported:**
- Internet Explorer
- Very old browser versions

#### 7. **Audio Format Issues**

Check console for MIME type being used:
```
[useVoiceRecorder] Using audio/webm;codecs=opus
```

If you see errors related to audio format, your browser might not support the selected format.

#### 8. **Common Error Messages**

| Error Message | Solution |
|--------------|----------|
| "Failed to access microphone" | Grant microphone permissions |
| "MediaRecorder not supported" | Update your browser |
| "NotAllowedError" | Allow microphone access in browser settings |
| "NotFoundError" | Connect a microphone device |
| "NotReadableError" | Close other apps using microphone |

## Debugging Steps

### Step 1: Test Microphone Access
1. Click the microphone button
2. Check if browser prompts for permission
3. Allow microphone access

### Step 2: Monitor Console Logs
Open browser console (F12) and filter by:
- `[useVoiceRecorder]` - Recording functionality
- `[Home]` - Main app logic
- Audio level - Sound detection

### Step 3: Check Audio Levels
When listening:
- Audio level bar should appear
- Values should change when you speak
- Typical speaking levels: 0.01 - 0.1

### Step 4: Verify Recording
Check if these events occur:
1. MediaRecorder starts
2. Audio data is collected
3. Silence detection works
4. Audio blob is created

### Step 5: Test STT API
If recording works but transcription fails:
1. Check AssemblyAI API key in `.env.local`
2. Look for upload errors in console
3. Verify audio file size is > 0 bytes

## Advanced Troubleshooting

### Enable Verbose Logging
The app already includes detailed logging. To see more:

1. Open Console (F12)
2. Don't filter - see all logs
3. Look for error messages in red

### Audio Settings Tuning

Located in `hooks/useVoiceRecorder.ts`:

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
        echoCancellation: true,    // Reduces echo
        noiseSuppression: true,    // Reduces background noise
        autoGainControl: true,     // Auto-adjusts volume
        channelCount: 1,           // Mono audio
        sampleRate: 44100,         // Sample rate
    }
});
```

Try disabling some features if having issues:
- Set `echoCancellation: false` if audio cuts out
- Set `noiseSuppression: false` if too quiet
- Set `autoGainControl: false` if volume fluctuates

### Silence Detection Tuning

```typescript
// Current settings
silenceTimeout: 750,        // Wait 750ms of silence before stopping
silenceThreshold: 0.005,    // Audio level threshold

// For faster response (stops sooner):
silenceTimeout: 350,

// For more patience (waits longer):
silenceTimeout: 1500,

// For more sensitive detection:
silenceThreshold: 0.001,

// For less sensitive (only loud sounds):
silenceThreshold: 0.01,
```

## Still Having Issues?

1. **Restart the browser** - Clears any stuck permissions
2. **Try a different browser** - Helps identify browser-specific issues
3. **Test with headset mic** - Rules out built-in mic problems
4. **Check console for ALL errors** - Red messages are critical
5. **Verify API keys** - Run `npm run test:api` to check configuration

## Quick Checklist

- [ ] Microphone is connected and working in system settings
- [ ] Browser has permission to access microphone
- [ ] Browser console shows "Microphone access granted"
- [ ] Audio level indicator shows activity when speaking
- [ ] Audio level values in console are > 0.005 when speaking
- [ ] No red error messages in console
- [ ] AssemblyAI API key is configured in `.env.local`
- [ ] Using a supported browser (Chrome/Firefox/Safari latest)
- [ ] Other apps are not using the microphone
- [ ] System microphone is not muted

## Contact & Support

If issues persist after trying all steps:
1. Export browser console logs (right-click → Save As)
2. Note your browser version and OS
3. Document the exact steps that cause the issue
4. Check for errors in the Network tab (F12 → Network)
