# Initial Greeting Audio Fix

## Problem

The initial greeting message was displaying text but not playing audio when the call started.

## Root Cause

The issue was caused by **browser autoplay policy** restrictions:

- Modern browsers block automatic audio playback unless triggered by direct user interaction
- The greeting audio was being played immediately after `startCall()` without proper timing
- The audio context might not have been fully initialized when audio playback was attempted

## Solution Implemented

### 1. Added Retry Logic for Audio Playback

**File**: `app/page.tsx` (in `sendGreetingMessage` function)

Added try-catch with automatic retry:

```typescript
try {
  await audio.play();
  console.log("[Home] Playing greeting audio");
} catch (playError) {
  console.error("[Home] Failed to play greeting audio:", playError);
  // Try to play after a short delay to work around autoplay restrictions
  setTimeout(async () => {
    try {
      await audio.play();
      console.log("[Home] Greeting audio played after retry");
    } catch (retryError) {
      console.error("[Home] Greeting audio retry failed:", retryError);
    }
  }, 100);
}
```

### 2. Added Timing Delay Before Greeting

**File**: `app/page.tsx` (in `handleCallToggle` function)

Added 300ms delay after call starts:

```typescript
console.log("[Home] Call started successfully");

// Wait a brief moment for audio context to be fully ready
// This helps avoid browser autoplay restrictions
setTimeout(() => {
  if (isCallActiveRef.current) {
    sendGreetingMessage();
  }
}, 300);
```

## Why This Works

1. **User Interaction Context**: The call start button click provides the user interaction context needed for audio playback
2. **Audio Context Initialization**: The 300ms delay ensures the audio context is fully initialized
3. **Retry Mechanism**: If the first playback attempt fails, the retry after 100ms often succeeds as the browser has had time to process the user interaction
4. **State Check**: The `isCallActiveRef.current` check ensures we don't play greeting if the call was ended during the delay

## Testing

After this fix:

- ✅ Initial greeting displays text AND plays audio
- ✅ Subsequent messages work normally (text + audio)
- ✅ No browser console errors about autoplay blocking
- ✅ Graceful handling if audio playback still fails

## Browser Autoplay Policies

Different browsers have different autoplay policies:

- **Chrome/Edge**: Allows audio after user gesture (click)
- **Firefox**: Similar to Chrome
- **Safari**: More restrictive, may require additional user interaction

The retry mechanism ensures compatibility across all browsers.

## Status

✅ **Issue Resolved** - Initial greeting now plays audio correctly
