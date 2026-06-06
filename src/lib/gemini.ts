/**
 * Gemini AI client helper
 * Uses Google Generative AI REST API directly (no SDK dependency needed for React Native)
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
// gemini-2.5-flash: fast, capable, and available on this API key
const DEFAULT_MODEL = 'gemini-2.5-flash';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiResponse {
  text: string;
  raw?: unknown;
}

/**
 * Send a single prompt to Gemini and get a text response
 */
export async function askGemini(
  prompt: string,
  systemInstruction?: string,
): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Check EXPO_PUBLIC_GEMINI_API_KEY in .env');
  }

  const url = `${GEMINI_BASE_URL}/models/${DEFAULT_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      `Gemini API error ${res.status}: ${(errData as { error?: { message?: string } }).error?.message ?? 'Unknown error'}`,
    );
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  return { text, raw: data };
}

/**
 * Multi-turn conversation with Gemini
 */
export async function chatWithGemini(
  messages: GeminiMessage[],
  systemInstruction?: string,
): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Check EXPO_PUBLIC_GEMINI_API_KEY in .env');
  }

  const url = `${GEMINI_BASE_URL}/models/${DEFAULT_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body: Record<string, unknown> = {
    contents: messages,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      `Gemini API error ${res.status}: ${(errData as { error?: { message?: string } }).error?.message ?? 'Unknown error'}`,
    );
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  return { text, raw: data };
}

/**
 * Nexus-specific AI prompts
 */
export const NexusAI = {
  /**
   * Parse a natural language sentence into a structured task
   */
  parseTask: (input: string) =>
    askGemini(
      `Extract task details from this text and return a JSON object with fields: title, description, dueAt (ISO date or null), priority (none|low|medium|high), tags (array of strings), repeatType (none|daily|weekly|monthly|custom).
      
Input: "${input}"

Return ONLY valid JSON, no markdown, no explanation.`,
    ),

  /**
   * Summarize a note
   */
  summarizeNote: (content: string) =>
    askGemini(
      `Summarize this note in 2-3 concise bullet points. Keep it actionable and clear.

Note:
${content}`,
    ),

  /**
   * Build a daily plan from a list of tasks
   */
  buildDailyPlan: (tasks: { title: string; priority: string; dueAt: string | null }[]) =>
    askGemini(
      `Create a realistic daily plan from these open tasks. Group them by time of day (Morning / Afternoon / Evening). Prioritize by urgency and importance. Be concise.

Tasks:
${tasks.map((t, i) => `${i + 1}. [${t.priority}] ${t.title}${t.dueAt ? ` (due: ${t.dueAt})` : ''}`).join('\n')}`,
    ),

  /**
   * Suggest tags for a note
   */
  suggestTags: (title: string, content: string) =>
    askGemini(
      `Suggest 3-5 relevant tags for this note. Return ONLY a JSON array of lowercase strings, no explanation.

Title: ${title}
Content: ${content.slice(0, 500)}`,
    ),

  /**
   * Clean up and rewrite a messy note
   */
  cleanNote: (content: string) =>
    askGemini(
      `Rewrite this note in a clean, structured format. Use clear headings, bullet points where appropriate, and fix any grammar issues. Keep the same information but make it more readable.

${content}`,
    ),
};
