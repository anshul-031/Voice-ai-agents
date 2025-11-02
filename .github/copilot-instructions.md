# Custom Instructions for GitHub Copilot

After every code change, always perform the following checks:

- Check for build issues by running the build command.
- Check for typecheck issues by running TypeScript type checking.
- Check for lint issues by running the linter.
- Ensure test coverage of overall code is more than 95% by running tests with coverage.

If any issues are found, fix them before proceeding.

## Code Quality and Standard Practices

When writing or modifying code, adhere to the following standards:

- **TypeScript Best Practices**:
  - Use interfaces for object type definitions instead of types where possible.
  - Use enums for defining constants and fixed sets of values.
  - Prefer `const` assertions for immutable data structures.
  - Use union types and discriminated unions for better type safety.
  - Avoid `any` type; use proper typing.

- **Code Structure**:
  - Write self-documenting code with clear variable and function names.
  - Use functional programming principles where appropriate (pure functions, immutability).
  - Implement proper error handling with try-catch blocks and custom error types.
  - Follow consistent naming conventions (camelCase for variables/functions, PascalCase for classes/interfaces).

- **Performance and Maintainability**:
  - Avoid unnecessary computations in loops.
  - Use appropriate data structures for the task.
  - Write modular, reusable code.
  - Add comments for complex logic, but prefer clear code over comments.

- **Testing**:
  - Write unit tests for all new functions and methods.
  - Include edge cases and error scenarios in tests.
  - Use descriptive test names that explain the expected behavior.

## React/Next.js Best Practices

- **Component Design**:
  - Use functional components with hooks instead of class components.
  - Prefer custom hooks for reusable logic and side effects.
  - Use `useCallback` and `useMemo` appropriately to prevent unnecessary re-renders.
  - Implement proper loading states and error boundaries.

- **State Management**:
  - Use local state (`useState`) for component-specific state.
  - Use refs (`useRef`) for DOM manipulation and persistent values.
  - Avoid prop drilling; consider context or state management libraries when needed.
  - Keep state as close to where it's used as possible.

- **Performance**:
  - Use `React.memo` for expensive components that re-render frequently.
  - Implement lazy loading for routes and heavy components.
  - Optimize images and assets for web delivery.
  - Use dynamic imports for code splitting.

## API Routes and Backend Patterns

- **API Design**:
  - Use RESTful conventions for API endpoints.
  - Implement proper HTTP status codes and error responses.
  - Validate input data using Zod or similar validation libraries.
  - Use consistent response formats across all endpoints.

- **Error Handling**:
  - Implement try-catch blocks in all API routes.
  - Return meaningful error messages without exposing sensitive information.
  - Log errors appropriately for debugging while protecting user data.
  - Handle rate limiting and authentication errors gracefully.

- **Database Operations**:
  - Use Mongoose models with proper schema definitions.
  - Implement connection pooling and error handling for MongoDB.
  - Use transactions for multi-document operations when consistency is critical.
  - Index frequently queried fields for performance.

## Voice AI and Real-time Features

- **Audio Handling**:
  - Implement proper audio context management and cleanup.
  - Handle microphone permissions and user consent appropriately.
  - Use Web Audio API for audio processing when needed.
  - Implement audio level monitoring and feedback.

- **Real-time Communication**:
  - Use appropriate polling or WebSocket strategies for real-time updates.
  - Implement connection state management and reconnection logic.
  - Handle network interruptions gracefully with offline support.
  - Optimize for low-latency audio streaming.

- **Speech Processing**:
  - Implement proper STT/TTS service integration with error handling.
  - Cache audio responses when appropriate to reduce API calls.
  - Handle different audio formats and quality settings.
  - Implement speech interruption and cancellation features.

## UI/UX and Accessibility

- **Responsive Design**:
  - Ensure all components work on mobile, tablet, and desktop.
  - Use Tailwind CSS utility classes consistently.
  - Implement proper touch targets for mobile interactions.
  - Test layouts at various screen sizes.

- **Accessibility**:
  - Add proper ARIA labels and roles for screen readers.
  - Ensure keyboard navigation works for all interactive elements.
  - Maintain sufficient color contrast ratios.
  - Provide text alternatives for audio content.

- **User Experience**:
  - Implement loading states and progress indicators.
  - Provide clear feedback for user actions.
  - Use consistent animation and transition patterns with Framer Motion.
  - Handle edge cases and error states gracefully.

## Security and Performance

- **Security**:
  - Validate and sanitize all user inputs.
  - Implement proper authentication and authorization.
  - Use HTTPS for all external API calls.
  - Avoid storing sensitive data in local storage.

- **Performance**:
  - Optimize bundle size by code splitting and tree shaking.
  - Implement caching strategies for API responses.
  - Use CDN for static assets when possible.
  - Monitor and optimize Core Web Vitals.

## Testing Patterns for Voice AI Applications

- **Unit Testing**:
  - Test individual functions and hooks in isolation.
  - Mock external APIs and services for reliable tests.
  - Test error conditions and edge cases thoroughly.

- **Integration Testing**:
  - Test API routes with realistic data scenarios.
  - Verify database operations and data integrity.
  - Test component interactions and state changes.

- **End-to-End Testing**:
  - Test complete user workflows including voice interactions.
  - Verify audio playback and recording functionality.
  - Test cross-browser compatibility for voice features.

- **Coverage Requirements**:
  - Maintain >95% overall code coverage.
  - Focus on critical paths and error handling code.
  - Include tests for accessibility features.