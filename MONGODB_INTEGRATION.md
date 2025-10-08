# MongoDB Chat History Integration

## Overview

The application now stores all chat conversations in MongoDB and provides a UI to view chat history. This document explains the implementation and usage.

## Features

1. **Automatic Chat Storage**: Every user message and AI assistant response is automatically saved to MongoDB
2. **Session Tracking**: Each conversation has a unique session ID to group related messages
3. **Chat History Viewer**: A modal dialog to view all past conversations with expandable message threads
4. **Real-time Updates**: New messages are saved as they are created

## Architecture

### Database Connection

**File**: `lib/mongodb.ts`

- Singleton pattern for MongoDB connection
- Handles connection caching to prevent multiple connections
- Connection string configured via environment variable `MONGODB_URI`

### Data Model

**File**: `models/Chat.ts`

```typescript
{
    sessionId: string;      // Unique identifier for conversation session
    role: 'user' | 'assistant';  // Message sender
    content: string;        // Message text content
    systemPrompt?: string;  // System prompt (saved with first user message)
    timestamp: Date;        // When message was sent
}
```

### API Routes

#### 1. Save Chat Messages (`/api/chat/save`)
- **Method**: POST
- **Purpose**: Manually save chat messages (currently automatic via LLM route)
- **Request Body**:
```json
{
    "sessionId": "string",
    "role": "user" | "assistant",
    "content": "string",
    "systemPrompt": "string (optional)"
}
```
- **Response**: Saved chat object with `_id`

#### 2. Get Chat History (`/api/chat/history`)
- **Method**: GET
- **Purpose**: Retrieve all saved chat messages
- **Query Parameters**: None (returns all chats)
- **Response**:
```json
{
    "success": true,
    "chats": [
        {
            "_id": "string",
            "sessionId": "string",
            "role": "user" | "assistant",
            "content": "string",
            "systemPrompt": "string (optional)",
            "timestamp": "ISO date string"
        }
    ],
    "count": number
}
```

### Frontend Components

#### ChatHistory Component (`components/ChatHistory.tsx`)

**Features**:
- Modal dialog overlay with backdrop blur
- Groups messages by session ID
- Expandable/collapsible session views
- Shows message count, first message preview, and relative timestamps
- Formatted message display with user/assistant icons
- Loading states and error handling
- Responsive design with max height scrolling

**Props**:
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Callback when modal is closed

**Usage in app**:
```tsx
const [showChatHistory, setShowChatHistory] = useState(false);

// Open history
<button onClick={() => setShowChatHistory(true)}>History</button>

// Render component
<ChatHistory 
    isOpen={showChatHistory} 
    onClose={() => setShowChatHistory(false)} 
/>
```

## Environment Configuration

Add MongoDB connection string to `.env.local`:

```bash
MONGODB_URI=mongodb+srv://mukulrai_db_user:rxHzQuYtSUFN6DHM@cluster0.nnefrop.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

**Note**: Replace with your own MongoDB connection string in production. Never commit credentials to version control.

## How It Works

### 1. Chat Storage Flow

```
User speaks → STT converts to text → 
LLM API receives request → 
    1. Save user message to MongoDB (with sessionId, role: 'user')
    2. Generate AI response
    3. Save assistant message to MongoDB (with sessionId, role: 'assistant')
→ Return response to client
```

### 2. Session Management

- Each conversation gets a unique session ID when it starts
- Session ID format: `session_<timestamp>_<random>`
- Session ID is stored in component state and passed with each LLM request
- All messages in the same session share the same session ID

### 3. Chat History Viewing Flow

```
User clicks "History" button → 
Modal opens → 
Fetch /api/chat/history → 
Group messages by sessionId → 
Sort sessions by most recent → 
Display in expandable list → 
User can expand/collapse to view full conversations
```

## UI/UX Features

### History Button
- Located in header next to "Restart" and "End" buttons
- Purple color scheme (distinct from other action buttons)
- Shows clock icon
- Disabled during processing

### History Modal
- Full-screen overlay with backdrop blur
- Centered card with max 80vh height
- Header shows total session count
- Each session shows:
  - Session ID (truncated)
  - Message count
  - First message preview (100 chars)
  - Relative timestamp ("2 hours ago", "Just now", etc.)
- Click session to expand/collapse messages
- Messages display with:
  - User messages: purple background, right-aligned
  - Assistant messages: slate background, left-aligned
  - Avatar icons for each role
  - Timestamp for each message

### Loading States
- Spinner animation while fetching data
- Empty state with icon when no history exists
- Error state with retry button

## Database Schema

Collection: `chats` (automatically created)

Indexes (recommended for production):
```javascript
db.chats.createIndex({ sessionId: 1, timestamp: 1 });
db.chats.createIndex({ timestamp: -1 });
```

## Error Handling

### Database Connection Errors
- Logged to console with detailed error messages
- API returns 500 status with error details
- Frontend shows error message with retry button

### Save Failures
- User/assistant messages continue to work even if DB save fails
- Errors logged but don't block conversation flow
- Graceful degradation: conversation works without history

### Fetch Failures
- History modal shows error state
- Retry button allows user to attempt fetch again
- Error details displayed to user

## Future Enhancements

Potential improvements for future versions:

1. **Filtering & Search**
   - Filter by date range
   - Search within message content
   - Filter by system prompt type

2. **Session Management**
   - Load a past session into current chat
   - Delete individual sessions
   - Export conversations

3. **Performance**
   - Pagination for large history
   - Virtual scrolling for many sessions
   - Caching with React Query

4. **Analytics**
   - Conversation metrics
   - Most common topics
   - Response time tracking

5. **User Features**
   - Session naming
   - Favorite/bookmark sessions
   - Share conversations

## Testing

To test MongoDB integration:

1. **Start MongoDB**: Ensure MongoDB Atlas or local instance is running
2. **Configure**: Add `MONGODB_URI` to `.env.local`
3. **Start App**: `npm run dev`
4. **Create Conversations**: Have some conversations with the AI
5. **View History**: Click "History" button to see saved chats
6. **Verify Database**: Check MongoDB to see stored documents

## Troubleshooting

### "Failed to connect to MongoDB"
- Check `MONGODB_URI` in `.env.local`
- Verify MongoDB Atlas cluster is running
- Check IP whitelist in MongoDB Atlas
- Ensure network connectivity

### "No chat history yet"
- Have a conversation first to generate chat data
- Check browser console for API errors
- Verify `/api/llm/route.ts` is saving messages

### Messages not saving
- Check API logs in terminal
- Verify database connection succeeds
- Check MongoDB user permissions
- Ensure `Chat` model schema is correct

## Security Considerations

1. **Connection String**: Never commit `MONGODB_URI` to version control
2. **Input Validation**: All inputs are validated before saving
3. **Authentication**: Consider adding user authentication for multi-user scenarios
4. **Data Privacy**: Implement data retention policies
5. **Access Control**: Restrict API routes in production

## Performance Notes

- **Connection Pooling**: Mongoose handles connection pooling automatically
- **Index Usage**: Create indexes on `sessionId` and `timestamp` for faster queries
- **Query Limits**: Consider adding pagination for large datasets
- **Caching**: Implement caching for frequently accessed sessions

## Maintenance

### Backup Strategy
```bash
# Export database
mongodump --uri="<MONGODB_URI>" --out=/backup/path

# Restore database
mongorestore --uri="<MONGODB_URI>" /backup/path
```

### Cleanup Old Data
```javascript
// Delete chats older than 90 days
db.chats.deleteMany({
    timestamp: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
});
```

## References

- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
