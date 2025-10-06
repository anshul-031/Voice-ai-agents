# Unit Testing Documentation

This project uses **Jest** and **React Testing Library** for comprehensive unit testing of components, hooks, and API routes.

## 🧪 Test Structure

```
__tests__/
├── components/           # Component tests
│   ├── AudioLevelIndicator.test.tsx
│   ├── ChatBox.test.tsx
│   ├── ConfirmDialog.test.tsx
│   ├── InitialPromptEditor.test.tsx
│   ├── MicButton.test.tsx
│   └── TopModelBoxes.test.tsx
├── hooks/               # Hook tests
│   └── useVoiceRecorder.test.tsx
├── api/                 # API route tests
│   ├── config-status.test.ts
│   ├── llm.test.ts
│   ├── tts.test.ts
│   └── upload-audio.test.ts
├── mocks.tsx           # Mock implementations
└── test-utils.tsx      # Testing utilities
```

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test Suites

**Component Tests Only:**
```bash
npm run test:unit:components
```

**Hook Tests Only:**
```bash
npm run test:unit:hooks
```

**API Route Tests Only:**
```bash
npm run test:unit:api
```

**All Unit Tests:**
```bash
npm run test:unit
```

### Run Tests in CI Environment
```bash
npm run test:ci
```

## 📊 Coverage Thresholds

The project maintains the following coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

View detailed coverage reports in the `coverage/` directory after running `npm run test:coverage`.

## 🧩 Test Categories

### Component Tests

All React components are tested for:
- ✅ **Rendering** - Component renders correctly with props
- ✅ **User Interactions** - Click events, form inputs, etc.
- ✅ **State Changes** - Component updates based on prop/state changes
- ✅ **Edge Cases** - Empty states, long text, special characters
- ✅ **Accessibility** - ARIA labels, roles, keyboard navigation

**Example:**
```typescript
import { render, screen, fireEvent } from '../test-utils'
import MicButton from '@/components/MicButton'

describe('MicButton', () => {
  it('should call onToggle when clicked', () => {
    const mockOnToggle = jest.fn()
    render(<MicButton isListening={false} isOpen={false} onToggle={mockOnToggle} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockOnToggle).toHaveBeenCalledTimes(1)
  })
})
```

### Hook Tests

Custom hooks are tested for:
- ✅ **Initial State** - Correct default values
- ✅ **State Updates** - Hook updates state correctly
- ✅ **Side Effects** - Cleanup, subscriptions, etc.
- ✅ **Error Handling** - Graceful error recovery
- ✅ **Multiple Cycles** - Can be used multiple times

**Example:**
```typescript
import { renderHook, act } from '@testing-library/react'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'

describe('useVoiceRecorder', () => {
  it('should start recording', async () => {
    const { result } = renderHook(() =>
      useVoiceRecorder({ onSegmentReady: jest.fn() })
    )
    
    await act(async () => {
      await result.current.startRecording()
    })
    
    expect(result.current.isListening).toBe(true)
  })
})
```

### API Route Tests

API routes are tested for:
- ✅ **Success Cases** - Correct response format and status
- ✅ **Error Cases** - Missing params, invalid input
- ✅ **Authentication** - API key validation
- ✅ **Edge Cases** - Empty input, long text, special characters
- ✅ **External API Integration** - Mocked responses

**Example:**
```typescript
import { POST } from '@/app/api/llm/route'

describe('API: /api/llm', () => {
  it('should return LLM response', async () => {
    process.env.GEMINI_API_KEY = 'test_key'
    
    const request = new NextRequest('http://localhost/api/llm', {
      method: 'POST',
      body: JSON.stringify({ userText: 'Hello' }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.llmText).toBeDefined()
  })
})
```

## 🛠️ Configuration

### Jest Configuration (`jest.config.js`)
- Uses Next.js Jest configuration
- Supports TypeScript with `ts-jest`
- Includes module path aliases (`@/`)
- Transforms `framer-motion` and `lucide-react`

### Jest Setup (`jest.setup.js`)
Provides global mocks for:
- `window.matchMedia`
- `IntersectionObserver`
- `ResizeObserver`
- `AudioContext`
- `MediaRecorder`
- `navigator.mediaDevices.getUserMedia`
- `Audio` constructor
- `URL.createObjectURL`
- `fetch` API

## 📝 Writing New Tests

### 1. Component Tests

```typescript
import { render, screen, fireEvent } from '../test-utils'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent prop="value" />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### 2. Hook Tests

```typescript
import { renderHook, act } from '@testing-library/react'
import { useMyHook } from '@/hooks/useMyHook'

describe('useMyHook', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.value).toBe(initialValue)
  })
})
```

### 3. API Route Tests

```typescript
/**
 * @jest-environment node
 */
import { POST } from '@/app/api/my-route/route'

describe('API: /api/my-route', () => {
  it('should handle requests', async () => {
    const request = new NextRequest('http://localhost/api/my-route', {
      method: 'POST',
      body: JSON.stringify({ data: 'value' }),
    })
    
    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

## 🔍 Debugging Tests

### Run Single Test File
```bash
npm test -- AudioLevelIndicator.test.tsx
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should render"
```

### See Console Logs
```bash
npm test -- --verbose
```

### Update Snapshots
```bash
npm test -- -u
```

## 📚 Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the user sees and does
   - Avoid testing internal state or methods

2. **Use Semantic Queries**
   - Prefer `getByRole`, `getByLabelText` over `getByTestId`
   - Makes tests more accessible and maintainable

3. **Mock External Dependencies**
   - Always mock API calls, timers, and external services
   - Keep tests fast and isolated

4. **Test Edge Cases**
   - Empty states, null values, long text
   - Special characters, unicode, multiline text

5. **Keep Tests Focused**
   - One assertion per test when possible
   - Clear, descriptive test names

6. **Clean Up**
   - Clear mocks between tests
   - Reset timers and environment variables

## 🐛 Common Issues

### Issue: `toBeInTheDocument` not found
**Solution:** Ensure `@testing-library/jest-dom` is imported in `jest.setup.js`

### Issue: Timer-related tests hang
**Solution:** Use `jest.useFakeTimers()` and `jest.runAllTimers()`

### Issue: Async tests fail
**Solution:** Use `await` with `act()` for async operations

### Issue: Module not found
**Solution:** Check path aliases in `jest.config.js` match `tsconfig.json`

## 📈 Coverage Reports

After running `npm run test:coverage`, open:
```
coverage/lcov-report/index.html
```

This provides a detailed visual report showing:
- Line coverage
- Branch coverage
- Function coverage
- Uncovered lines highlighted

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain coverage above threshold
4. Update this documentation if needed

## 📞 Support

For issues or questions about testing:
1. Check existing test files for examples
2. Review Jest documentation: https://jestjs.io/
3. Review React Testing Library docs: https://testing-library.com/react

---

**Last Updated:** October 2025
