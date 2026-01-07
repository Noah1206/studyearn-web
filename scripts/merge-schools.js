/**
 * Merge universities from existing schools.ts with new NEIS school data
 */

const fs = require('fs');
const path = require('path');

const existingPath = path.join(__dirname, '..', 'src', 'data', 'schools.ts');
const newSchoolsPath = path.join(__dirname, 'schools-with-coords.json');
const outputPath = existingPath;

// Read existing schools.ts
const existingContent = fs.readFileSync(existingPath, 'utf-8');

// Extract data array using regex
const dataMatch = existingContent.match(/SCHOOLS_DATA:\s*SchoolData\[\]\s*=\s*\[([\s\S]*?)\];/);
if (!dataMatch) {
  console.error('Could not find SCHOOLS_DATA');
  process.exit(1);
}

// Parse the JSON data
const arrayContent = '[' + dataMatch[1].replace(/\n/g, '') + ']';
let existingSchools;
try {
  existingSchools = JSON.parse(arrayContent);
} catch (e) {
  console.error('Parse error:', e.message);
  // Try alternative approach - just extract universities manually
  existingSchools = [];
}

// Extract universities (type === '대학교')
const universities = existingSchools.filter(s => s.type === '대학교');
console.log('Universities found:', universities.length);

// Read new schools data
const newSchools = JSON.parse(fs.readFileSync(newSchoolsPath, 'utf-8'));
console.log('New schools loaded:', newSchools.length);

// Transform new schools
const transformedNewSchools = newSchools.map(school => ({
  id: 'school_' + school.atpt_ofcdc_sc_code + '_' + school.sd_schul_code,
  name: school.name,
  short_name: null,
  type: school.type,
  region: school.region,
  district: school.district,
  address: school.address,
  latitude: school.latitude,
  longitude: school.longitude,
  active_rooms_count: 0,
  total_members: 0,
  high_school_type: school.high_school_type && school.high_school_type.trim() ? school.high_school_type.trim() : null,
  foundation_type: school.foundation_type || null,
  coedu_type: school.coedu_type || null
}));

// Transform universities to match new format
const transformedUniversities = universities.map(u => ({
  id: u.id,
  name: u.name,
  short_name: u.short_name,
  type: u.type,
  region: null,
  district: null,
  address: null,
  latitude: u.latitude,
  longitude: u.longitude,
  active_rooms_count: u.active_rooms_count || 0,
  total_members: 0,
  high_school_type: null,
  foundation_type: null,
  coedu_type: null
}));

// Combine all schools
const allSchools = [...transformedUniversities, ...transformedNewSchools];
console.log('Total combined:', allSchools.length);

// Count by type
const middleCount = transformedNewSchools.filter(s => s.type === '중학교').length;
const highCount = transformedNewSchools.filter(s => s.type === '고등학교').length;

// Generate TypeScript content
const tsContent = `/**
 * Static school data for map rendering
 * This data is pre-loaded to avoid server calls and improve performance
 * Generated from NEIS API data + existing university data
 * Last updated: ${new Date().toISOString().split('T')[0]}
 * Total: ${allSchools.length} schools (${transformedUniversities.length} universities, ${middleCount} middle schools, ${highCount} high schools)
 */

export type SchoolType = '중학교' | '고등학교' | '대학교';
export type HighSchoolType = '일반고' | '특성화고' | '특목고' | '자율고' | null;

export interface SchoolData {
  id: string;
  name: string;
  short_name: string | null;
  type: SchoolType;
  region: string | null;
  district: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  active_rooms_count: number;
  total_members: number;
  high_school_type: string | null;
  foundation_type: string | null;
  coedu_type: string | null;
}

export const SCHOOLS_DATA: SchoolData[] = ${JSON.stringify(allSchools, null, 2)};

// Helper functions
export function getSchoolsByRegion(region: string): SchoolData[] {
  return SCHOOLS_DATA.filter(s => s.region === region);
}

export function getSchoolsByType(type: SchoolType): SchoolData[] {
  return SCHOOLS_DATA.filter(s => s.type === type);
}

export function getHighSchoolsByType(hsType: string): SchoolData[] {
  return SCHOOLS_DATA.filter(s => s.type === '고등학교' && s.high_school_type === hsType);
}

export function searchSchools(query: string): SchoolData[] {
  const normalizedQuery = query.toLowerCase().trim();
  return SCHOOLS_DATA.filter(s =>
    s.name.toLowerCase().includes(normalizedQuery) ||
    (s.region && s.region.toLowerCase().includes(normalizedQuery)) ||
    (s.district && s.district.toLowerCase().includes(normalizedQuery))
  );
}
`;

fs.writeFileSync(outputPath, tsContent);
console.log('\nSchools.ts updated successfully!');
console.log('- Universities:', transformedUniversities.length);
console.log('- Middle schools:', middleCount);
console.log('- High schools:', highCount);
console.log('- Total:', allSchools.length);
