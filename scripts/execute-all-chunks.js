/**
 * Execute all SQL chunks via Supabase REST API
 * Uses service role key from MCP connection
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://tmxgwtouhfzaqljeqzbr.supabase.co';
// Service role key - needed for bypassing RLS
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable required');
  console.log('Get it from: https://supabase.com/dashboard/project/tmxgwtouhfzaqljeqzbr/settings/api');
  process.exit(1);
}

const sqlDir = path.join(__dirname, 'sql-50');
const files = fs.readdirSync(sqlDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Found ${files.length} SQL files to execute`);

// Skip first 4 chunks (already executed)
const startFrom = 4;
const filesToExecute = files.slice(startFrom);
console.log(`Skipping first ${startFrom} chunks (already executed)`);
console.log(`Executing ${filesToExecute.length} chunks...`);

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: 'tmxgwtouhfzaqljeqzbr.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function executeViaPostgrest(sql) {
  // Use raw SQL via PostgREST - won't work without exec_sql function
  // Alternative: Use postgres connection directly
  return new Promise((resolve, reject) => {
    // For now, just log that we need to use MCP
    reject(new Error('Direct SQL execution requires MCP or psql'));
  });
}

async function main() {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < filesToExecute.length; i++) {
    const file = filesToExecute[i];
    const filePath = path.join(sqlDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`[${i + 1}/${filesToExecute.length}] Executing ${file}...`);

    try {
      // This would work if exec_sql function exists
      await executeSql(sql);
      successCount++;
      console.log(`  ✓ Success`);
    } catch (err) {
      // Expected error - need to use MCP instead
      console.log(`  ⚠ Need MCP: ${err.message.substring(0, 50)}`);
      errorCount++;
    }
  }

  console.log(`\nDone: ${successCount} success, ${errorCount} need MCP`);
}

main().catch(console.error);
