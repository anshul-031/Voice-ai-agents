# Campaign Management Feature

## Overview
Complete campaign management system for voice AI agent with contact upload and tracking capabilities.

## Features Implemented

### 1. Add Campaign ✅
- **Button**: "Add Campaign" in Campaigns dashboard
- **Fields**:
  - Campaign Title (required)
  - Start Date (required)
  - Status (running/stopped/completed)
  - Agent ID (default: "emi reminder")
  - User ID (auto-filled: "mukul")
- **API**: `POST /api/campaigns`
- **Schema**: MongoDB `Campaign` model

### 2. Campaigns Table ✅
- **Columns**: 
  - Campaign Title
  - Status (with color-coded badges)
  - Start Date
  - Updated At
- **Actions**:
  - **View**: Opens contacts modal
  - **Edit**: Opens edit modal with upload capability

### 3. Edit Campaign ✅
- **Editable Fields**:
  - campaign_title
  - status
  - start_date
  - agent_id
  - user_id
- **File Upload Section**:
  - Accepts CSV files only
  - Required columns: `number`, `name`, `description`
  - Stores in `campaign_contacts` MongoDB collection
  - Shows upload status and count

### 4. View Campaign Contacts ✅
- **Table Columns**:
  - Number (phone number)
  - Name
  - Description
  - Call Done (yes/no badge)
  - Actions (Delete button)
- **Features**:
  - Delete individual contacts
  - Shows total count
  - Empty state with helpful message

## Database Schema

### Campaign Model
```javascript
{
  title: String,
  start_date: Date,
  updated_at: Date,
  status: { type: String, enum: ['running', 'stopped', 'completed'] },
  agent_id: { type: String, default: 'emi reminder' },
  user_id: String
}
```

### CampaignContact Model
```javascript
{
  number: String,
  name: String,
  description: String,
  campaign_id: String,
  call_done: { type: String, enum: ['yes', 'no'], default: 'no' }
}
```

## API Endpoints

### Campaigns
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create new campaign
- `PUT /api/campaigns` - Update existing campaign

### Campaign Contacts
- `GET /api/campaign-contacts?campaign_id=xxx` - Get contacts for a campaign
- `POST /api/campaign-contacts` - Upload CSV file (multipart/form-data)
- `DELETE /api/campaign-contacts?id=xxx` - Delete a contact

## CSV Upload Format

Sample CSV file (`sample-contacts.csv`):
```csv
number,name,description
9876543210,John Doe,Regular customer - payment overdue
9876543211,Jane Smith,New customer - first EMI
9876543212,Bob Johnson,VIP customer - remind gently
```

## User Flow

1. **Create Campaign**:
   - Click "Add Campaign" button
   - Fill in campaign details
   - Submit → Campaign saved to MongoDB

2. **Upload Contacts** (Edit mode):
   - Click "Edit" on a campaign
   - Scroll to "Upload Contacts" section
   - Select CSV file
   - Upload → Contacts stored with campaign_id reference

3. **View Contacts**:
   - Click "View" on a campaign
   - See all uploaded contacts in table
   - Delete unwanted contacts

4. **Manage Status**:
   - Change campaign status: running → stopped → completed
   - Track updated_at timestamp

## Components

- `CampaignsTable.tsx` - Main campaigns list view
- `CampaignModal.tsx` - Add/Edit campaign form with file upload
- `CampaignContactsModal.tsx` - View contacts table with delete
- `app/dashboard/page.tsx` - Integrated dashboard

## Testing

1. **Navigate to Campaigns**:
   ```
   http://localhost:3001/dashboard
   Click "Campaigns" in sidebar
   ```

2. **Create Test Campaign**:
   - Click "Add Campaign"
   - Title: "EMI Reminder Q1 2025"
   - Status: "running"
   - Submit

3. **Upload Test Contacts**:
   - Click "Edit" on created campaign
   - Upload `sample-contacts.csv`
   - Verify upload success message

4. **View Contacts**:
   - Click "View" on campaign
   - Verify all contacts are displayed
   - Test delete functionality

## Files Modified/Created

### Models
- `models/Campaign.ts` ✅
- `models/CampaignContact.ts` ✅

### API Routes
- `app/api/campaigns/route.ts` ✅
- `app/api/campaign-contacts/route.ts` ✅

### Components
- `components/CampaignsTable.tsx` ✅
- `components/CampaignModal.tsx` ✅
- `components/CampaignContactsModal.tsx` ✅

### Pages
- `app/dashboard/page.tsx` (updated) ✅

### Sample Data
- `sample-contacts.csv` ✅

## Dependencies Added
- `csv-parse` - For CSV file parsing

## Status
✅ **COMPLETE** - All features implemented and tested
