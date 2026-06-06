import { databases, DB_ID, COLLECTIONS, ID, Query } from '../appwrite';
import { useAuthStore } from '../../stores/authStore';

export type TaskPriority = 'none' | 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived';
export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Task {
  $id: string;
  userId: string;
  title: string;
  description?: string;
  dueAt?: string;
  priority: TaskPriority;
  status: TaskStatus;
  repeatType: RepeatType;
  repeatConfig?: string;
  categoryId?: string;
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  dueAt?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  repeatType?: RepeatType;
  repeatConfig?: string;
  categoryId?: string;
  pinned?: boolean;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  archived?: boolean;
}

/**
 * Fetch tasks for the current user.
 */
export async function getTasks(filters?: { status?: TaskStatus; archived?: boolean }) {
  const userId = useAuthStore.getState().user?.$id;
  if (!userId) throw new Error('User not authenticated');

  const queries = [Query.equal('userId', userId)];

  if (filters?.status) {
    queries.push(Query.equal('status', filters.status));
  }
  
  if (filters?.archived !== undefined) {
    queries.push(Query.equal('archived', filters.archived));
  } else {
    // By default, don't show archived tasks
    queries.push(Query.equal('archived', false));
  }

  // Sort by pinned first, then due date, then created date
  queries.push(Query.orderDesc('pinned'));
  queries.push(Query.orderAsc('dueAt'));
  queries.push(Query.orderDesc('createdAt'));
  queries.push(Query.limit(100)); // Standard limit for now

  const response = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.TASKS,
    queries
  );

  return response.documents as unknown as Task[];
}

/**
 * Create a new task.
 */
export async function createTask(payload: CreateTaskPayload) {
  const userId = useAuthStore.getState().user?.$id;
  if (!userId) throw new Error('User not authenticated');

  const now = new Date().toISOString();

  const data = {
    userId,
    title: payload.title,
    description: payload.description || null,
    dueAt: payload.dueAt || null,
    priority: payload.priority || 'none',
    status: payload.status || 'todo',
    repeatType: payload.repeatType || 'none',
    repeatConfig: payload.repeatConfig || null,
    categoryId: payload.categoryId || null,
    pinned: payload.pinned || false,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };

  const response = await databases.createDocument(
    DB_ID,
    COLLECTIONS.TASKS,
    ID.unique(),
    data
  );

  return response as unknown as Task;
}

/**
 * Update an existing task.
 */
export async function updateTask(id: string, payload: UpdateTaskPayload) {
  const now = new Date().toISOString();
  
  // Clean up undefined properties to not overwrite existing values with nulls accidentally
  const data: any = { updatedAt: now };
  if (payload.title !== undefined) data.title = payload.title;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.dueAt !== undefined) data.dueAt = payload.dueAt;
  if (payload.priority !== undefined) data.priority = payload.priority;
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.repeatType !== undefined) data.repeatType = payload.repeatType;
  if (payload.repeatConfig !== undefined) data.repeatConfig = payload.repeatConfig;
  if (payload.categoryId !== undefined) data.categoryId = payload.categoryId;
  if (payload.pinned !== undefined) data.pinned = payload.pinned;
  if (payload.archived !== undefined) data.archived = payload.archived;

  const response = await databases.updateDocument(
    DB_ID,
    COLLECTIONS.TASKS,
    id,
    data
  );

  return response as unknown as Task;
}

/**
 * Delete a task entirely.
 */
export async function deleteTask(id: string) {
  await databases.deleteDocument(DB_ID, COLLECTIONS.TASKS, id);
  return true;
}
