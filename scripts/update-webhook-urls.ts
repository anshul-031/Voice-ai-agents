#!/usr/bin/env tsx
/**
 * Script to update webhook URLs for all phone numbers to use the current domain
 * 
 * This script will:
 * 1. Read NEXT_PUBLIC_APP_URL from environment
 * 2. Update all phone numbers with new webhook/websocket URLs
 * 3. Preserve webhookIdentifier so URLs remain consistent
 * 
 * Usage:
 *   npm run update-webhooks
 *   or
 *   npx tsx scripts/update-webhook-urls.ts
 */

import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

// Phone Number Schema (minimal version)
interface IPhoneNumber {
    _id: mongoose.Types.ObjectId;
    phoneNumber: string;
    webhookIdentifier?: string;
    webhookUrl?: string;
    websocketUrl?: string;
    updatedAt: Date;
}

const phoneNumberSchema = new mongoose.Schema({
    userId: String,
    phoneNumber: String,
    provider: String,
    displayName: String,
    exotelConfig: mongoose.Schema.Types.Mixed,
    linkedAgentId: String,
    webhookIdentifier: String,
    webhookUrl: String,
    websocketUrl: String,
    status: String,
    lastUsed: Date,
    createdAt: Date,
    updatedAt: Date,
});

const PhoneNumber = mongoose.models.PhoneNumber || mongoose.model<IPhoneNumber>('PhoneNumber', phoneNumberSchema);

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getAppUrls = () => {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    
    if (!envUrl) {
        throw new Error('NEXT_PUBLIC_APP_URL is not set in .env.local');
    }

    const httpOrigin = stripTrailingSlash(envUrl);
    const wsOrigin = httpOrigin.startsWith('https')
        ? httpOrigin.replace(/^https/, 'wss')
        : httpOrigin.replace(/^http/, 'ws');

    return { httpOrigin, wsOrigin };
};

const extractIdentifier = (phone: any): string | null => {
    if (phone.webhookIdentifier) {
        return phone.webhookIdentifier;
    }

    const fromWebhook = phone.webhookUrl?.split('/').filter(Boolean).pop();
    if (fromWebhook) {
        return fromWebhook;
    }

    const fromWebsocket = phone.websocketUrl?.split('/').filter(Boolean).pop();
    if (fromWebsocket) {
        return fromWebsocket;
    }

    return null;
};

async function updateWebhookUrls() {
    console.log('🔄 Updating webhook URLs for all phone numbers...\n');

    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not set in .env.local');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Get current app URLs
        const { httpOrigin, wsOrigin } = getAppUrls();
        console.log('📍 Current domain configuration:');
        console.log(`   HTTP Origin: ${httpOrigin}`);
        console.log(`   WebSocket Origin: ${wsOrigin}\n`);

        // Fetch all phone numbers
        const phoneNumbers = await PhoneNumber.find({}).lean().exec();
        console.log(`📱 Found ${phoneNumbers.length} phone numbers\n`);

        if (phoneNumbers.length === 0) {
            console.log('ℹ️  No phone numbers to update');
            return;
        }

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const phone of phoneNumbers) {
            try {
                const identifier = extractIdentifier(phone);
                
                if (!identifier) {
                    console.log(`⚠️  Skipping ${phone.phoneNumber} - no identifier found`);
                    skipped++;
                    continue;
                }

                const newWebhookUrl = `${httpOrigin}/api/telephony/webhook/${identifier}`;
                const newWebsocketUrl = `${wsOrigin}/api/telephony/ws/${identifier}`;

                const updateData: any = {
                    webhookIdentifier: identifier, // Ensure identifier is saved
                    webhookUrl: newWebhookUrl,
                    websocketUrl: newWebsocketUrl,
                    updatedAt: new Date(),
                };

                await PhoneNumber.updateOne(
                    { _id: phone._id },
                    { $set: updateData }
                );

                console.log(`✅ Updated ${phone.phoneNumber}`);
                console.log(`   ID: ${identifier}`);
                console.log(`   Webhook: ${newWebhookUrl}`);
                console.log(`   WebSocket: ${newWebsocketUrl}\n`);

                updated++;
            } catch (error) {
                console.error(`❌ Error updating ${phone.phoneNumber}:`, error);
                errors++;
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   ✅ Updated: ${updated}`);
        console.log(`   ⚠️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log(`   📱 Total: ${phoneNumbers.length}`);

        console.log('\n🎉 Done! All webhook URLs have been updated.');
        console.log('\n💡 Next steps:');
        console.log('   1. Update Exotel Dashboard with new webhook URLs');
        console.log('   2. Test by calling your phone number');
        console.log('   3. Check logs for incoming requests\n');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

// Run the script
updateWebhookUrls()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
