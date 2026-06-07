require('dotenv').config();
const { Client, Databases, Permission, Role } = require('node-appwrite');

async function main() {
  const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const dbId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;

  const permissions = [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ];

  const wait = (ms) => new Promise(res => setTimeout(res, ms));

  console.log('--- Fixing ai_messages Collection ---');

  try {
    console.log('Deleting ai_messages...');
    await databases.deleteCollection(dbId, 'ai_messages');
  } catch(e) {
    console.log('Not found or already deleted');
  }

  console.log('Waiting 5 seconds...');
  await wait(5000);

  console.log('Creating ai_messages collection...');
  await databases.createCollection(dbId, 'ai_messages', 'ai_messages', permissions);

  const attrs = [
    () => databases.createStringAttribute(dbId, 'ai_messages', 'conversationId', 255, true),
    () => databases.createStringAttribute(dbId, 'ai_messages', 'userId', 255, true),
    () => databases.createStringAttribute(dbId, 'ai_messages', 'role', 50, true),
    () => databases.createStringAttribute(dbId, 'ai_messages', 'content', 16384, true),
    () => databases.createStringAttribute(dbId, 'ai_messages', 'actionType', 100, false),
    () => databases.createStringAttribute(dbId, 'ai_messages', 'actionResult', 4096, false),
    () => databases.createStringAttribute(dbId, 'ai_messages', 'createdAt', 100, true),
  ];

  for (let i = 0; i < attrs.length; i++) {
    console.log(`Creating attribute ${i+1}/${attrs.length}...`);
    await attrs[i]();
    await wait(1000);
  }

  console.log('All attributes created. Waiting for them to become available...');

  while (true) {
    const res = await databases.listAttributes(dbId, 'ai_messages');
    const allAvailable = res.attributes.every(a => a.status === 'available');
    console.log(`Status: ${res.attributes.filter(a => a.status === 'available').length}/${res.attributes.length} available`);
    
    if (allAvailable && res.attributes.length === 7) {
      console.log('SUCCESS! All attributes are available.');
      break;
    }
    await wait(2000);
  }
}

main().catch(console.error);
