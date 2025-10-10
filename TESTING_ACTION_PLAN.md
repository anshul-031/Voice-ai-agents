# Testing Action Plan - Path to 90% Coverage

## Current Status (As of Now)

- **Tests**: 17 failed, 17 skipped, 424 passed (458 total)
- **Pass Rate**: 92.6%
- **Coverage**: 51.92% statements (need 90%)
- **Branches**: 48.74% (need 50%)
- **Functions**: 50.4% (need 65%)
- **Lines**: 52.79% (need 65%)

## Coverage Gap Analysis

To reach **90% coverage**, we need:

- **+38% statements** (from 51.92% to 90%)
- **+1.3% branches** (from 48.74% to 50% minimum)
- **+14.6% functions** (from 50.4% to 65% minimum)
- **+12.2% lines** (from 52.79% to 65% minimum)

This translates to approximately **~850 new lines** of test code coverage needed.

## Failing Tests Breakdown

### 1. AudioLevelIndicator.test.tsx

- **Issue**: Canvas rendering tests expecting actual canvas operations
- **Failing Tests**: Tests checking canvas bar rendering
- **Fix Required**: Mock canvas context properly OR update tests for canvas implementation
- **Priority**: HIGH

### 2. ChatBox.test.tsx

- **Issue**: Tests expecting old complex loader vs new simple loader
- **Failing Tests**: Loader appearance/disappearance tests
- **Fix Required**: Update assertions for new simple loader ("Generating..." text)
- **Priority**: HIGH

### 3. page.mic-close.test.tsx

- **Issue**: Tests for mic button behavior with new UI
- **Failing Tests**: Microphone close flow
- **Fix Required**: Update button selectors and flow expectations
- **Priority**: MEDIUM

### 4. page.end-dialog-cancel.test.tsx

- **Issue**: Tests expect "End Call" dialog that no longer exists
- **Failing Tests**: End call confirmation dialog tests
- **Fix Required**: Skip or rewrite for direct end call flow
- **Priority**: MEDIUM

### 5. page.continuous-call.test.tsx

- **Issue**: Continuous call flow with new greeting message
- **Failing Tests**: Call lifecycle with automatic greeting
- **Fix Required**: Add greeting message expectations
- **Priority**: MEDIUM

### 6. page.test.tsx

- **Issue**: Multiple test failures for UI changes
- **Failing Tests**: Various button text and flow changes
- **Fix Required**: Update assertions for new UI
- **Priority**: HIGH

## Recommended Strategy (2-Phase Approach)

### PHASE 1: Fix Existing Failures (Immediate)

**Goal**: Get to 0 failing tests
**Estimated Time**: 2-3 hours
**Actions**:

1. Fix AudioLevelIndicator tests (mock canvas properly)
2. Fix ChatBox tests (update for simple loader)
3. Fix page.test.tsx (update button text assertions)
4. Skip/rewrite end-dialog tests (feature removed)
5. Update mic-close and continuous-call tests

### PHASE 2: Increase Coverage to 90% (Comprehensive)

**Goal**: Add ~850 lines of new test coverage
**Estimated Time**: 6-8 hours
**Actions**:

#### A. New Feature Tests (~300 lines)

- **Split Layout Tests**:
  - Grid rendering (mobile/desktop)
  - Transcription panel display
  - Visualizer panel display
  - Responsive behavior
  - Empty states
- **Greeting Message Tests**:
  - Greeting sent on call connect
  - TTS API called with correct Hindi text
  - Audio playback initiated
  - Message appears in chat
  - Error handling for TTS failures
  - Retry logic
- **Simple Loader Tests**:
  - Loader appears when processing
  - Loader disappears when done
  - Animation rendering
  - Text display
  - Multiple processing states

#### B. Component Coverage (~250 lines)

- **AudioLevelIndicator**:

  - Canvas initialization
  - Wave pattern calculations
  - Bar height animations based on level
  - Gradient rendering
  - Device pixel ratio handling
  - Cleanup on unmount
  - Edge cases (level 0, level 1, rapid changes)

- **ChatBox**:
  - Message rendering (user/assistant)
  - Auto-scroll behavior
  - Empty state handling
  - Long messages
  - Special characters
  - Multilingual text

#### C. Page Logic Coverage (~200 lines)

- **Call Lifecycle**:
  - Start call → greeting → active state
  - End call → cleanup → idle state
  - Toggle between call modes
  - Error states
- **Text Chat Flow**:
  - Send message
  - Receive response
  - Clear chat
  - Processing states
  - Error handling

#### D. Edge Cases & Error Paths (~100 lines)

- **Error Scenarios**:
  - TTS API failures
  - LLM API failures
  - Network timeouts
  - Invalid responses
  - Microphone access denied
  - Audio playback errors
- **Boundary Cases**:
  - Empty inputs
  - Very long inputs
  - Rapid user interactions
  - Concurrent operations

## Quick Win Opportunities

### 1. Canvas Mocking (High Impact, Low Effort)

Create comprehensive canvas mock that satisfies tests:

```typescript
const mockCanvas = () => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    // ... all canvas methods
  }));
};
```

### 2. Simple Loader Tests (High Impact, Low Effort)

Add tests for "Generating..." text visibility:

```typescript
it("should show simple loader", () => {
  render(<ChatBox isProcessing={true} />);
  expect(screen.getByText("Generating...")).toBeInTheDocument();
});
```

### 3. Greeting Message Integration Tests (High Impact, Medium Effort)

Test greeting flow end-to-end:

```typescript
it("should send greeting on call start", async () => {
  // Start call
  // Wait for TTS call
  // Verify greeting text in API call
  // Verify message in chat
});
```

## Coverage Target Breakdown

To reach 90% coverage, target these percentages per file type:

### Critical Files (Need 95%+ coverage each):

- `app/page.tsx` - Main application logic
- `components/ChatBox.tsx` - Chat interface
- `components/AudioLevelIndicator.tsx` - Visualizer
- `hooks/useSpeechRecognition.ts` - Speech logic
- `hooks/useVoiceRecorder.ts` - Recording logic

### API Routes (Need 90%+ coverage each):

- `app/api/llm/route.ts` - LLM integration
- `app/api/tts/route.ts` - TTS integration
- `app/api/upload-audio/route.ts` - Audio upload

### Supporting Components (Need 80%+ coverage each):

- `components/MicButton.tsx`
- `components/TopModelBoxes.tsx`
- `components/InitialPromptEditor.tsx`
- `components/ConfirmDialog.tsx`

## Immediate Next Steps

### Step 1: Fix Canvas Tests (15 minutes)

Create `__tests__/setup/canvas.mock.ts` with comprehensive canvas mock.

### Step 2: Fix ChatBox Tests (15 minutes)

Update expectations for simple loader in existing tests.

### Step 3: Fix Page Tests (30 minutes)

Update all button text assertions to match new UI.

### Step 4: Run Coverage Report (5 minutes)

```bash
npm test -- --coverage --watchAll=false
```

### Step 5: Identify Coverage Gaps (15 minutes)

Review coverage report to find uncovered lines/branches.

### Step 6: Write Targeted Tests (4-6 hours)

Focus on uncovered areas identified in Step 5.

## Success Metrics

### Phase 1 Complete:

- ✅ 0 failing tests
- ✅ 458/458 passing (100% pass rate)
- ✅ All test suites green

### Phase 2 Complete:

- ✅ >90% statement coverage
- ✅ >50% branch coverage
- ✅ >65% function coverage
- ✅ >65% line coverage
- ✅ ~600-700 total test cases

## Risk Mitigation

### Potential Blockers:

1. **Complex Canvas Rendering**: May need sophisticated mocks
   - **Mitigation**: Use jest-canvas-mock or comprehensive manual mock
2. **Async TTS/LLM Operations**: Timing issues in tests
   - **Mitigation**: Use `waitFor` extensively, increase timeouts
3. **Audio Playback**: Difficult to test in JSDOM
   - **Mitigation**: Mock Audio objects completely
4. **Browser-specific APIs**: Not available in test environment
   - **Mitigation**: Mock Web Audio API, MediaRecorder, etc.

## Current Priority Order

1. **IMMEDIATE** (Next 1 hour):

   - Fix AudioLevelIndicator canvas tests
   - Fix ChatBox simple loader tests
   - Get to 0 failing tests

2. **HIGH** (Next 2-4 hours):

   - Add greeting message tests
   - Add split layout tests
   - Cover main page logic gaps

3. **MEDIUM** (Next 4-6 hours):

   - Add canvas rendering edge cases
   - Add error path tests
   - Add boundary condition tests

4. **LOW** (Final polish):
   - Increase branch coverage to 50%+
   - Cover rare edge cases
   - Add performance tests

---

**Current Blocker**: 17 failing tests preventing coverage increase
**Solution**: Fix existing tests first, then add comprehensive new tests
**Timeline**: Phase 1 (3 hours) + Phase 2 (6-8 hours) = 9-11 hours total
**Expected Outcome**: 90%+ coverage, 458/458 tests passing
