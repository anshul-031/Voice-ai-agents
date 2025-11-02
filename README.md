# Voice AI Agent Platform

A comprehensive Next.js 15 platform for building and deploying AI-powered voice agents with multi-channel support including phone calls, WhatsApp messaging, and web chat.

## 🌟 Features

### Core Capabilities
- **Voice Conversations**: Real-time voice chat with AI using speech-to-text, LLM, and text-to-speech
- **WhatsApp Integration**: Connect AI agents to WhatsApp Business numbers for automated messaging
- **Phone Integration**: Route phone calls through AI agents using telephony providers (Exotel)
- **Campaign Management**: Run outbound voice campaigns with contact lists
- **Knowledge Base**: Upload CSV and text files to enhance agent responses
- **Multi-Agent Support**: Create and manage multiple AI agents with different configurations

### Voice Features
- **Continuous Voice Recording**: Click the microphone button to start listening
- **Voice Activity Detection**: Automatically detects when you stop speaking (800ms silence threshold)
- **Real-time Transcription**: Supports multiple STT providers (AssemblyAI, Deepgram, Sarvam)
- **AI Conversations**: Powered by multiple LLMs (Gemini, GPT, Claude)
- **Text-to-Speech**: Multiple TTS providers (Deepgram, Sarvam)
- **Clean UI**: Built with Tailwind CSS and responsive design

### WhatsApp Features (New! 🎉)
- **Business API Integration**: Connect WhatsApp Business numbers via Meta's API
- **Automated Responses**: AI agents respond to incoming WhatsApp messages
- **Agent Linking**: Route messages to specific agents based on phone number
- **Message History**: Track all WhatsApp conversations in the platform
- **Webhook Management**: Easy webhook URL configuration and management

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
- `/api/tts`: Generates speech using Deepgram API

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

Edit `.env.local` and configure your environment:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Speech-to-Text Providers
ASSEMBLYAI_API_KEY=your_assemblyai_key
DEEPGRAM_API_KEY=your_deepgram_key
SARVAM_API_KEY=your_sarvam_key

# LLM Providers
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key (optional)

# Platform Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com

# WhatsApp Integration (Required for WhatsApp features)
META_WEBHOOK_VERIFY_TOKEN=your_secure_verify_token_123
WHATSAPP_VOICE_AGENT_ID=your-default-agent-id (optional)
```

#### Getting API Keys

- **MongoDB**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **AssemblyAI**: [AssemblyAI Console](https://app.assemblyai.com/)
- **Google Gemini**: [Google AI Studio](https://ai.google.dev/)
- **Deepgram**: [Deepgram Console](https://console.deepgram.com/)
- **Sarvam**: [Sarvam AI](https://www.sarvam.ai/)

#### WhatsApp Setup (Optional)

To connect WhatsApp Business numbers, see our comprehensive guides:
- **[Quick Setup (5 steps)](docs/QUICK_WHATSAPP_SETUP.md)** - Get started in minutes
- **[Complete Integration Guide](WHATSAPP_INTEGRATION_GUIDE.md)** - Detailed walkthrough
- **[UI Walkthrough](docs/WHATSAPP_UI_GUIDE.md)** - Visual guide to the platform
- **[Troubleshooting](docs/WHATSAPP_TROUBLESHOOTING.md)** - Common issues & solutions

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Voice Chat Interface

1. **Set Initial Prompt**: Edit the textarea to customize how the AI should behave
2. **Start Voice Chat**: Click the microphone button in the top-right corner
3. **Speak Naturally**: The app will listen continuously and detect when you stop talking
4. **View Conversation**: All messages appear in the floating chat box with timestamps
5. **Close Chat**: Click the X button to stop listening and close the chat

### Dashboard Features

#### Voice Agents
- Create and manage multiple AI agents
- Configure system prompts, models (STT, LLM, TTS)
- Add knowledge files (CSV, text) to enhance responses
- Each agent can have different configurations and purposes

#### WhatsApp Numbers
- Add WhatsApp Business numbers connected to Meta's API
- Link numbers to specific agents for automated responses
- View webhook URLs for Meta configuration
- Track message activity and status

#### Phone Numbers
- Configure phone numbers for telephony integration
- Route incoming calls to specific agents
- Manage Exotel or other provider configurations

#### Campaigns
- Create outbound voice campaigns
- Upload contact lists
- Schedule and monitor campaign progress
- View call results and analytics

#### Call Logs
- View detailed history of all voice interactions
- Filter by phone numbers, campaigns, or agents
- Access conversation transcripts and recordings

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
│   │   ├── voice-agents/           # Voice agent CRUD
│   │   ├── whatsapp-numbers/       # WhatsApp config CRUD
│   │   ├── phone-numbers/          # Phone config CRUD
│   │   ├── campaigns/              # Campaign management
│   │   ├── meta-webhook/           # WhatsApp webhook handler
│   │   ├── upload-audio/           # AssemblyAI STT proxy
│   │   ├── llm/                    # LLM API proxy
│   │   └── tts/                    # TTS API proxy
│   ├── dashboard/                  # Admin dashboard page
│   └── page.tsx                    # Voice chat interface
├── components/
│   ├── AgentModal.tsx              # Agent creation/edit with knowledge upload
│   ├── WhatsAppNumberModal.tsx     # WhatsApp configuration form
│   ├── WhatsAppNumbersTable.tsx    # WhatsApp numbers management
│   ├── VoiceAgentsTable.tsx        # Agents list and management
│   ├── ChatBox.tsx                 # Conversation interface
│   ├── MicButton.tsx               # Voice recording toggle
│   └── ...                         # Other UI components
├── lib/
│   ├── whatsAppService.ts          # WhatsApp message handling
│   ├── voiceAgentPipeline.ts       # Voice agent processing pipeline
│   ├── knowledge.ts                # Knowledge sanitization utilities
│   └── mongodb.ts                  # Database connection
├── models/
│   ├── VoiceAgent.ts               # Agent schema with knowledge
│   ├── WhatsAppNumber.ts           # WhatsApp config schema
│   ├── WhatsAppMessage.ts          # WhatsApp message schema
│   ├── PhoneNumber.ts              # Phone config schema
│   └── Campaign.ts                 # Campaign schema
├── docs/
│   ├── QUICK_WHATSAPP_SETUP.md     # 5-step WhatsApp setup
│   ├── WHATSAPP_UI_GUIDE.md        # Visual platform walkthrough
│   └── WHATSAPP_TROUBLESHOOTING.md # Common issues & fixes
├── WHATSAPP_INTEGRATION_GUIDE.md   # Complete WhatsApp guide
└── types/
    └── index.ts                    # TypeScript definitions
```

### Customization
- Adjust VAD thresholds in `useVoiceRecorder.ts`
- Modify AI models in component configurations
- Update UI styling with Tailwind classes
- Add conversation history persistence

## 📚 Documentation

### WhatsApp Integration
- **[Quick Setup Guide](docs/QUICK_WHATSAPP_SETUP.md)** - Get WhatsApp working in 5 steps
- **[Complete Integration Guide](WHATSAPP_INTEGRATION_GUIDE.md)** - Detailed setup instructions
- **[UI Walkthrough](docs/WHATSAPP_UI_GUIDE.md)** - Visual guide with screenshots
- **[Troubleshooting](docs/WHATSAPP_TROUBLESHOOTING.md)** - Fix common issues

### Technical Documentation
- **[Project Summary](PROJECT_SUMMARY.md)** - High-level architecture overview
- API Routes documentation in respective route files
- Component documentation in JSDoc comments

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.test.tsx
```

**Test Coverage Requirements:**
- Statements: ≥ 90%
- Branches: ≥ 89%
- Functions: ≥ 90%
- Lines: ≥ 90%

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
Ensure all required environment variables are set:
- Database credentials (MongoDB)
- API keys (AssemblyAI, Gemini, Deepgram, etc.)
- Platform URL (`NEXT_PUBLIC_APP_URL`)
- WhatsApp webhook token (`META_WEBHOOK_VERIFY_TOKEN`)

## 🤝 Contributing

Contributions are welcome! Please ensure:
- All tests pass (`npm test`)
- Code coverage meets thresholds
- ESLint checks pass (`npm run lint`)
- Build succeeds (`npm run build`)

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

- **WhatsApp Issues**: See [Troubleshooting Guide](docs/WHATSAPP_TROUBLESHOOTING.md)
- **General Issues**: Check server logs and browser console
- **API Issues**: Verify API keys and quotas
- **Database Issues**: Check MongoDB connection and credentials

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Message templates for WhatsApp
- [ ] SMS integration
- [ ] Email integration
- [ ] Custom webhook integrations
- [ ] Agent performance metrics
- [ ] A/B testing for agent prompts
