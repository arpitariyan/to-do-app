require('dotenv').config();
const { Client, Databases, Permission, Role } = require('node-appwrite');

async function main() {
  const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const dbId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;

  if (!dbId) {
    console.error('Missing EXPO_PUBLIC_APPWRITE_DATABASE_ID in .env');
    process.exit(1);
  }

  const permissions = [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ];

  console.log('--- Setting up AI Collections ---');

  const wait = (ms) => new Promise(res => setTimeout(res, ms));

  async function checkAttributes(collectionId) {
    console.log(`Waiting for attributes in ${collectionId}...`);
    while (true) {
      const attrs = await databases.listAttributes(dbId, collectionId);
      const allAvailable = attrs.attributes.every(a => a.status === 'available');
      if (allAvailable && attrs.attributes.length > 0) {
        console.log(`All attributes in ${collectionId} are available!`);
        break;
      }
      await wait(1000);
    }
  }

  // 1. ai_conversations
  try {
    console.log('\nDeleting old ai_conversations if exists...');
    try { await databases.deleteCollection(dbId, 'ai_conversations'); } catch(e) {}
    console.log('Creating ai_conversations...');
    await databases.createCollection(dbId, 'ai_conversations', 'ai_conversations', permissions);
    console.log('Created ai_conversations collection');

    await databases.createStringAttribute(dbId, 'ai_conversations', 'userId', 255, true);
    await databases.createStringAttribute(dbId, 'ai_conversations', 'title', 500, true);
    await databases.createBooleanAttribute(dbId, 'ai_conversations', 'pinned', false, false);
    await databases.createStringAttribute(dbId, 'ai_conversations', 'lastMessageAt', 100, true);
    await databases.createStringAttribute(dbId, 'ai_conversations', 'createdAt', 100, true);
    
    await checkAttributes('ai_conversations');
  } catch (err) {
    console.error('Error with ai_conversations:', err.message);
  }

  // 2. ai_messages
  try {
    console.log('\nDeleting old ai_messages if exists...');
    try { await databases.deleteCollection(dbId, 'ai_messages'); } catch(e) {}
    console.log('Creating ai_messages...');
    await databases.createCollection(dbId, 'ai_messages', 'ai_messages', permissions);
    console.log('Created ai_messages collection');

    await databases.createStringAttribute(dbId, 'ai_messages', 'conversationId', 255, true);
    await databases.createStringAttribute(dbId, 'ai_messages', 'userId', 255, true);
    await databases.createStringAttribute(dbId, 'ai_messages', 'role', 50, true);
    await databases.createStringAttribute(dbId, 'ai_messages', 'content', 16384, true);
    await databases.createStringAttribute(dbId, 'ai_messages', 'actionType', 100, false);
    await databases.createStringAttribute(dbId, 'ai_messages', 'actionResult', 4096, false);
    await databases.createStringAttribute(dbId, 'ai_messages', 'createdAt', 100, true);
    
    await checkAttributes('ai_messages');
  } catch (err) {
    console.error('Error with ai_messages:', err.message);
  }

  console.log('\n✅ Setup script complete! (Wait a few seconds for Appwrite to process attributes)');
}

main().catch(console.error);
