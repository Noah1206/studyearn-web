/**
 * Generate smaller SQL chunks (50 rows each) for easier execution
 */

const fs = require('fs');
const path = require('path');

const schoolsPath = path.join(__dirname, '..', 'src', 'data', 'schools.ts');
const outputDir = path.join(__dirname, 'sql-small-chunks');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read and parse schools data
const content = fs.readFileSync(schoolsPath, 'utf-8');
// The format is: export const SCHOOLS_DATA: SchoolData[\n  {...},...\n];
const startIdx = content.indexOf('export const SCHOOLS_DATA: SchoolData[');
const arrayStart = content.indexOf('[', startIdx);
const arrayEnd = content.lastIndexOf('];');
const arrayContent = content.substring(arrayStart, arrayEnd + 1);
if (arrayStart === -1 || arrayEnd === -1) {
  console.error('Could not find SCHOOLS_DATA');
  process.exit(1);
}

const schools = JSON.parse(arrayContent);
console.log(`Total schools: ${schools.length}`);

// Skip first 200 (already inserted as chunk_000)
const remainingSchools = schools.slice(200);
console.log(`Remaining to insert: ${remainingSchools.length}`);

const CHUNK_SIZE = 50;
const chunks = [];

for (let i = 0; i < remainingSchools.length; i += CHUNK_SIZE) {
  chunks.push(remainingSchools.slice(i, i + CHUNK_SIZE));
}

console.log(`Generated ${chunks.length} small chunks`);

// Generate SQL for each chunk
chunks.forEach((chunk, index) => {
  const values = chunk.map(school => {
    const name = school.name.replace(/'/g, "''");
    const shortName = school.short_name ? `'${school.short_name.replace(/'/g, "''")}'` : 'NULL';
    const type = school.type;
    const region = school.region ? `'${school.region.replace(/'/g, "''")}'` : 'NULL';
    const district = school.district ? `'${school.district.replace(/'/g, "''")}'` : 'NULL';
    const address = school.address ? `'${school.address.replace(/'/g, "''")}'` : 'NULL';
    const lat = school.latitude;
    const lng = school.longitude;

    // Extract neis_code and edu_office_code from id if available
    let neisCode = 'NULL';
    let eduOfficeCode = 'NULL';
    if (school.id && school.id.startsWith('school_')) {
      const parts = school.id.split('_');
      if (parts.length >= 3) {
        eduOfficeCode = `'${parts[1]}'`;
        neisCode = `'${parts[2]}'`;
      }
    }

    const hsType = school.high_school_type ? `'${school.high_school_type}'` : 'NULL';
    const foundationType = school.foundation_type ? `'${school.foundation_type}'` : 'NULL';
    const coeduType = school.coedu_type ? `'${school.coedu_type}'` : 'NULL';

    return `('${name}', ${shortName}, '${type}', ${region}, ${district}, ${address}, ${lat}, ${lng}, ${neisCode}, ${eduOfficeCode}, ${hsType}, ${foundationType}, ${coeduType}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))`;
  });

  const sql = `-- Small Chunk ${index + 1}: schools ${200 + index * CHUNK_SIZE + 1} to ${200 + index * CHUNK_SIZE + chunk.length}
INSERT INTO schools (name, short_name, type, region, district, address, latitude, longitude, neis_code, edu_office_code, high_school_type, foundation_type, coedu_type, location)
VALUES
${values.join(',\n')};`;

  const filename = `small_${String(index).padStart(3, '0')}.sql`;
  fs.writeFileSync(path.join(outputDir, filename), sql);
});

console.log(`\nSmall chunks saved to: ${outputDir}`);
console.log(`Each chunk has ~${CHUNK_SIZE} rows`);
