/**
 * Execute SQL chunks via Supabase Management API
 * This script requires SUPABASE_ACCESS_TOKEN environment variable
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_REF = 'tmxgwtouhfzaqljeqzbr';
const chunksDir = path.join(__dirname, 'sql-chunks');

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const files = fs.readdirSync(chunksDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} SQL chunks`);

  // Output each chunk for manual execution
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const content = fs.readFileSync(path.join(chunksDir, file), 'utf-8');
    console.log(`\n${'='.repeat(60)}`);
    console.log(`CHUNK ${i + 1}/${files.length}: ${file}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Size: ${content.length} bytes`);

    // Count VALUES rows
    const matches = content.match(/\),$/gm);
    const rowCount = matches ? matches.length + 1 : 1;
    console.log(`Rows: ~${rowCount}`);
  }
}

main().catch(console.error);
