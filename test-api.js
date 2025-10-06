#!/usr/bin/env node

/**
 * Simple API Test Script for Voice AI Chat Agent
 * Run with: node test-api.js
 */

const BASE_URL = 'http://localhost:3000';

// Test 1: Configuration Status
async function testConfig() {
    console.log('\n📋 Testing Configuration Status...');
    try {
        const res = await fetch(`${BASE_URL}/api/config-status`);
        const data = await res.json();
        console.log('✅ Config:', data);
        return data.allConfigured;
    } catch (error) {
        console.error('❌ Config test failed:', error.message);
        return false;
    }
}

// Test 2: LLM Endpoint
async function testLLM() {
    console.log('\n🤖 Testing LLM Endpoint...');
    try {
        const res = await fetch(`${BASE_URL}/api/llm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: 'You are a helpful assistant.',
                userText: 'Say hello in one sentence.'
            }),
        });

        const data = await res.json();

        if (res.ok && data.llmText) {
            console.log('✅ LLM Response:', data.llmText);
            return true;
        } else {
            console.error('❌ LLM Error:', data.error || data);
            return false;
        }
    } catch (error) {
        console.error('❌ LLM test failed:', error.message);
        return false;
    }
}

// Test 3: TTS Endpoint
async function testTTS() {
    console.log('\n🔊 Testing TTS Endpoint...');
    try {
        const res = await fetch(`${BASE_URL}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: 'Hello, this is a test.'
            }),
        });

        const data = await res.json();

        if (res.ok && data.audioData) {
            console.log('✅ TTS Response: Audio generated (' + data.audioData.length + ' bytes)');
            return true;
        } else {
            console.error('❌ TTS Error:', data.error || data);
            return false;
        }
    } catch (error) {
        console.error('❌ TTS test failed:', error.message);
        return false;
    }
}

// Main
async function main() {
    console.log('🧪 Voice AI Chat Agent - API Tests');
    console.log('====================================');

    const configOk = await testConfig();

    if (!configOk) {
        console.log('\n⚠️  API keys not configured. Please add them to .env.local');
        process.exit(1);
    }

    const llmOk = await testLLM();
    const ttsOk = await testTTS();

    console.log('\n====================================');
    console.log('📊 Results:');
    console.log('  Config: ' + (configOk ? '✅' : '❌'));
    console.log('  LLM:    ' + (llmOk ? '✅' : '❌'));
    console.log('  TTS:    ' + (ttsOk ? '✅' : '❌'));

    if (configOk && llmOk && ttsOk) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed.');
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
