import { Client, Account, Databases, Storage, ID, Query } from 'react-native-appwrite';

export const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? 'https://sgp.cloud.appwrite.io/v1';
export const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? '';

if (!PROJECT_ID) {
  console.warn('[Appwrite] EXPO_PUBLIC_APPWRITE_PROJECT_ID is not set. Authentication will fail.');
}

// ─── Client ───────────────────────────────────────────────────────────────────

export const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setPlatform('com.personal.nexus');

// ─── Services ─────────────────────────────────────────────────────────────────

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// ─── Database / Collection IDs ───────────────────────────────────────────────

export const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '6a23d5780028823d2638';

export const COLLECTIONS = {
  USERS_PROFILE: 'users_profile',
  TASKS: 'tasks',
  TASK_SUBTASKS: 'task_subtasks',
  TASK_ATTACHMENTS: 'task_attachments',
  NOTES: 'notes',
  NOTE_ATTACHMENTS: 'note_attachments',
  FOLDERS: 'folders',
  TAGS: 'tags',
  REMINDERS: 'reminders',
  AI_ACTIVITY_LOG: 'ai_activity_log',
  APP_SETTINGS: 'app_settings',
  AI_CONVERSATIONS: 'ai_conversations',
  AI_MESSAGES: 'ai_messages',
} as const;

export const STORAGE_BUCKETS = {
  ATTACHMENTS: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID ?? '6a23d5de00148b47dc5c',
} as const;

// ─── Re-exports (for convenience) ────────────────────────────────────────────

export { ID, Query };
