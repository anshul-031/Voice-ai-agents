# Voice AI Chat Agent - Testing Guide

This document provides comprehensive guidance on testing the Voice AI Chat Agent to ensure all components and functionality are working as expected.

## Test Suite Overview

The Voice AI Chat Agent testing framework includes:

1. **API Tests** - Verify that individual API endpoints function correctly
2. **End-to-End Tests** - Test the full voice processing pipeline from speech-to-text to audio response
3. **UI Component Tests** - Validate that UI components render and function properly

## Prerequisites

Before running tests, ensure:

1. The application is running (use `npm run dev` in a separate terminal)
2. Your environment is properly configured with API keys in `.env.local`
3. Required dependencies are installed:
   ```bash
   npm install --save-dev puppeteer
   ```

## Running Tests

### All Tests

To run all test suites at once:

```bash
npm test
```

### Individual Test Suites

To run specific test suites:

```bash
# API tests only
npm run test:api

# End-to-End tests only
npm run test:e2e

# UI component tests only
npm run test:ui
```

### Command Line Options

When running `node run-tests.js` directly, you can use these options:

- `--api-only`: Run only API tests
- `--e2e-only`: Run only end-to-end tests 
- `--ui-only`: Run only UI component tests
- `--skip-ui`: Run all tests except UI tests

## Test Files

- **run-tests.js**: Main test runner that orchestrates all test suites
- **test-api.js**: Basic API endpoint tests
- **test-e2e-enhanced.js**: Complete end-to-end pipeline tests
- **test-ui.js**: UI component rendering tests

## API Endpoint Tests

These tests verify the core API endpoints:

1. **Configuration Status** - `/api/config-status`
2. **LLM API** - `/api/llm` 
3. **TTS API** - `/api/tts`
4. **Audio Upload/STT API** - `/api/upload-audio`

The API tests use simple HTTP requests to validate that each endpoint responds correctly and returns the expected data.

## End-to-End Tests

These tests validate the complete processing pipeline:

1. Upload audio for transcription
2. Send transcribed text to the LLM
3. Convert the LLM response to speech

End-to-end tests use mock audio data which may not produce actual transcriptions but verifies the API flow.

## UI Component Tests

UI tests validate that all components render correctly and can be interacted with:

1. Header component
2. Model boxes
3. System prompt editor
4. Mic button
5. Chat box

These tests use Puppeteer to launch a headless browser and interact with the actual UI.

## Troubleshooting Common Issues

### API Key Configuration

If tests fail with API configuration errors:
- Check that `.env.local` exists and contains the required API keys
- Verify API keys are valid and have sufficient credits/quota
- Check API key format and ensure no trailing spaces

### UI Test Failures

If UI tests fail:
- Ensure the app is running on the expected port (default: 3000)
- Check that UI component class names match what the tests are looking for
- Try running UI tests with increased timeout if needed

### Audio Processing Issues

For audio transcription failures:
- Note that mock audio won't produce actual transcriptions 
- Check API key for speech-to-text service
- Verify any rate limits or quotas

## Creating Real Audio Test Files

For more accurate STT testing, you can create and use real audio files:

1. Record a short audio clip in WebM format
2. Place the file in the project directory as `test-audio.webm` 
3. Modify the `testSTT()` function in `test-e2e-enhanced.js` to use the real file

## Continuous Integration

For CI/CD pipelines, ensure:
- All API keys are properly configured as environment variables
- Sufficient timeouts are set for API responses
- UI tests have appropriate failure handling for headless environments