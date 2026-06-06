const { Client, Storage } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);
const BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || '6a23d5de00148b47dc5c';

async function updateBucket() {
    try {
        console.log('Enabling bucket and updating permissions...');
        await storage.updateBucket(
            BUCKET_ID,
            'Task Attachments',
            [
                'read("any")',
                'create("any")',
                'update("any")',
                'delete("any")'
            ],
            false, // fileSecurity
            true,  // enabled (MUST BE TRUE!)
            10485760, // 10MB
            []
        );
        console.log('✅ Success: Enabled bucket and updated permissions to allow any to read/create/update/delete.');
    } catch (error) {
        console.error('❌ Error updating bucket:', error);
    }
}

updateBucket();
