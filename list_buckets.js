const { Client, Storage } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);

async function listBuckets() {
    try {
        const response = await storage.listBuckets();
        console.log('Buckets:', response.buckets.map(b => ({ id: b.$id, name: b.name })));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listBuckets();
