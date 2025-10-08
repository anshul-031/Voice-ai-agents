# Conversation History Implementation Summary

## Overview
Implemented conversation history feature to maintain natural conversation flow by keeping the last 20 messages in context when making LLM API calls. This allows the bot to understand references to previous parts of the conversation.

## Changes Made

### 1. LLM API Route (`app/api/llm/route.ts`)

#### Added Interface
```typescript
interface MessageHistory {
    text: string;
    source: 'user' | 'assistant';
}
```

#### New Function: `formatConversationHistory()`
- Takes conversation history (last N messages), system prompt, and current user text
- Formats them into a single prompt for Gemini API
- Default: keeps last 20 messages to maintain context while avoiding token limits
- Structure:
  1. System prompt
  2. Previous conversation (formatted as "User: ..." and "Assistant: ...")
  3. Current user message

#### Modified POST Handler
- Now accepts `conversationHistory` parameter in request body
- Passes history to `formatConversationHistory()` function
- Sends formatted prompt with full context to Gemini

### 2. Main Page Component (`app/page.tsx`)

Modified all three LLM API call locations to include conversation history:

#### A. Audio Segment Processing (Line ~170-195)
- Captures current messages array before making API call
- Sends conversation history (excluding current message) to LLM
- Maps messages to simplified format: `{ text, source }`

#### B. Real-time Speech Recognition (Line ~320-350)
- Similar pattern as audio segment
- Captures messages state and sends history to LLM
- Maintains context for continuous speech-to-text flow

#### C. Text Message Handling (Line ~490-520)
- Updates text chat to include conversation history
- Same approach: capture state, format history, send to API

## How It Works

### Example Conversation Flow

**First Exchange:**
```
User: "I want to know my EMI amount"
Assistant: "Your EMI amount is ₹3,000 which was due on 20th of this month."
```

**Second Exchange (with context):**
```
Previous Conversation:
User: I want to know my EMI amount
Assistant: Your EMI amount is ₹3,000 which was due on 20th of this month.

User: I want to pay it
```

Now the LLM understands "it" refers to the EMI amount discussed earlier.

### Technical Implementation

1. **State Management**: Before each LLM call, we capture the current messages array
2. **History Formatting**: Extract last 20 messages (excluding current one being sent)
3. **API Request**: Send formatted history along with current user text
4. **LLM Processing**: Gemini receives full context and generates contextually aware response

## Configuration

- **History Limit**: 20 messages (configurable via `maxMessages` parameter)
- **Why 20?**: Balances context retention with API token limits
- **Format**: Simple text-based format that Gemini can easily understand

## Benefits

✅ Natural conversation flow - bot remembers previous context
✅ Handles pronouns and references correctly
✅ Better user experience - feels more like talking to a human
✅ Works for both text chat and voice conversations
✅ Automatically limits history to prevent token overflow

## Testing Recommendations

Test the following scenarios:

1. **Multi-turn questions**:
   - "What's my EMI?"
   - "When is it due?"
   - "Can I pay it now?"

2. **Long conversations**:
   - Verify context is maintained over 20+ messages
   - Check that old messages drop off gracefully

3. **Both input modes**:
   - Test with text chat
   - Test with voice/audio input
   - Test with real-time speech recognition

4. **Edge cases**:
   - Empty conversation history (first message)
   - Restarted conversation (cleared history)
   - Multiple quick messages in succession

## Next Steps (Optional Enhancements)

- Add conversation summarization for very long chats
- Implement conversation persistence (save/load history)
- Add user controls for history length
- Token counting to optimize context window usage
- Add timestamps to history formatting
