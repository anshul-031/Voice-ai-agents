# Voice AI Chat Agent

A Next.js 15 application that enables real-time voice conversations with AI using speech-to-text, large language models, and text-to-speech technologies.

## Features

- **Continuous Voice Recording**: Click the microphone button to start listening
- **Voice Activity Detection**: Automatically detects when you stop speaking (800ms silence threshold)
- **Real-time Transcription**: Uses AssemblyAI for speech-to-text conversion
- **AI Conversations**: Powered by Google Gemini for intelligent responses
- **Text-to-Speech**: Uses Sarvam Voice (Manisha) to speak AI responses back to you
- **Clean UI**: Built with Tailwind CSS and responsive design

## Architecture

### Components

- `TopModelBoxes`: Displays current AI model configurations
- `InitialPromptEditor`: Allows customization of the AI system prompt
- `MicButton`: Toggles voice recording and chat interface
- `ChatBox`: Shows conversation history with timestamps
- `useVoiceRecorder`: Custom hook managing audio recording and VAD

### API Routes

- `/api/upload-audio`: Handles audio upload and AssemblyAI transcription
- `/api/llm`: Processes text through Google Gemini API
- `/api/tts`: Generates speech using Sarvam Voice API

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Additional Required Packages

```bash
npm install @google/generative-ai
```

### 3. Environment Configuration

Copy the example environment file and add your API keys:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:

```env
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
SARVAM_API_KEY=your_sarvam_api_key_here
```

#### Getting API Keys

- **AssemblyAI**: Sign up at [https://app.assemblyai.com/](https://app.assemblyai.com/)
- **Google Gemini**: Get your key at [https://ai.google.dev/](https://ai.google.dev/)
- **Sarvam AI**: Register at [https://www.sarvam.ai/](https://www.sarvam.ai/)

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Set Initial Prompt**: Edit the textarea to customize how the AI should behave
2. **Start Voice Chat**: Click the microphone button in the top-right corner
3. **Speak Naturally**: The app will listen continuously and detect when you stop talking
4. **View Conversation**: All messages appear in the floating chat box with timestamps
5. **Close Chat**: Click the X button to stop listening and close the chat

## Browser Requirements

- **Microphone Access**: The app requires microphone permissions
- **Modern Browser**: Supports MediaRecorder API (Chrome, Firefox, Safari, Edge)
- **HTTPS**: For production deployment, HTTPS is required for microphone access

## Technical Notes

### Voice Activity Detection

- Uses Web Audio API with AudioContext and AnalyserNode
- Monitors RMS (Root Mean Square) amplitude levels
- Configurable silence threshold (default: 0.01 RMS)
- Configurable silence timeout (default: 800ms)

### Audio Processing

- Supports multiple audio formats: webm, mp4, wav (browser dependent)
- Automatic audio format selection based on browser support
- Segments are processed individually for better real-time experience

### Performance Considerations

- Audio segments are automatically chunked to prevent long uploads
- Server-side API calls prevent exposing keys to client
- Error handling with user-friendly messages
- Automatic cleanup of audio resources

## Troubleshooting

### Microphone Issues

- Ensure microphone permissions are granted
- Check if other applications are using the microphone
- Try refreshing the page and granting permissions again

### API Errors

- Verify all API keys are correctly set in `.env.local`
- Check API key quotas and rate limits
- Ensure internet connection for external API calls

### Audio Playback Issues

- Check browser audio settings and volume
- Ensure browser supports Web Audio API
- Try using headphones to prevent feedback loops

## Development

### File Structure

```
├── app/
│   ├── api/
│   │   ├── upload-audio/route.ts    # AssemblyAI STT proxy
│   │   ├── llm/route.ts             # Gemini API proxy
│   │   └── tts/route.ts             # Deepgram TTS proxy
│   └── page.tsx                     # Main application page
├── components/
│   ├── TopModelBoxes.tsx            # Model configuration display
│   ├── InitialPromptEditor.tsx      # System prompt editor
│   ├── MicButton.tsx                # Voice recording toggle
│   └── ChatBox.tsx                  # Conversation interface
├── hooks/
│   └── useVoiceRecorder.ts          # Audio recording & VAD logic
└── types/
    └── index.ts                     # TypeScript type definitions
```

### Customization

- Adjust VAD thresholds in `useVoiceRecorder.ts`
- Modify AI models in component configurations
- Update UI styling with Tailwind classes
- Add conversation history persistence

## License

This project is open source and available under the MIT License.

## API Routes

This directory contains example API routes for the headless API app.

For more details, see [route.js file convention](https://nextjs.org/docs/app/api-reference/file-conventions/route).
