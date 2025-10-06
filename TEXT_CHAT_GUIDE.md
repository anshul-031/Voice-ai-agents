# Text Chat Feature - Quick Guide

## ✨ New Feature Added: Direct Text Chat with LLM

You can now chat with the AI using **text messages** in addition to voice! This is perfect for:
- Quick testing of the LLM
- Situations where you can't use voice
- Debugging and development

---

## 🎯 How to Access

### Step 1: Find the Text Chat Button
Look for the **purple message icon (💬)** button in the conversation controls area, located next to the microphone button.

```
┌─────────────────────────────────────────────┐
│  Conversation                                │
│                                              │
│  [Restart] [End]        🟢 Ready  💬  🎤    │
│                          ↑       ↑    ↑     │
│                       Status  Text  Voice   │
└─────────────────────────────────────────────┘
```

### Step 2: Click to Show Text Input
When you click the purple message button, a text input field will slide down:

```
┌─────────────────────────────────────────────┐
│  [Restart] [End]        🟢 Ready  💬  🎤    │
│                                              │
│  ┌────────────────────────────────────┐  ↗  │
│  │ Type your message here...          │ Send│
│  └────────────────────────────────────┘     │
└─────────────────────────────────────────────┘
```

### Step 3: Type and Send
1. Type your message in the input field
2. Press **Enter** or click the **Send button** (purple arrow ↗)
3. Watch as your message appears in the chat
4. The AI will respond, and you'll hear the response (if TTS is configured)

---

## 🎨 Visual Indicators

### Button States
- **Inactive** (gray): Text chat is hidden
- **Active** (purple): Text chat input is visible

### Colors
- **Purple theme**: Indicates text chat features
- **Blue theme**: Indicates voice features

---

## 🚀 Features

✅ **Instant messaging** - No voice input needed  
✅ **Keyboard shortcut** - Press Enter to send  
✅ **Auto-open chat** - Chat panel opens automatically  
✅ **Status updates** - Shows "Processing" while waiting  
✅ **TTS playback** - Hear the AI's response  
✅ **Error handling** - Clear error messages  

---

## 🔧 Technical Details

### What Happens When You Send a Message:
1. Your text message is added to the chat
2. Message sent to Gemini LLM API (`/api/llm`)
3. AI response received and added to chat
4. Response converted to speech via Deepgram (`/api/tts`)
5. Audio automatically plays

### API Requirements:
- **Required**: `GOOGLE_API_KEY` (for Gemini LLM)
- **Optional**: `DEEPGRAM_API_KEY` (for text-to-speech)

If Deepgram is not configured, you'll still get text responses without audio.

---

## 💡 Tips

### Best Practices:
- Use text chat for **quick questions**
- Use voice chat for **natural conversations**
- Toggle between both modes as needed

### Keyboard Shortcuts:
- **Enter**: Send message
- **Escape**: (Future) Close text input

---

## 🐛 Troubleshooting

### Text input doesn't appear?
- Make sure you clicked the purple message button
- Check browser console for errors

### Message not sending?
- Ensure you've typed something (empty messages are blocked)
- Check that `GOOGLE_API_KEY` is configured in `.env.local`
- Look for error messages in the chat

### No audio playback?
- This is normal if `DEEPGRAM_API_KEY` is not configured
- You'll still get text responses

---

## 📝 Example Usage

```
You: What is artificial intelligence?
AI: Artificial intelligence (AI) is the simulation of human 
    intelligence in machines that are programmed to think 
    and learn like humans...
```

---

## 🎉 Enjoy chatting with your AI assistant!

Open your browser at **http://localhost:3001** (or port 3000) and try it out!
