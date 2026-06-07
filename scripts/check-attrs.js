require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

async function main() {
  const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const dbId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;

  const convAttrs = await databases.listAttributes(dbId, 'ai_conversations');
  console.log('ai_conversations attributes:');
  convAttrs.attributes.forEach(a => console.log(` - ${a.key} (${a.type}): ${a.status}`));

  const msgAttrs = await databases.listAttributes(dbId, 'ai_messages');
  console.log('\nai_messages attributes:');
  msgAttrs.attributes.forEach(a => console.log(` - ${a.key} (${a.type}): ${a.status}`));
}

main().catch(console.error);
