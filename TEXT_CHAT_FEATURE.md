# Text Chat Feature

## Overview
Added a text-based chat interface to allow direct testing of the LLM without requiring voice input. This is useful for:
- Testing LLM responses quickly
- Users who prefer typing over speaking
- Situations where microphone access is not available
- Debugging LLM integration

## How to Use

### 1. Toggle Text Input
- Click the **purple message icon** (💬) button in the conversation controls area
- The text input field will slide down with a smooth animation

### 2. Send a Message
- Type your message in the input field
- Press **Enter** or click the **Send button** (purple arrow icon)
- The message will be sent directly to the LLM
- You'll see both your message and the AI's response in the chat

### 3. Features
- **Real-time Status**: Shows "Processing" status while waiting for response
- **Auto-open Chat**: Opens the chat panel automatically when sending first message
- **Keyboard Support**: Press Enter to send message
- **Visual Feedback**: Purple theme for text chat vs blue for voice
- **Text-to-Speech**: AI responses are also converted to speech (can be disabled if needed)
- **Error Handling**: Graceful error messages if API keys are not configured

## User Interface

### New Elements Added:
1. **Text Chat Toggle Button**
   - Location: Next to the microphone button
   - Icon: Message square (💬)
   - Color: Purple (to differentiate from voice features)
   - Tooltip: "Toggle text chat"

2. **Text Input Field**
   - Appears when text chat is toggled on
   - Placeholder: "Type your message here..."
   - Animated slide-down effect
   - Dark theme styling (slate-700 background)

3. **Send Button**
   - Purple circular button with send arrow icon
   - Disabled when input is empty or processing
   - Hover and tap animations

## Technical Implementation

### State Management
```typescript
const [showTextInput, setShowTextInput] = useState(false);
const [textMessage, setTextMessage] = useState('');
const textInputRef = useRef<HTMLInputElement>(null);
```

### Key Functions
- `handleSendTextMessage()`: Processes text input, calls LLM API, and updates chat
- `toggleTextInput()`: Shows/hides text input field
- `handleTextInputKeyDown()`: Handles Enter key press

### API Flow
1. User types message → Added to chat as user message
2. Message sent to `/api/llm` endpoint
3. LLM response received → Added to chat as assistant message
4. Response sent to `/api/tts` endpoint (optional)
5. Audio played (if TTS successful)

### Differences from Voice Chat
- **Skips STT**: No speech-to-text conversion needed
- **Direct Text**: Message sent directly to LLM
- **Same Processing**: Uses same LLM and TTS pipeline as voice
- **Independent**: Can be used alongside or instead of voice input

## Styling

### Colors
- **Purple Theme**: #7c3aed (purple-600) for text chat features
- **Button States**: 
  - Active: bg-purple-600
  - Hover: bg-purple-700
  - Inactive: bg-slate-700

### Animations
- Framer Motion for smooth transitions
- Slide-down animation for text input (200ms)
- Scale animations on button interactions

## Dependencies
- `lucide-react`: MessageSquare and Send icons
- `framer-motion`: AnimatePresence for smooth animations
- Existing APIs: `/api/llm` and `/api/tts`

## Future Enhancements
- Option to disable TTS for text messages
- Message history persistence
- Typing indicators
- Message editing
- Multi-line input support (textarea)
- Copy message text functionality
