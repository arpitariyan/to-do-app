import { databases, DB_ID, COLLECTIONS, ID, Query } from '../appwrite';
import { useAuthStore } from '../../stores/authStore';

export interface Note {
  $id: string;
  userId: string;
  title?: string;
  content?: string;
  folderId?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  title?: string;
  content?: string;
  folderId?: string;
  isFavorite?: boolean;
}

export interface UpdateNotePayload extends Partial<CreateNotePayload> {}

/**
 * Fetch notes for the current user.
 */
export async function getNotes(filters?: { folderId?: string; isFavorite?: boolean }) {
  const userId = useAuthStore.getState().user?.$id;
  if (!userId) throw new Error('User not authenticated');

  const queries = [Query.equal('userId', userId)];

  if (filters?.folderId) {
    queries.push(Query.equal('folderId', filters.folderId));
  }
  
  if (filters?.isFavorite !== undefined) {
    queries.push(Query.equal('isFavorite', filters.isFavorite));
  }

  // Sort by most recently updated
  queries.push(Query.orderDesc('updatedAt'));
  queries.push(Query.limit(100)); // Standard limit

  const response = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.NOTES,
    queries
  );

  return response.documents as unknown as Note[];
}

/**
 * Create a new note.
 */
export async function createNote(payload: CreateNotePayload) {
  const userId = useAuthStore.getState().user?.$id;
  if (!userId) throw new Error('User not authenticated');

  const now = new Date().toISOString();

  const data = {
    userId,
    title: payload.title || '',
    content: payload.content || '',
    folderId: payload.folderId || null,
    isFavorite: payload.isFavorite || false,
    createdAt: now,
    updatedAt: now,
  };

  const response = await databases.createDocument(
    DB_ID,
    COLLECTIONS.NOTES,
    ID.unique(),
    data
  );

  return response as unknown as Note;
}

/**
 * Update an existing note.
 */
export async function updateNote(id: string, payload: UpdateNotePayload) {
  const now = new Date().toISOString();
  
  const data: any = { updatedAt: now };
  if (payload.title !== undefined) data.title = payload.title;
  if (payload.content !== undefined) data.content = payload.content;
  if (payload.folderId !== undefined) data.folderId = payload.folderId;
  if (payload.isFavorite !== undefined) data.isFavorite = payload.isFavorite;

  const response = await databases.updateDocument(
    DB_ID,
    COLLECTIONS.NOTES,
    id,
    data
  );

  return response as unknown as Note;
}

/**
 * Delete a note entirely.
 */
export async function deleteNote(id: string) {
  await databases.deleteDocument(DB_ID, COLLECTIONS.NOTES, id);
  return true;
}
