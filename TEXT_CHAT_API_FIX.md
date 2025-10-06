# Text Chat API Fix

## Issue
The text chat feature was sending requests to `/api/llm` with the wrong payload format:

### ❌ Before (Incorrect):
```javascript
const llmPayload = {
    messages: [
        { role: 'system', content: initialPrompt },
        { role: 'user', content: userMessageText },
    ],
};
```

This format is for ChatGPT/OpenAI API, not our Gemini-based LLM API.

### ✅ After (Correct):
```javascript
const llmPayload = {
    prompt: initialPrompt,
    userText: userMessageText,
};
```

This matches the expected format in `app/api/llm/route.ts`:
```typescript
const { prompt, userText } = await request.json();
```

## Error Message
The error was appearing in the console as:
```
[LLM] POST request received
[LLM] Parsing request body...
[LLM] Request data: { hasPrompt: false, promptLength: undefined, userText: undefined }
[LLM] No user text provided
POST /api/llm 400 in 401ms
```

## Root Cause
When implementing the text chat feature, the payload format was accidentally written using the ChatGPT/OpenAI message format instead of the Gemini API format that our backend expects.

## Fix Applied
Updated `app/page.tsx` line ~330 in the `handleSendTextMessage` function to use the correct payload format.

## Verification
1. Start the dev server: `npm run dev`
2. Open http://localhost:3001 (or 3000)
3. Click the purple message icon (💬) to open text chat
4. Type a message and send it
5. The LLM should respond correctly without 400 errors

## Files Modified
- `app/page.tsx` - Fixed `handleSendTextMessage` function

## Related
- Voice chat was already using the correct format (`prompt` + `userText`)
- Only text chat had this issue
- No API changes needed - only client-side fix
