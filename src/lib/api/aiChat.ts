import { databases, DB_ID, COLLECTIONS, ID, Query } from '../appwrite';
import { useAuthStore } from '../../stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIConversation {
  $id: string;
  userId: string;
  title: string;
  pinned: boolean;
  lastMessageAt: string;
  createdAt: string;
}

export interface AIMessage {
  $id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  actionType?: string;
  actionResult?: string; // JSON string
  createdAt: string;
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function getConversations(): Promise<AIConversation[]> {
  const userId = useAuthStore.getState().user?.$id;
  if (!userId) throw new Error('Not authenticated');

  const res = await databases.listDocuments(DB_ID, COLLECTIONS.AI_CONVERSATIONS, [
    Query.equal('userId', userId),
    Query.orderDesc('pinned'),
    Query.orderDesc('lastMessageAt'),
    Query.limit(50),
  ]);
  return res.documents as unknown as AIConversation[];
}

export async function createConversation(title: string): Promise<AIConversation> {
  const userId = useAuthStore.getState().user?.$id;
  if (!userId) throw new Error('Not authenticated');

  const now = new Date().toISOString();
  const doc = await databases.createDocument(DB_ID, COLLECTIONS.AI_CONVERSATIONS, ID.unique(), {
    userId,
    title,
    pinned: false,
    lastMessageAt: now,
    createdAt: now,
  });
  return doc as unknown as AIConversation;
}

export async function renameConversation(id: string, title: string): Promise<void> {
  await databases.updateDocument(DB_ID, COLLECTIONS.AI_CONVERSATIONS, id, { title });
}

export async function pinConversation(id: string, pinned: boolean): Promise<void> {
  await databases.updateDocument(DB_ID, COLLECTIONS.AI_CONVERSATIONS, id, { pinned });
}

export async function touchConversation(id: string): Promise<void> {
  await databases.updateDocument(DB_ID, COLLECTIONS.AI_CONVERSATIONS, id, {
    lastMessageAt: new Date().toISOString(),
  });
}

export async function deleteConversation(id: string): Promise<void> {
  // Delete all messages first
  try {
    let hasMore = true;
    while (hasMore) {
      const msgs = await databases.listDocuments(DB_ID, COLLECTIONS.AI_MESSAGES, [
        Query.equal('conversationId', id),
        Query.limit(100),
      ]);
      if (msgs.documents.length === 0) {
        hasMore = false;
        break;
      }
      await Promise.all(msgs.documents.map((m) => databases.deleteDocument(DB_ID, COLLECTIONS.AI_MESSAGES, m.$id)));
    }
  } catch (error) {
    console.error('Failed to delete messages:', error);
  }
  await databases.deleteDocument(DB_ID, COLLECTIONS.AI_CONVERSATIONS, id);
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages(conversationId: string): Promise<AIMessage[]> {
  const res = await databases.listDocuments(DB_ID, COLLECTIONS.AI_MESSAGES, [
    Query.equal('conversationId', conversationId),
    Query.orderAsc('createdAt'),
    Query.limit(100),
  ]);
  return res.documents as unknown as AIMessage[];
}

export interface SaveMessagePayload {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  actionType?: string;
  actionResult?: string;
}

export async function saveMessage(payload: SaveMessagePayload): Promise<AIMessage> {
  const userId = useAuthStore.getState().user?.$id;
  if (!userId) throw new Error('Not authenticated');

  const now = new Date().toISOString();
  const doc = await databases.createDocument(DB_ID, COLLECTIONS.AI_MESSAGES, ID.unique(), {
    conversationId: payload.conversationId,
    userId,
    role: payload.role,
    content: payload.content,
    actionType: payload.actionType ?? null,
    actionResult: payload.actionResult ?? null,
    createdAt: now,
  });

  // Touch conversation to update lastMessageAt
  await touchConversation(payload.conversationId).catch(() => {});

  return doc as unknown as AIMessage;
}

export async function deleteMessage(id: string): Promise<void> {
  await databases.deleteDocument(DB_ID, COLLECTIONS.AI_MESSAGES, id);
}
