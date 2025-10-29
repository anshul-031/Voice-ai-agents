# WhatsApp Integration - Platform UI Guide

## 📱 Complete Visual Walkthrough

This guide shows you exactly where to click and what to enter in your platform to connect WhatsApp.

---

## Part 1: Accessing WhatsApp Numbers Section

### Step 1: Navigate to Dashboard
1. Log into your platform
2. You'll see the main dashboard
3. Look at the left sidebar menu

### Step 2: Click on "WhatsApp Numbers"
- In the sidebar, find and click **"WhatsApp Numbers"**
- Icon: 📱 MessageCircle icon
- This opens the WhatsApp Numbers management page

---

## Part 2: Adding Your First WhatsApp Number

### Step 3: Click "Add WhatsApp Number" Button
You'll see one of two states:

**If no numbers exist:**
- You'll see an empty state with:
  - 📱 Icon
  - Message: "No WhatsApp numbers yet"
  - Description about routing inbound messages
  - Green button: **"+ Add WhatsApp Number"**

**If numbers already exist:**
- You'll see a list of existing numbers
- Look for the **"+ Add WhatsApp Number"** button at the top-right

### Step 4: Fill in the Modal Form

When the modal opens, you'll see several sections:

#### Section A: Basic Information
Fill in these required fields (marked with *):

1. **WhatsApp Number** *
   - Format: `+1-234-567-8900` or `+919873016484`
   - This is your WhatsApp Business phone number
   - Example: `+1-555-123-4567`

2. **Display Name** *
   - A friendly name for internal use
   - Example: `"Customer Support"`, `"Sales Bot"`, `"Help Desk"`

3. **Phone Number ID** *
   - Get this from Meta Developer Console
   - Looks like: `123456789012345`
   - Found at: Meta App → WhatsApp → Getting Started

4. **Status**
   - Dropdown with options:
     - ✅ Active (messages will be processed)
     - ⚫ Inactive (messages will be ignored)
   - Default: Active

#### Section B: Link to Agent (Optional)

5. **Link to Agent**
   - Dropdown showing all your AI agents
   - Select which agent should handle WhatsApp messages
   - Shows: `-- No Agent Linked --` if none selected
   - **Tip**: Create a specific agent for WhatsApp with an appropriate prompt

#### Section C: Meta Credentials (Required)

This section has a darker background with the title **"Meta Credentials"**

6. **App ID** *
   - From Meta App → Settings → Basic
   - Looks like: `123456789012345`
   - Copy and paste from Meta Developer Console

7. **App Secret** *
   - From Meta App → Settings → Basic
   - Click "Show" to reveal it
   - Field type: Password (hidden characters)
   - **Important**: Keep this secret!

8. **Business ID** *
   - From Meta Business Settings
   - Looks like: `111222333444555`
   - Found at top of Business Settings page

9. **Access Token** *
   - From WhatsApp → Getting Started (temporary token)
   - OR from System User (permanent token)
   - Field type: Password (hidden characters)
   - Looks like: `EAAxxxxxxxxxxxxx...`

10. **Graph API Version**
    - Default: `v20.0`
    - Usually don't need to change
    - Meta updates versions periodically

#### Blue Info Box
You'll see a helpful tip:
> 💡 **Tip:** Configure the Meta webhook URL shown on the WhatsApp numbers list page. Ensure this app is subscribed to the messages event for the given phone number.

### Step 5: Save the Configuration

At the bottom of the modal:
- **Cancel** button (gray) - Discards changes
- **Add WhatsApp Number** button (green) - Saves the configuration

Click **"Add WhatsApp Number"** to save.

---

## Part 3: After Adding - Viewing Your WhatsApp Number

### What You'll See

Once added, you'll see a card displaying:

#### Card Header
- 📱 Icon
- **Display Name** in white text
- Phone number below in gray

#### Card Body (Left Side)
- **Linked Agent**: Name of the linked agent (or "Not linked")
- **Status**: 
  - 🟢 Green "Active" badge
  - ⚫ Gray "Inactive" badge
- **Phone Number ID**: Meta's ID for this number
- **Last Interaction**: Date/time of last message (if any)

#### Card Body (Right Side - Webhook URL)
- Label: "Webhook URL"
- The full webhook URL (e.g., `https://your-domain.com/api/meta-webhook`)
- 📋 Copy icon - Click to copy webhook URL
- 🔗 External link icon - Opens webhook in new tab
- Shows "Copied!" message briefly when you click copy

#### Card Footer (Action Buttons)
- 🔄 **Refresh** - Reload WhatsApp numbers list
- ✏️ **Edit** - Opens edit modal
- 🗑️ **Delete** - Removes this WhatsApp number

---

## Part 4: Editing an Existing WhatsApp Number

### How to Edit

1. Find the WhatsApp number card
2. Click the **✏️ Edit** button in the footer
3. The modal opens with **"Edit WhatsApp Number"** title

### What You Can Edit

**Read-Only Fields** (Cannot Change):
- ❌ WhatsApp Number (grayed out/disabled)

**Editable Fields**:
- ✅ Display Name
- ✅ Phone Number ID
- ✅ Status (Active/Inactive)
- ✅ Linked Agent
- ✅ Meta Credentials (optional - only if you want to update them)

### Updating Credentials

**Important**: When editing, you don't HAVE to provide Meta credentials again.
- Leave credential fields empty = Keep existing credentials
- Fill credential fields = Update with new credentials

### Save Changes

Click **"Update WhatsApp Number"** button to save.

---

## Part 5: Testing Your Integration

### After adding the WhatsApp number:

1. **Copy the Webhook URL**
   - Click the 📋 copy icon on your WhatsApp number card
   - The webhook URL is copied to clipboard

2. **Configure in Meta** (Do this in Meta Developer Console)
   - Go to your Meta App → WhatsApp → Configuration
   - Paste the webhook URL
   - Enter verify token (from your `.env.local`)
   - Click "Verify and Save"
   - Subscribe to "messages" field

3. **Send a Test Message**
   - Open WhatsApp on your phone
   - Send a message to your business number
   - Example: "Hello, I need help"

4. **Verify Response**
   - You should receive an AI-generated response
   - Response is based on your linked agent's configuration

---

## Part 6: Managing Multiple WhatsApp Numbers

### Adding More Numbers

You can add multiple WhatsApp numbers:
- Each with different phone numbers
- Each linked to different agents
- Each with its own Meta credentials

### Use Cases for Multiple Numbers
- 📞 **Sales**: `+1-555-SALES-01` → Linked to "Sales Agent"
- 🛠️ **Support**: `+1-555-HELP-02` → Linked to "Support Agent"
- 💼 **Billing**: `+1-555-BILL-03` → Linked to "Billing Agent"

### Grid Layout
- Numbers display in a responsive grid
- 1 column on mobile
- 2 columns on large screens (XL breakpoint)

---

## Part 7: Deleting a WhatsApp Number

### Steps to Delete

1. Find the WhatsApp number card
2. Click the **🗑️ Delete** button
3. Confirmation dialog appears:
   > "Are you sure you want to delete this WhatsApp number configuration?"
4. Click **OK** to confirm deletion
5. The number is removed from the platform

### What Happens
- WhatsApp number configuration deleted
- Webhook will no longer receive messages for this number
- Historical messages remain in database
- You can re-add the number later if needed

---

## Part 8: UI Features & Tips

### Copy Webhook URL
- Click 📋 icon next to webhook URL
- "Copied!" message appears briefly
- URL is in your clipboard
- Paste into Meta webhook settings

### Open Webhook in Browser
- Click 🔗 icon next to webhook URL
- Opens in new tab
- Useful for testing webhook endpoint
- Should show verification message

### Refresh List
- Click 🔄 Refresh button
- Reloads all WhatsApp numbers
- Shows latest changes
- Updates status and last interaction time

### Mock Numbers
If you see a ⚠️ icon on a card:
- This is a mock/test number
- Created automatically for testing
- Not a real WhatsApp Business number
- Delete it and add your real number

---

## Part 9: Common UI Issues & Solutions

### Issue: "Add WhatsApp Number" button doesn't work
**Solution**: 
- Check browser console for errors
- Ensure you're logged in
- Refresh the page

### Issue: Modal won't save
**Solution**:
- Ensure all required fields (marked *) are filled
- Check that credentials are valid
- Look for error messages below fields

### Issue: Can't see webhook URL
**Solution**:
- Ensure platform is deployed (not localhost)
- Check `NEXT_PUBLIC_APP_URL` in `.env.local`
- Webhook URL requires public domain

### Issue: "Copied!" doesn't appear
**Solution**:
- Browser may block clipboard access
- Try clicking copy icon again
- Manually select and copy the URL text

### Issue: Can't edit WhatsApp number
**Solution**:
- Ensure number exists and is loaded
- Check browser console for errors
- Try refreshing the page

---

## Part 10: Understanding the UI Workflow

### Complete Flow Diagram

```
1. Dashboard
   ↓
2. Click "WhatsApp Numbers" in sidebar
   ↓
3. WhatsApp Numbers List Page
   ├── Empty State (if no numbers)
   │   └── Click "Add WhatsApp Number"
   └── Numbers Grid (if numbers exist)
       ├── View number cards
       ├── Copy webhook URLs
       ├── Edit numbers
       └── Delete numbers
   ↓
4. Add/Edit Modal Opens
   ↓
5. Fill in Form
   ├── Basic Info (number, name, ID, status)
   ├── Link to Agent (optional)
   └── Meta Credentials (app ID, secret, etc.)
   ↓
6. Click "Add" or "Update"
   ↓
7. Modal Closes, List Refreshes
   ↓
8. Number Card Appears in Grid
   ↓
9. Copy Webhook URL
   ↓
10. Configure in Meta Developer Console
    ↓
11. Test by Sending WhatsApp Message
    ↓
12. Receive AI Response ✅
```

---

## Part 11: Visual Reference - Field Mapping

### Where to Get Each Field

| Platform Field | Meta Location | Example Value |
|----------------|---------------|---------------|
| WhatsApp Number | Your business phone | `+1-555-123-4567` |
| Display Name | Your choice | `"Support Bot"` |
| Phone Number ID | WhatsApp → Getting Started | `123456789012345` |
| Status | Your choice | `Active` |
| Linked Agent | Your agent list | `"Customer Support Agent"` |
| App ID | Settings → Basic | `987654321098765` |
| App Secret | Settings → Basic → Show | `a1b2c3d4e5f6...` |
| Business ID | Business Settings → Top | `111222333444555` |
| Access Token | WhatsApp → Getting Started | `EAAxxxxxxxxxxxxx...` |
| Graph API Version | Default provided | `v20.0` |

---

## Part 12: Next Steps After Setup

### 1. Verify in Meta
- ✅ Webhook verified (green checkmark)
- ✅ Subscribed to "messages" field
- ✅ Phone number added to app

### 2. Configure Your Agent
- Edit the linked agent's prompt
- Add knowledge files (CSV/text) if needed
- Test the agent in the playground

### 3. Test End-to-End
- Send various messages
- Check response quality
- Monitor conversation logs

### 4. Go Live
- Switch from test token to system user token
- Monitor for errors
- Set up alerts for webhook failures

---

## 🎉 You're All Set!

Your WhatsApp integration is now complete! Users can message your WhatsApp Business number and receive AI-powered responses automatically.

### Quick Access Checklist
- [ ] WhatsApp number added in platform
- [ ] Webhook URL copied
- [ ] Webhook configured in Meta
- [ ] Webhook verified (green checkmark)
- [ ] Agent linked and configured
- [ ] Test message sent and received
- [ ] Response quality verified

**Need Help?** See the full [WhatsApp Integration Guide](../WHATSAPP_INTEGRATION_GUIDE.md) for troubleshooting and advanced configuration.
