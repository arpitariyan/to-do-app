const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '6a23d5780028823d2638';
const COLLECTION_ID = 'notes'; // Updating the notes collection

async function createNoteAttributes() {
    console.log('Adding new columns to Appwrite notes collection...');

    const attributes = [
        { type: 'boolean', key: 'pinned', required: false, default: false },
        { type: 'string', key: 'tags', size: 100, required: false, array: true },
        { type: 'string', key: 'folderId', size: 100, required: false },
        { type: 'string', key: 'color', size: 50, required: false },
        { type: 'string', key: 'attachments', size: 1000, required: false, array: true },
    ];

    for (const attr of attributes) {
        try {
            console.log(`Creating ${attr.key}...`);
            if (attr.type === 'string') {
                await databases.createStringAttribute(DB_ID, COLLECTION_ID, attr.key, attr.size, attr.required, undefined, attr.array);
            } else if (attr.type === 'boolean') {
                await databases.createBooleanAttribute(DB_ID, COLLECTION_ID, attr.key, attr.required, attr.default);
            }
            console.log(`✅ Success: ${attr.key}`);
            await new Promise(r => setTimeout(r, 500));
        } catch (error) {
            if (error.code === 409) {
                console.log(`⚠️ Skipped: ${attr.key} already exists.`);
            } else {
                console.error(`❌ Error creating ${attr.key}:`, error.message);
            }
        }
    }
    console.log('Finished updating Appwrite notes schema!');
}

createNoteAttributes();
