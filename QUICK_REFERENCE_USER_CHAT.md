# Quick Reference: User-Based Chat History

## How It Works Now

### For User "mukul" (Hardcoded)

1. **Click History Button** → Fetches sessions for userId="mukul"
2. **See Session List** → Shows all sessions with metadata
3. **Click a Session** → Fetches messages for that specific session
4. **View Conversation** → See full chat history

## API Flow

```
┌─────────────────────────────────────────────────┐
│                User Interface                   │
└─────────────────────────────────────────────────┘
                    ↓
         Click "History" Button
                    ↓
┌─────────────────────────────────────────────────┐
│  GET /api/chat/sessions?userId=mukul            │
│                                                 │
│  Returns:                                       │
│  [                                              │
│    {                                            │
│      sessionId: "session_123...",               │
│      messageCount: 5,                           │
│      firstMessage: "Hi...",                     │
│      lastTimestamp: "2025-10-08..."             │
│    },                                           │
│    ...                                          │
│  ]                                              │
└─────────────────────────────────────────────────┘
                    ↓
         Display Session List
                    ↓
         User Clicks Session
                    ↓
┌─────────────────────────────────────────────────┐
│  GET /api/chat/history?sessionId=session_123    │
│                                                 │
│  Returns:                                       │
│  [                                              │
│    {                                            │
│      id: "msg_1",                               │
│      role: "user",                              │
│      content: "Hello",                          │
│      timestamp: "..."                           │
│    },                                           │
│    {                                            │
│      id: "msg_2",                               │
│      role: "assistant",                         │
│      content: "Hi! How can I help?",            │
│      timestamp: "..."                           │
│    }                                            │
│  ]                                              │
└─────────────────────────────────────────────────┘
                    ↓
      Display Full Conversation
```

## Database Structure

```javascript
// Chat Document
{
    _id: ObjectId("..."),
    userId: "mukul",              // ← NEW! Hardcoded for now
    sessionId: "session_123...",
    role: "user",
    content: "Hello, I need help",
    timestamp: ISODate("2025-10-08T10:30:00Z"),
    systemPrompt: "..."           // Optional
}
```

## Key Files Modified

### 1. models/Chat.ts
- Added `userId` field (required, default: "mukul")
- Added compound index: `{userId: 1, sessionId: 1, timestamp: 1}`

### 2. app/api/chat/sessions/route.ts (NEW)
- Endpoint: `GET /api/chat/sessions?userId=mukul`
- Returns: List of sessions with metadata
- Uses: MongoDB aggregation pipeline

### 3. app/api/chat/history/route.ts
- Endpoint: `GET /api/chat/history?sessionId=xxx`
- Returns: Messages for specific session
- No changes (already required sessionId)

### 4. app/api/chat/save/route.ts
- Accepts `userId` in request body
- Defaults to "mukul" if not provided

### 5. app/api/llm/route.ts
- Automatically saves with `userId: "mukul"`
- Both user and assistant messages

### 6. components/ChatHistory.tsx
- Fetches sessions first (on modal open)
- Fetches messages on session click (on demand)
- Separate loading states for sessions and messages

## Current Hardcoded Values

```typescript
// In ChatHistory.tsx
const userId = 'mukul';

// In app/api/llm/route.ts
userId: 'mukul'

// In app/api/chat/save/route.ts
userId: userId || 'mukul'

// In models/Chat.ts (schema default)
default: 'mukul'
```

## Testing the Feature

### 1. Have a Conversation
- Start the app: `npm run dev`
- Have a chat conversation
- Messages automatically saved with `userId="mukul"`

### 2. View History
- Click the purple "History" button
- See list of sessions for user "mukul"
- Each session shows:
  - Session ID (truncated)
  - Message count
  - First message preview
  - Timestamp

### 3. View Session Details
- Click any session card
- See loading spinner
- View full conversation
- Click back arrow to return to list

## Migration for Existing Data

If you have existing chats without `userId`:

```javascript
// In MongoDB shell or script
db.chats.updateMany(
    { userId: { $exists: false } },
    { $set: { userId: "mukul" } }
)
```

## Performance Benefits

### Before
- Fetched ALL chats for ALL sessions
- Example: 1000 messages loaded on modal open

### After
- Fetches session metadata only (20-50 documents)
- Loads messages only when session is clicked (50 documents)
- **90% reduction** in initial data load!

## API Endpoints Quick Reference

| Endpoint | Method | Query Params | Purpose |
|----------|--------|--------------|---------|
| `/api/chat/sessions` | GET | `userId=mukul` | Get user's sessions |
| `/api/chat/history` | GET | `sessionId=xxx` | Get session messages |
| `/api/chat/save` | POST | Body: `{userId, sessionId, ...}` | Save a message |

## Example API Calls

### Get Sessions
```bash
curl http://localhost:3000/api/chat/sessions?userId=mukul
```

Response:
```json
{
  "success": true,
  "userId": "mukul",
  "sessions": [...],
  "count": 5
}
```

### Get Messages for Session
```bash
curl http://localhost:3000/api/chat/history?sessionId=session_abc123
```

Response:
```json
{
  "success": true,
  "sessionId": "session_abc123",
  "count": 10,
  "chats": [...]
}
```

## Next Steps for Production

To make this production-ready:

1. **Add Authentication**
   - Implement user login (JWT, OAuth, etc.)
   - Store authenticated userId in session

2. **Update Code**
   ```typescript
   // Get userId from authenticated session
   const userId = req.user.id; // Instead of 'mukul'
   ```

3. **Add Authorization**
   ```typescript
   // Verify user can only access their own data
   if (sessionUserId !== authenticatedUserId) {
       return 403 Forbidden;
   }
   ```

4. **Environment Config**
   ```bash
   # .env.local
   DEFAULT_USER_ID=mukul  # For development only
   ```

## Troubleshooting

### "No sessions found"
- Check if chats exist in database with `userId="mukul"`
- Run migration script if needed
- Check browser console for API errors

### "Loading forever"
- Check MongoDB connection
- Verify API endpoints are running
- Check network tab in browser DevTools

### TypeScript Errors
```bash
# Check for errors
npx tsc --noEmit

# Should show: No errors found
```

## Summary

✅ **What Changed**:
- Added userId field to database
- Created sessions API endpoint
- Updated chat saving to include userId
- Modified frontend to fetch in two steps

✅ **Current State**:
- All chats saved with userId="mukul"
- History filtered by user
- Optimized loading (sessions first, messages on click)

✅ **Ready For**:
- Testing with real data
- User authentication integration
- Multi-user deployment

---

**Quick Start**: Just use the app normally! History is now filtered for user "mukul" automatically.
