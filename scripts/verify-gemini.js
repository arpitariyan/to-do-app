/**
 * Gemini API Connection Verification
 * Run: node scripts/verify-gemini.js
 * Uses gemini-1.5-flash (higher free tier quota)
 */

const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
}

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

async function verify() {
  console.log('\n🤖 Gemini API Verification\n');
  console.log(`  API Key : ${API_KEY ? API_KEY.slice(0, 20) + '...' : '❌ MISSING'}\n`);

  if (!API_KEY) {
    console.log('  ❌ EXPO_PUBLIC_GEMINI_API_KEY not set in .env\n');
    return;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Say "Nexus AI is connected!" in exactly 5 words.' }] }],
        generationConfig: { maxOutputTokens: 50 },
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    console.log(`  ✅ Gemini API Connected`);
    console.log(`  → Response: "${text.trim()}"\n`);
    console.log('  🎉 Gemini AI is ready to use!\n');
  } catch (err) {
    console.log(`  ❌ Gemini API Failed`);
    console.log(`  → ${err.message}\n`);
  }
}

verify().catch(console.error);
