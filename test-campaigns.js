#!/usr/bin/env node

const API_BASE = 'http://localhost:3001/api';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCampaignAPI() {
    console.log('🧪 Testing Campaign Management API\n');
    
    // Wait for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    await sleep(5000);
    
    let campaignId = null;
    
    try {
        // Test 1: GET all campaigns
        console.log('\n📋 Test 1: GET all campaigns');
        const getCampaignsRes = await fetch(`${API_BASE}/campaigns`);
        const getCampaignsData = await getCampaignsRes.json();
        console.log(`Status: ${getCampaignsRes.status}`);
        console.log(`Response:`, getCampaignsData);
        
        if (!getCampaignsRes.ok) {
            console.error('❌ Failed to get campaigns');
            return;
        }
        console.log('✅ GET campaigns successful');
        
        // Test 2: Create a new campaign
        console.log('\n📝 Test 2: POST create new campaign');
        const newCampaign = {
            title: 'Test Campaign ' + Date.now(),
            start_date: new Date().toISOString(),
            status: 'running',
            agent_id: 'emi reminder',
            user_id: 'test_user'
        };
        
        const createRes = await fetch(`${API_BASE}/campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCampaign)
        });
        
        const createData = await createRes.json();
        console.log(`Status: ${createRes.status}`);
        console.log(`Response:`, createData);
        
        if (!createRes.ok) {
            console.error('❌ Failed to create campaign');
            return;
        }
        
        campaignId = createData.data._id;
        console.log(`✅ Campaign created with ID: ${campaignId}`);
        
        // Test 3: Update the campaign
        console.log('\n✏️  Test 3: PUT update campaign');
        const updateRes = await fetch(`${API_BASE}/campaigns`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: campaignId,
                title: 'Updated Test Campaign',
                status: 'completed'
            })
        });
        
        const updateData = await updateRes.json();
        console.log(`Status: ${updateRes.status}`);
        console.log(`Response:`, updateData);
        
        if (!updateRes.ok) {
            console.error('❌ Failed to update campaign');
            return;
        }
        console.log('✅ Campaign updated successfully');
        
        // Test 4: Upload CSV contacts
        console.log('\n📤 Test 4: POST upload CSV contacts');
        const csvContent = `number,name,description
9876543210,John Doe,Test contact 1
9876543211,Jane Smith,Test contact 2
9876543212,Bob Johnson,Test contact 3`;
        
        const formData = new FormData();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('file', blob, 'test-contacts.csv');
        formData.append('campaign_id', campaignId);
        
        const uploadRes = await fetch(`${API_BASE}/campaign-contacts`, {
            method: 'POST',
            body: formData
        });
        
        const uploadData = await uploadRes.json();
        console.log(`Status: ${uploadRes.status}`);
        console.log(`Response:`, uploadData);
        
        if (!uploadRes.ok) {
            console.error('❌ Failed to upload contacts');
            return;
        }
        console.log(`✅ Uploaded ${uploadData.count} contacts`);
        
        // Test 5: Get contacts for campaign
        console.log('\n📋 Test 5: GET campaign contacts');
        const getContactsRes = await fetch(`${API_BASE}/campaign-contacts?campaign_id=${campaignId}`);
        const getContactsData = await getContactsRes.json();
        console.log(`Status: ${getContactsRes.status}`);
        console.log(`Response:`, getContactsData);
        
        if (!getContactsRes.ok) {
            console.error('❌ Failed to get contacts');
            return;
        }
        console.log(`✅ Retrieved ${getContactsData.data.length} contacts`);
        
        // Test 6: Delete a contact
        if (getContactsData.data.length > 0) {
            console.log('\n🗑️  Test 6: DELETE a contact');
            const contactId = getContactsData.data[0]._id;
            const deleteRes = await fetch(`${API_BASE}/campaign-contacts?id=${contactId}`, {
                method: 'DELETE'
            });
            
            const deleteData = await deleteRes.json();
            console.log(`Status: ${deleteRes.status}`);
            console.log(`Response:`, deleteData);
            
            if (!deleteRes.ok) {
                console.error('❌ Failed to delete contact');
                return;
            }
            console.log('✅ Contact deleted successfully');
        }
        
        console.log('\n✨ All tests passed! Campaign feature is working end-to-end.');
        
    } catch (error) {
        console.error('\n❌ Error during testing:', error.message);
        console.error(error);
    }
}

// Run the tests
testCampaignAPI();
