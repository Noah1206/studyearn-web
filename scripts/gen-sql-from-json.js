/**
 * Generate SQL INSERT statements from schools-with-coords.json
 * Creates chunks of 50 schools each for easier execution
 */

const fs = require('fs');
const path = require('path');

const schoolsPath = path.join(__dirname, 'schools-with-coords.json');
const outputDir = path.join(__dirname, 'sql-50');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read schools data
const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf-8'));
console.log(`Total NEIS schools: ${schools.length}`);

const CHUNK_SIZE = 50;
const chunks = [];

for (let i = 0; i < schools.length; i += CHUNK_SIZE) {
  chunks.push(schools.slice(i, i + CHUNK_SIZE));
}

console.log(`Generated ${chunks.length} chunks of ${CHUNK_SIZE} schools each`);

// Generate SQL for each chunk
chunks.forEach((chunk, index) => {
  const values = chunk.map(school => {
    const name = school.name.replace(/'/g, "''");
    const type = school.type;
    const region = school.region ? `'${school.region.replace(/'/g, "''")}'` : 'NULL';
    const district = school.district ? `'${school.district.replace(/'/g, "''")}'` : 'NULL';
    const address = school.address ? `'${school.address.replace(/'/g, "''")}'` : 'NULL';
    const lat = school.latitude;
    const lng = school.longitude;
    const neisCode = school.sd_schul_code ? `'${school.sd_schul_code}'` : 'NULL';
    const eduOfficeCode = school.atpt_ofcdc_sc_code ? `'${school.atpt_ofcdc_sc_code}'` : 'NULL';
    const hsType = school.high_school_type && school.high_school_type.trim() ? `'${school.high_school_type.trim()}'` : 'NULL';
    const foundationType = school.foundation_type ? `'${school.foundation_type}'` : 'NULL';
    const coeduType = school.coedu_type ? `'${school.coedu_type}'` : 'NULL';

    return `('${name}', NULL, '${type}', ${region}, ${district}, ${address}, ${lat}, ${lng}, ${neisCode}, ${eduOfficeCode}, ${hsType}, ${foundationType}, ${coeduType}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))`;
  });

  const sql = `INSERT INTO schools (name, short_name, type, region, district, address, latitude, longitude, neis_code, edu_office_code, high_school_type, foundation_type, coedu_type, location)
VALUES
${values.join(',\n')};`;

  const filename = `chunk_${String(index).padStart(3, '0')}.sql`;
  fs.writeFileSync(path.join(outputDir, filename), sql);
});

console.log(`\nSQL chunks saved to: ${outputDir}`);
console.log(`Total files: ${chunks.length}`);
