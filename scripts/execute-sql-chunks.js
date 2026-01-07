/**
 * This script outputs SQL chunks for manual execution via MCP
 * Each chunk will be printed to stdout
 */

const fs = require('fs');
const path = require('path');

const chunksDir = path.join(__dirname, 'sql-chunks');
const files = fs.readdirSync(chunksDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Found ${files.length} SQL chunks to execute`);

// Output first chunk for testing
const firstChunk = fs.readFileSync(path.join(chunksDir, files[0]), 'utf-8');
console.log('\n=== First chunk preview ===');
console.log(firstChunk.substring(0, 500) + '...');
