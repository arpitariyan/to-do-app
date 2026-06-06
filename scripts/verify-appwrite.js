/**
 * Appwrite Connection Verification Script
 * Run with: node scripts/verify-appwrite.js
 * 
 * This checks: endpoint reachability, project auth, database existence, and storage bucket.
 */

// Load .env manually
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
}

const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

console.log('\n🔍 Appwrite Connection Verification\n');
console.log(`  Endpoint  : ${ENDPOINT}`);
console.log(`  Project   : ${PROJECT_ID}`);
console.log(`  Database  : ${DATABASE_ID}`);
console.log(`  Bucket    : ${BUCKET_ID}`);
console.log(`  API Key   : ${API_KEY ? API_KEY.slice(0, 20) + '...' : '❌ MISSING'}`);
console.log('');

async function verify() {
  const headers = {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': API_KEY,
    'Content-Type': 'application/json',
  };

  let passed = 0;
  let failed = 0;

  async function check(label, url, expectField) {
    try {
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      if (expectField && !data[expectField]) throw new Error(`Missing field: ${expectField}`);
      console.log(`  ✅ ${label}`);
      if (data.name) console.log(`     → ${data.name}`);
      passed++;
      return data;
    } catch (err) {
      console.log(`  ❌ ${label}`);
      console.log(`     → ${err.message}`);
      failed++;
      return null;
    }
  }

  // 1. Health check
  await check(
    'Appwrite Health',
    `${ENDPOINT}/health`,
    'status'
  );

  // 2. Project info
  await check(
    'Project Authentication',
    `${ENDPOINT}/projects/${PROJECT_ID}`,
    '$id'
  );

  // 3. Database
  await check(
    'Database Exists',
    `${ENDPOINT}/databases/${DATABASE_ID}`,
    '$id'
  );

  // 4. List collections
  const dbData = await check(
    'Database Collections Accessible',
    `${ENDPOINT}/databases/${DATABASE_ID}/collections?limit=5`,
    'collections'
  );
  if (dbData?.collections?.length > 0) {
    console.log(`     → Found ${dbData.total} collection(s)`);
    dbData.collections.slice(0, 5).forEach(c => console.log(`       • ${c.name} (${c.$id})`));
  }

  // 5. Storage bucket
  await check(
    'Storage Bucket Exists',
    `${ENDPOINT}/storage/buckets/${BUCKET_ID}`,
    '$id'
  );

  console.log(`\n  Result: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('  🎉 All checks passed! Appwrite is fully connected.\n');
  } else {
    console.log('  ⚠️  Some checks failed. Review errors above.\n');
    console.log('  Common fixes:');
    console.log('  • Make sure the platform "com.personal.nexus" is added in Appwrite console');
    console.log('  • Ensure API key has the required scopes');
    console.log('  • Check that collections are created in the database\n');
  }
}

verify().catch(console.error);
