'use client';

import VoiceAIAgent from '@/components/VoiceAIAgent';

/**
 * Demo/Test Page for Voice AI Agent
 * This page is used by test files to test the VoiceAIAgent component
 * It provides a simple standalone instance without agent management features
 */
export default function DemoPage() {
  return (
    <VoiceAIAgent 
      defaultPrompt="You are a helpful assistant"
    />
  );
}
