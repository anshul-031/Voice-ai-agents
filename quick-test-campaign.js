#!/usr/bin/env node

/**
 * Quick UI Test - Verify Campaign Feature
 * 
 * This script creates a test campaign and verifies the complete workflow
 */

const API_BASE = 'http://localhost:3001/api';

async function quickTest() {
    console.log('🚀 Quick Campaign Feature Test\n');
    
    try {
        // 1. Create a campaign
        console.log('1️⃣  Creating test campaign...');
        const createRes = await fetch(`${API_BASE}/campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Quick Test Campaign',
                start_date: new Date().toISOString(),
                status: 'running',
                agent_id: 'emi reminder',
                user_id: 'mukul'
            })
        });
        const campaign = await createRes.json();
        if (!campaign.success) throw new Error('Failed to create campaign');
        console.log(`   ✅ Campaign created: ${campaign.data._id}`);
        
        // 2. Upload contacts
        console.log('\n2️⃣  Uploading test contacts...');
        const csvContent = 'number,name,description\n1234567890,Test User,Sample contact';
        const formData = new FormData();
        formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test.csv');
        formData.append('campaign_id', campaign.data._id);
        
        const uploadRes = await fetch(`${API_BASE}/campaign-contacts`, {
            method: 'POST',
            body: formData
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) throw new Error('Failed to upload contacts');
        console.log(`   ✅ Uploaded ${uploadData.count} contact(s)`);
        
        // 3. Fetch contacts
        console.log('\n3️⃣  Fetching campaign contacts...');
        const contactsRes = await fetch(`${API_BASE}/campaign-contacts?campaign_id=${campaign.data._id}`);
        const contacts = await contactsRes.json();
        if (!contacts.success) throw new Error('Failed to fetch contacts');
        console.log(`   ✅ Retrieved ${contacts.data.length} contact(s)`);
        
        // 4. Get all campaigns
        console.log('\n4️⃣  Fetching all campaigns...');
        const allRes = await fetch(`${API_BASE}/campaigns`);
        const all = await allRes.json();
        if (!all.success) throw new Error('Failed to fetch campaigns');
        console.log(`   ✅ Found ${all.data.length} total campaign(s)`);
        
        console.log('\n✨ All checks passed! Feature is working correctly.');
        console.log('\n📱 Next steps:');
        console.log('   1. Open http://localhost:3001/dashboard');
        console.log('   2. Click "Campaigns" in the sidebar');
        console.log('   3. You should see your campaigns including "Quick Test Campaign"');
        console.log('   4. Click "View" to see contacts, "Edit" to modify or upload more contacts');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

quickTest();
