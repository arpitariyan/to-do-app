import { getTasks, createTask, updateTask, deleteTask, Task } from '../api/tasks';
import { getNotes, createNote, updateNote, deleteNote, Note } from '../api/notes';
import { queryClient } from '../queryClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionType =
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'COMPLETE_TASK'
  | 'READ_TASKS'
  | 'CREATE_NOTE'
  | 'UPDATE_NOTE'
  | 'DELETE_NOTE'
  | 'READ_NOTES'
  | 'NONE';

export interface AIAction {
  type: ActionType;
  targetId?: string;       // existing task/note ID
  payload?: Record<string, any>;
  searchQuery?: string;    // for finding a task/note by title
}

export interface AIIntentResult {
  intent: ActionType;
  reply: string;           // human-readable AI response
  action: AIAction | null;
  actionResult?: any;      // what was actually created/changed
  error?: string;
}

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Groq Config ──────────────────────────────────────────────────────────────

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ─── Gemini Fallback Config ───────────────────────────────────────────────────
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ─── Helper: find task/note by partial title ─────────────────────────────────

function findTaskByTitle(tasks: Task[], query: string): Task | undefined {
  const q = query.toLowerCase();
  return tasks.find((t) => t.title.toLowerCase().includes(q));
}

function findNoteByTitle(notes: Note[], query: string): Note | undefined {
  const q = query.toLowerCase();
  return notes.find((n) => (n.title || '').toLowerCase().includes(q));
}

// ─── Main Intent Processor ───────────────────────────────────────────────────

export async function processMessage(
  userMessage: string,
  conversationHistory: HistoryMessage[]
): Promise<AIIntentResult> {
  const apiKeys = [
    process.env.EXPO_PUBLIC_GROQ_API_KEY,
    process.env.EXPO_PUBLIC_GROQ_API_KEY_2,
    process.env.EXPO_PUBLIC_GROQ_API_KEY_3,
  ].filter((key): key is string => Boolean(key));

  if (apiKeys.length === 0) {
    return { intent: 'NONE', reply: 'Groq API keys are not configured.', action: null };
  }

  // Fetch current context
  let tasks: Task[] = [];
  let notes: Note[] = [];
  try {
    [tasks, notes] = await Promise.all([getTasks(), getNotes()]);
  } catch (_) {}

  const tasksSummary = tasks
    .slice(0, 30)
    .map((t) => `- [${t.$id}] "${t.title}" status=${t.status} priority=${t.priority} due=${t.dueAt ?? 'none'}`)
    .join('\n') || '(no tasks)';

  const notesSummary = notes
    .slice(0, 20)
    .map((n) => `- [${n.$id}] "${n.title ?? 'Untitled'}"\n  Content Snippet: ${(n.content ?? '').slice(0, 1500)}...`)
    .join('\n\n') || '(no notes)';

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const systemPrompt = `You are an AI productivity assistant built into a mobile app.
You help users manage their tasks and notes through natural language.
Today is: ${today}

Current user TASKS:
${tasksSummary}

Current user NOTES:
${notesSummary}

You MUST respond with valid JSON only — no markdown, no code fences, just raw JSON.
The JSON must have this exact shape:
{
  "intent": "<ACTION_TYPE>",
  "reply": "<friendly human response explaining what you did or are about to do>",
  "action": {
    "type": "<ACTION_TYPE>",
    "targetId": "<existing $id if updating/deleting/completing>",
    "searchQuery": "<partial title to find the item, if no direct ID>",
    "payload": { <fields to create or update> }
  }
}

Valid ACTION_TYPE values:
- CREATE_TASK — create a new task (payload: title, dueAt ISO string, priority, repeatType, startTime, description)
- UPDATE_TASK — update an existing task (targetId or searchQuery required, payload: fields to change)
- DELETE_TASK — delete a task (targetId or searchQuery required)
- COMPLETE_TASK — mark a task as done (targetId or searchQuery required)
- READ_TASKS — user wants to see their tasks (action can be null)
- CREATE_NOTE — create a new note (payload: title, content as plain text)
- UPDATE_NOTE — update a note (targetId or searchQuery required, payload: title or content)
- DELETE_NOTE — delete a note (targetId or searchQuery required)
- READ_NOTES — user wants to see their notes (action can be null)
- NONE — general conversation, no database action needed (action must be null)

For dates/times: convert relative expressions like "tomorrow", "next Monday", "at 7am" to ISO 8601 strings based on today's date.
For priority: use one of: none, low, medium, high, urgent.
For repeatType: use one of: none, daily, weekly, monthly.
For status: use one of: todo, in_progress, done.

CRITICAL INSTRUCTION FOR TASK CREATION (CONVERSATIONAL FLOW):
1. If the user asks to create a task (e.g. "remind me to wake up tomorrow") but omits important details (like exactly what time, priority, repeatType, or subtitle/description), DO NOT use CREATE_TASK immediately.
2. Instead, use intent "NONE" and reply by asking the user a friendly follow-up question to gather those missing details (e.g. "What time should I set this for? And what priority?").
3. Give the user the option to skip ("You can provide these details, skip them, or just tell me to autofill it for you").
4. ONLY use CREATE_TASK when you have collected enough details, or if the user explicitly says "just create it", "skip", or "autofill it". If autofill is requested, use your best judgment to fill the missing fields intelligently.

CRITICAL INSTRUCTION FOR NOTE CREATION & MANAGEMENT:
1. If the user asks to create a note, you can also ask follow-up questions to gather more content before saving it, if their prompt was too brief.
2. If the user asks you to explain something, write about a topic, or asks for details in a Note/Task, YOU MUST WRITE EXTREMELY DETAILED, LONG-FORM, COMPREHENSIVE CONTENT in the "content" or "description" field. 
3. IMPORTANT FORMATTING RULE: For Notes ("content" field), you MUST use valid HTML tags (like <h1>, <h2>, <strong>, <em>, <ul>, <li>, <p>, <br>) instead of Markdown, because the app uses an HTML Rich Text Editor. Do not use asterisks or hashes for formatting in notes.
4. For Tasks ("description" field), use standard plain text or Markdown.
5. If the user asks to UPDATE a note with new details, DO NOT just append a small sentence. Rewrite the entire note content incorporating the massive level of detail they asked for, structuring it nicely with HTML.

CRITICAL INSTRUCTION FOR ANSWERING QUESTIONS:
If the user asks a question ABOUT an existing task or note (e.g., "what is written in my react note?", "explain the details of my task", "what did I write about X?"), YOU MUST READ the 'Current user TASKS/NOTES' context above and write a VERY DETAILED AND HELPFUL answer in the "reply" field. Do not just say "I read it". Actually explain what is inside the note or task to the user. Use intent "NONE" for this since no database action is needed.

IMPORTANT: Respond with ONLY the JSON object. No text before or after.`;

  // Build messages array with last 10 turns for context
  const recentHistory = conversationHistory.slice(-10);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...recentHistory,
    { role: 'user', content: userMessage },
  ];

  let data: any = null;
  let lastErrorMsg = 'Unknown error';

  for (const apiKey of apiKeys) {
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${apiKey.trim()}` 
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature: 0.3,
          max_tokens: 4096,
          response_format: { type: 'json_object' },
        }),
      });

      data = await res.json();
      if (res.ok) {
        break; // Success! Exit the retry loop.
      } else {
        lastErrorMsg = data?.error?.message ?? `HTTP ${res.status}`;
        data = null; // Reset data so we know it failed
        console.warn(`[Groq] API Key ${apiKey?.slice(0, 8)}... failed. Error: ${lastErrorMsg}`);
      }
    } catch (e) {
      lastErrorMsg = String(e);
      console.warn(`[Groq] API Key ${apiKey?.slice(0, 8)}... threw an exception. Error: ${lastErrorMsg}`);
    }
  }

  // ─── AUTOMATIC FALLBACK TO GEMINI ──────────────────────────────────────────
  if (!data) {
    console.warn(`[Fallback] All Groq keys failed. Falling back to Gemini API...`);
    const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const geminiMessages = recentHistory.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));
        geminiMessages.push({ role: 'user', parts: [{ text: userMessage }] });

        const res = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: geminiMessages,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            },
          }),
        });

        const geminiData = await res.json();
        if (res.ok) {
          const geminiRawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
          data = { choices: [{ message: { content: geminiRawText } }] };
          console.log(`[Fallback] Successfully got response from Gemini.`);
        } else {
          lastErrorMsg = `Gemini Fallback failed: ${geminiData?.error?.message ?? res.status}`;
        }
      } catch (e) {
        lastErrorMsg = `Gemini Fallback exception: ${String(e)}`;
      }
    }
  }

  if (!data) {
    return {
      intent: 'NONE',
      reply: `AI Error: All keys (including fallback) failed. Last error: ${lastErrorMsg}`,
      action: null,
      error: lastErrorMsg,
    };
  }

    const raw = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { intent: 'NONE', reply: raw, action: null };
    }

    const intent: ActionType = parsed.intent ?? 'NONE';
    const aiAction: AIAction | null = parsed.action ?? null;
    let reply: string = parsed.reply ?? 'Done!';
    let actionResult: any = null;

    // ── Execute the action ──────────────────────────────────────────────────
    if (aiAction && aiAction.type !== 'NONE') {
      try {
        switch (aiAction.type) {
          // ── TASK ACTIONS ─────────────────────────────────────────────────
          case 'CREATE_TASK': {
            const task = await createTask({
              title: aiAction.payload?.title ?? 'New Task',
              dueAt: aiAction.payload?.dueAt,
              priority: aiAction.payload?.priority,
              repeatType: aiAction.payload?.repeatType,
              startTime: aiAction.payload?.startTime,
              description: aiAction.payload?.description,
              taskType: aiAction.payload?.repeatType && aiAction.payload.repeatType !== 'none' ? 'recurring' : 'one_time',
            });
            await queryClient.invalidateQueries({ queryKey: ['tasks'] });
            actionResult = task;
            break;
          }

          case 'UPDATE_TASK': {
            let taskId = aiAction.targetId;
            if (!taskId && aiAction.searchQuery) {
              const found = findTaskByTitle(tasks, aiAction.searchQuery);
              taskId = found?.$id;
            }
            if (taskId) {
              const updated = await updateTask(taskId, aiAction.payload ?? {});
              await queryClient.invalidateQueries({ queryKey: ['tasks'] });
              actionResult = updated;
            } else {
              reply = `I couldn't find a task matching "${aiAction.searchQuery}". Please be more specific.`;
            }
            break;
          }

          case 'COMPLETE_TASK': {
            let taskId = aiAction.targetId;
            if (!taskId && aiAction.searchQuery) {
              const found = findTaskByTitle(tasks, aiAction.searchQuery);
              taskId = found?.$id;
            }
            if (taskId) {
              const updated = await updateTask(taskId, { status: 'done' });
              await queryClient.invalidateQueries({ queryKey: ['tasks'] });
              actionResult = updated;
            } else {
              reply = `I couldn't find a task matching "${aiAction.searchQuery}".`;
            }
            break;
          }

          case 'DELETE_TASK': {
            let taskId = aiAction.targetId;
            if (!taskId && aiAction.searchQuery) {
              const found = findTaskByTitle(tasks, aiAction.searchQuery);
              taskId = found?.$id;
            }
            if (taskId) {
              await deleteTask(taskId);
              await queryClient.invalidateQueries({ queryKey: ['tasks'] });
              actionResult = { deleted: true, id: taskId };
            } else {
              reply = `I couldn't find a task matching "${aiAction.searchQuery}".`;
            }
            break;
          }

          case 'READ_TASKS': {
            actionResult = tasks.slice(0, 20);
            break;
          }

          // ── NOTE ACTIONS ─────────────────────────────────────────────────
          case 'CREATE_NOTE': {
            const note = await createNote({
              title: aiAction.payload?.title ?? 'New Note',
              content: aiAction.payload?.content ?? '',
            });
            await queryClient.invalidateQueries({ queryKey: ['notes'] });
            actionResult = note;
            break;
          }

          case 'UPDATE_NOTE': {
            let noteId = aiAction.targetId;
            if (!noteId && aiAction.searchQuery) {
              const found = findNoteByTitle(notes, aiAction.searchQuery);
              noteId = found?.$id;
            }
            if (noteId) {
              const updated = await updateNote(noteId, aiAction.payload ?? {});
              await queryClient.invalidateQueries({ queryKey: ['notes'] });
              actionResult = updated;
            } else {
              reply = `I couldn't find a note matching "${aiAction.searchQuery}".`;
            }
            break;
          }

          case 'DELETE_NOTE': {
            let noteId = aiAction.targetId;
            if (!noteId && aiAction.searchQuery) {
              const found = findNoteByTitle(notes, aiAction.searchQuery);
              noteId = found?.$id;
            }
            if (noteId) {
              await deleteNote(noteId);
              await queryClient.invalidateQueries({ queryKey: ['notes'] });
              actionResult = { deleted: true, id: noteId };
            } else {
              reply = `I couldn't find a note matching "${aiAction.searchQuery}".`;
            }
            break;
          }

          case 'READ_NOTES': {
            actionResult = notes.slice(0, 20);
            break;
          }
        }
      } catch (execErr: any) {
        reply = `I understood your request but failed to execute it: ${execErr?.message ?? 'Unknown error'}`;
      }
    }

    return { intent, reply, action: aiAction, actionResult };
}
