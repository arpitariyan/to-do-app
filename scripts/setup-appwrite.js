const { Client, Databases, Permission, Role, IndexType } = require('node-appwrite');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function waitForAttribute(collectionId, key) {
  let isAvailable = false;
  let attempts = 0;
  while (!isAvailable && attempts < 20) {
    try {
      const attr = await databases.getAttribute(DB_ID, collectionId, key);
      if (attr.status === 'available') {
        isAvailable = true;
      } else {
        await delay(500);
      }
    } catch (error) {
      await delay(500);
    }
    attempts++;
  }
}

async function createDatabaseSetup() {
  console.log('Starting Database Setup...');

  const collections = [
    {
      id: 'tasks',
      name: 'Tasks',
      attributes: [
        { type: 'string', key: 'title', size: 255, required: true },
        { type: 'string', key: 'description', size: 5000, required: false },
        { type: 'string', key: 'status', size: 50, required: true },
        { type: 'string', key: 'priority', size: 50, required: true },
        { type: 'datetime', key: 'dueAt', required: false },
        { type: 'string', key: 'repeatType', size: 50, required: false },
        { type: 'string', key: 'repeatConfig', size: 255, required: false },
        { type: 'string', key: 'categoryId', size: 50, required: false },
        { type: 'boolean', key: 'pinned', required: false, default: false },
        { type: 'boolean', key: 'archived', required: false, default: false },
        { type: 'string', key: 'userId', size: 50, required: true },
        { type: 'datetime', key: 'createdAt', required: true },
        { type: 'datetime', key: 'updatedAt', required: true },
      ],
      indexes: [
        { key: 'idx_userId', type: 'key', attributes: ['userId'] },
        { key: 'idx_status', type: 'key', attributes: ['status'] },
        { key: 'idx_dueAt', type: 'key', attributes: ['dueAt'] },
        { key: 'idx_archived', type: 'key', attributes: ['archived'] },
        { key: 'idx_pinned', type: 'key', attributes: ['pinned'] },
        { key: 'idx_createdAt', type: 'key', attributes: ['createdAt'] },
      ]
    },
    {
      id: 'notes',
      name: 'Notes',
      attributes: [
        { type: 'string', key: 'title', size: 255, required: false },
        { type: 'string', key: 'content', size: 50000, required: false },
        { type: 'string', key: 'folderId', size: 50, required: false },
        { type: 'boolean', key: 'isFavorite', required: false, default: false },
        { type: 'string', key: 'userId', size: 50, required: true },
        { type: 'datetime', key: 'createdAt', required: true },
        { type: 'datetime', key: 'updatedAt', required: true },
      ],
      indexes: [
        { key: 'idx_userId', type: 'key', attributes: ['userId'] },
        { key: 'idx_folderId', type: 'key', attributes: ['folderId'] },
        { key: 'idx_updatedAt', type: 'key', attributes: ['updatedAt'] },
      ]
    },
    {
      id: 'folders',
      name: 'Folders',
      attributes: [
        { type: 'string', key: 'name', size: 255, required: true },
        { type: 'string', key: 'color', size: 50, required: false },
        { type: 'string', key: 'icon', size: 50, required: false },
        { type: 'string', key: 'userId', size: 50, required: true },
        { type: 'datetime', key: 'createdAt', required: true },
        { type: 'datetime', key: 'updatedAt', required: true },
      ],
      indexes: [
        { key: 'idx_userId', type: 'key', attributes: ['userId'] },
      ]
    }
  ];

  for (const col of collections) {
    console.log(`\nProcessing Collection: ${col.name}`);
    try {
      await databases.getCollection(DB_ID, col.id);
      console.log(`Collection ${col.id} already exists.`);
    } catch (e) {
      if (e.code === 404) {
        await databases.createCollection(DB_ID, col.id, col.name, [
          Permission.create(Role.users()),
          Permission.read(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users()),
        ], true); // true = document security enabled
        console.log(`Created collection: ${col.id}`);
      } else {
        console.error(e);
        throw e;
      }
    }

    console.log('Checking attributes...');
    for (const attr of col.attributes) {
      try {
        await databases.getAttribute(DB_ID, col.id, attr.key);
      } catch (e) {
        if (e.code === 404) {
          console.log(`Creating attribute ${attr.key}...`);
          try {
            if (attr.type === 'string') {
              await databases.createStringAttribute(DB_ID, col.id, attr.key, attr.size, attr.required);
            } else if (attr.type === 'datetime') {
              await databases.createDatetimeAttribute(DB_ID, col.id, attr.key, attr.required);
            } else if (attr.type === 'boolean') {
              await databases.createBooleanAttribute(DB_ID, col.id, attr.key, attr.required, attr.default);
            }
            await waitForAttribute(col.id, attr.key);
          } catch(err) {
            console.error(`Failed to create attr ${attr.key}:`, err.message);
          }
        } else {
          console.error(`Error checking attribute ${attr.key}:`, e.message);
        }
      }
    }

    console.log('Checking indexes...');
    for (const idx of col.indexes) {
      try {
        await databases.getIndex(DB_ID, col.id, idx.key);
      } catch (e) {
        if (e.code === 404) {
          console.log(`Creating index ${idx.key}...`);
          try {
            await databases.createIndex(DB_ID, col.id, idx.key, idx.type, idx.attributes);
          } catch(err) {
            console.error(`Failed to create index ${idx.key}:`, err.message);
          }
        } else {
          console.error(`Error checking index ${idx.key}:`, e.message);
        }
      }
    }
  }

  console.log('\n✅ Database Setup Complete!');
}

createDatabaseSetup().catch(console.error);
