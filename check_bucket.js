const { Client, Storage } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);
const BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || '6a23d5de00148b47dc5c';

async function check() {
    try {
        const b = await storage.getBucket(BUCKET_ID);
        console.log("Bucket permissions:", b.$permissions);
    } catch (error) {
        console.error(error);
    }
}
check();
