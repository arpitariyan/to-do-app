import { databases, DB_ID, COLLECTIONS, ID, Query } from '../appwrite';
import { useAuthStore } from '../../stores/authStore';

export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived' | 'delayed' | 'cancelled';
export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom' | 'weekday';
export type TaskType = 'one_time' | 'recurring' | 'deadline' | 'reminder_only' | 'checklist';

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
  
  // Advanced features
  taskType?: TaskType;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  tags?: string[];
  subtasks?: string[]; // JSON string array
  reminders?: string[];
  attachments?: string[];
  notes?: string;
  location?: string;
  projectId?: string;
  progress?: number;

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
  taskType?: TaskType;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  tags?: string[];
  subtasks?: string[];
  reminders?: string[];
  attachments?: string[];
  notes?: string;
  location?: string;
  projectId?: string;
  progress?: number;
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
    taskType: payload.taskType || 'one_time',
    startTime: payload.startTime || null,
    endTime: payload.endTime || null,
    durationMinutes: payload.durationMinutes || null,
    tags: payload.tags || [],
    subtasks: payload.subtasks || [],
    reminders: payload.reminders || [],
    attachments: payload.attachments || [],
    notes: payload.notes || null,
    location: payload.location || null,
    projectId: payload.projectId || null,
    progress: payload.progress || 0,
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
  
  if (payload.taskType !== undefined) data.taskType = payload.taskType;
  if (payload.startTime !== undefined) data.startTime = payload.startTime;
  if (payload.endTime !== undefined) data.endTime = payload.endTime;
  if (payload.durationMinutes !== undefined) data.durationMinutes = payload.durationMinutes;
  if (payload.tags !== undefined) data.tags = payload.tags;
  if (payload.subtasks !== undefined) data.subtasks = payload.subtasks;
  if (payload.reminders !== undefined) data.reminders = payload.reminders;
  if (payload.attachments !== undefined) data.attachments = payload.attachments;
  if (payload.notes !== undefined) data.notes = payload.notes;
  if (payload.location !== undefined) data.location = payload.location;
  if (payload.projectId !== undefined) data.projectId = payload.projectId;
  if (payload.progress !== undefined) data.progress = payload.progress;

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
