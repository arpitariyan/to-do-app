const { Client, Databases, Storage } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);
const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '6a23d5780028823d2638';
const BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || '6a23d5de00148b47dc5c';
const COLLECTION_ID = 'tasks';

async function createAttributes() {
    console.log('Adding new columns to Appwrite...');

    const attributes = [
        { type: 'string', key: 'taskType', size: 100, required: false },
        { type: 'string', key: 'repeatType', size: 100, required: false },
        { type: 'string', key: 'tags', size: 100, required: false, array: true },
        { type: 'datetime', key: 'startTime', required: false },
        { type: 'datetime', key: 'endTime', required: false },
        { type: 'integer', key: 'durationMinutes', required: false },
        { type: 'string', key: 'subtasks', size: 5000, required: false, array: true },
        { type: 'string', key: 'reminders', size: 1000, required: false, array: true },
        { type: 'string', key: 'attachments', size: 1000, required: false, array: true },
        { type: 'string', key: 'notes', size: 5000, required: false },
        { type: 'string', key: 'location', size: 255, required: false },
        { type: 'string', key: 'projectId', size: 100, required: false },
        { type: 'integer', key: 'progress', required: false, min: 0, max: 100 }
    ];

    for (const attr of attributes) {
        try {
            console.log(`Creating ${attr.key}...`);
            if (attr.type === 'string') {
                await databases.createStringAttribute(DB_ID, COLLECTION_ID, attr.key, attr.size, attr.required, undefined, attr.array);
            } else if (attr.type === 'datetime') {
                await databases.createDatetimeAttribute(DB_ID, COLLECTION_ID, attr.key, attr.required);
            } else if (attr.type === 'integer') {
                // Min/Max are only valid if specified, else undefined. For progress we have min max.
                if (attr.key === 'progress') {
                    await databases.createIntegerAttribute(DB_ID, COLLECTION_ID, attr.key, attr.required, attr.min, attr.max);
                } else {
                    await databases.createIntegerAttribute(DB_ID, COLLECTION_ID, attr.key, attr.required);
                }
            }
            console.log(`✅ Success: ${attr.key}`);
            // Small delay to prevent API rate limiting
            await new Promise(r => setTimeout(r, 500));
        } catch (error) {
            if (error.code === 409) {
                console.log(`⚠️ Skipped: ${attr.key} already exists.`);
            } else {
                console.error(`❌ Error creating ${attr.key}:`, error.message);
            }
        }
    }
    console.log('Finished updating Appwrite schema!');

    console.log('Setting up Appwrite Storage Bucket...');
    try {
        await storage.createBucket(
            BUCKET_ID,
            'Task Attachments',
            ['any'], // permissions: empty implies standard rules, 'any' is open for now (or role:users)
            false,
            false,
            10485760, // 10MB
            [] // all file types allowed
        );
        console.log('✅ Success: Created Task Attachments bucket.');
    } catch (error) {
        if (error.code === 409) {
            console.log('⚠️ Skipped: Bucket already exists.');
        } else {
            console.error('❌ Error creating bucket:', error.message);
        }
    }
}

createAttributes();
