/**
 * Korean School Data Seeding Script
 *
 * This script collects all Korean middle schools, high schools, and universities
 * and inserts them into the Supabase database.
 *
 * Data Sources:
 * - NEIS Open Data API (나이스 교육정보 개방 포털)
 * - Kakao Local API for geocoding (address → coordinates)
 *
 * Usage:
 *   npx tsx scripts/seed-schools.ts
 *
 * Environment Variables Required:
 *   - NEIS_API_KEY: NEIS Open Data API key
 *   - NEXT_PUBLIC_KAKAO_REST_API_KEY: Kakao REST API key (for geocoding)
 *   - SUPABASE_URL: Supabase project URL
 *   - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (for admin access)
 */

import { createClient } from '@supabase/supabase-js';

// ============================================
// Configuration
// ============================================
const NEIS_API_KEY = process.env.NEIS_API_KEY || '';
const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// NEIS API endpoints
const NEIS_BASE_URL = 'https://open.neis.go.kr/hub/schoolInfo';

// School type mapping
const SCHOOL_TYPE_MAP: Record<string, string> = {
  '중학교': '중학교',
  '고등학교': '고등학교',
  '대학교': '대학교',
  '대학': '대학교',
  '전문대학': '대학교',
  '교육대학': '대학교',
};

// Education office codes (시도교육청)
const EDU_OFFICE_CODES = [
  { code: 'B10', name: '서울특별시교육청' },
  { code: 'C10', name: '부산광역시교육청' },
  { code: 'D10', name: '대구광역시교육청' },
  { code: 'E10', name: '인천광역시교육청' },
  { code: 'F10', name: '광주광역시교육청' },
  { code: 'G10', name: '대전광역시교육청' },
  { code: 'H10', name: '울산광역시교육청' },
  { code: 'I10', name: '세종특별자치시교육청' },
  { code: 'J10', name: '경기도교육청' },
  { code: 'K10', name: '강원특별자치도교육청' },
  { code: 'M10', name: '충청북도교육청' },
  { code: 'N10', name: '충청남도교육청' },
  { code: 'P10', name: '전북특별자치도교육청' },
  { code: 'Q10', name: '전라남도교육청' },
  { code: 'R10', name: '경상북도교육청' },
  { code: 'S10', name: '경상남도교육청' },
  { code: 'T10', name: '제주특별자치도교육청' },
];

// Rate limiting
const DELAY_MS = 100; // 100ms between API calls
const BATCH_SIZE = 100; // Insert in batches

// ============================================
// Types
// ============================================
interface NEISSchool {
  ATPT_OFCDC_SC_CODE: string;  // 시도교육청코드
  ATPT_OFCDC_SC_NM: string;    // 시도교육청명
  SD_SCHUL_CODE: string;        // 표준학교코드
  SCHUL_NM: string;             // 학교명
  SCHUL_KND_SC_NM: string;      // 학교종류명 (중학교, 고등학교 등)
  LCTN_SC_NM: string;           // 시도명
  ORG_RDNMA: string;            // 도로명주소
  ORG_TELNO: string;            // 전화번호
  HMPG_ADRES: string;           // 홈페이지주소
  FOND_SC_NM: string;           // 설립명 (공립, 사립)
}

interface SchoolInsert {
  name: string;
  short_name: string | null;
  type: string;
  region: string;
  district: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  neis_code: string | null;
  edu_office_code: string | null;
  is_verified: boolean;
}

interface GeocodingResult {
  latitude: number;
  longitude: number;
}

// ============================================
// Utility Functions
// ============================================
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractShortName(fullName: string): string | null {
  // Extract short name for universities
  // e.g., "서울대학교" → "서울대"
  if (fullName.includes('대학교')) {
    return fullName.replace('대학교', '대').replace('학교', '');
  }
  if (fullName.includes('고등학교')) {
    return fullName.replace('고등학교', '고');
  }
  if (fullName.includes('중학교')) {
    return fullName.replace('중학교', '중');
  }
  return null;
}

function extractDistrict(address: string): string | null {
  // Extract district from address
  // e.g., "서울특별시 강남구 ..." → "강남구"
  const match = address.match(/([가-힣]+[시군구])\s/);
  return match ? match[1] : null;
}

function extractRegion(address: string): string {
  // Extract region from address
  // e.g., "서울특별시 강남구 ..." → "서울특별시"
  const match = address.match(/^([가-힣]+[시도])/);
  return match ? match[1] : '기타';
}

// ============================================
// API Functions
// ============================================
async function fetchSchoolsFromNEIS(
  eduOfficeCode: string,
  schoolType: string,
  pageIndex: number = 1,
  pageSize: number = 1000
): Promise<NEISSchool[]> {
  const params = new URLSearchParams({
    KEY: NEIS_API_KEY,
    Type: 'json',
    pIndex: String(pageIndex),
    pSize: String(pageSize),
    ATPT_OFCDC_SC_CODE: eduOfficeCode,
    SCHUL_KND_SC_NM: schoolType,
  });

  try {
    const response = await fetch(`${NEIS_BASE_URL}?${params}`);
    const data = await response.json();

    if (data.schoolInfo && data.schoolInfo[1]) {
      return data.schoolInfo[1].row || [];
    }
    return [];
  } catch (error) {
    console.error(`Error fetching from NEIS (${eduOfficeCode}, ${schoolType}):`, error);
    return [];
  }
}

async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!address || !KAKAO_REST_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      return {
        latitude: parseFloat(doc.y),
        longitude: parseFloat(doc.x),
      };
    }

    // Try keyword search if address search fails
    const keywordResponse = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
        },
      }
    );

    const keywordData = await keywordResponse.json();

    if (keywordData.documents && keywordData.documents.length > 0) {
      const doc = keywordData.documents[0];
      return {
        latitude: parseFloat(doc.y),
        longitude: parseFloat(doc.x),
      };
    }

    return null;
  } catch (error) {
    console.error(`Geocoding error for "${address}":`, error);
    return null;
  }
}

// ============================================
// Main Seeding Logic
// ============================================
async function seedSchools() {
  console.log('🏫 Starting school data seeding...\n');

  // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials');
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  if (!NEIS_API_KEY) {
    console.warn('⚠️  NEIS_API_KEY not set - will use fallback data or skip NEIS fetch');
  }

  if (!KAKAO_REST_API_KEY) {
    console.warn('⚠️  KAKAO_REST_API_KEY not set - geocoding will be skipped');
  }

  // Initialize Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const allSchools: SchoolInsert[] = [];
  const schoolTypes = ['중학교', '고등학교'];
  let totalFetched = 0;
  let totalGeocoded = 0;
  let totalFailed = 0;

  // Fetch schools from NEIS API
  if (NEIS_API_KEY) {
    console.log('📡 Fetching schools from NEIS API...\n');

    for (const eduOffice of EDU_OFFICE_CODES) {
      for (const schoolType of schoolTypes) {
        console.log(`  Fetching ${schoolType} from ${eduOffice.name}...`);

        const schools = await fetchSchoolsFromNEIS(eduOffice.code, schoolType);
        console.log(`    Found ${schools.length} schools`);

        for (const school of schools) {
          totalFetched++;

          // Geocode address
          let coords: GeocodingResult | null = null;
          if (KAKAO_REST_API_KEY && school.ORG_RDNMA) {
            coords = await geocodeAddress(school.ORG_RDNMA);
            if (coords) {
              totalGeocoded++;
            } else {
              // Try geocoding with school name
              coords = await geocodeAddress(`${school.SCHUL_NM} ${school.LCTN_SC_NM}`);
              if (coords) totalGeocoded++;
            }
            await sleep(DELAY_MS); // Rate limiting
          }

          if (!coords) {
            totalFailed++;
            console.warn(`    ⚠️  Failed to geocode: ${school.SCHUL_NM}`);
            continue;
          }

          allSchools.push({
            name: school.SCHUL_NM,
            short_name: extractShortName(school.SCHUL_NM),
            type: SCHOOL_TYPE_MAP[school.SCHUL_KND_SC_NM] || '기타',
            region: school.LCTN_SC_NM || extractRegion(school.ORG_RDNMA),
            district: extractDistrict(school.ORG_RDNMA),
            address: school.ORG_RDNMA,
            latitude: coords.latitude,
            longitude: coords.longitude,
            neis_code: school.SD_SCHUL_CODE,
            edu_office_code: school.ATPT_OFCDC_SC_CODE,
            is_verified: true,
          });
        }

        await sleep(500); // Delay between education offices
      }
    }
  }

  // If no NEIS data, use sample data for testing
  if (allSchools.length === 0) {
    console.log('📋 Using sample school data for testing...\n');
    allSchools.push(...getSampleSchools());
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Total fetched: ${totalFetched}`);
  console.log(`  Geocoded: ${totalGeocoded}`);
  console.log(`  Failed: ${totalFailed}`);
  console.log(`  Ready to insert: ${allSchools.length}\n`);

  // Insert into Supabase in batches
  console.log('💾 Inserting schools into database...\n');

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < allSchools.length; i += BATCH_SIZE) {
    const batch = allSchools.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from('schools')
      .upsert(batch, {
        onConflict: 'neis_code',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) {
      console.error(`❌ Batch insert error (${i}-${i + batch.length}):`, error.message);
      errors += batch.length;
    } else {
      inserted += data?.length || batch.length;
      console.log(`  ✓ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} schools`);
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`  Inserted: ${inserted} schools`);
  console.log(`  Errors: ${errors}`);
}

// ============================================
// Sample Data (for testing without NEIS API)
// ============================================
function getSampleSchools(): SchoolInsert[] {
  // Major universities and schools with known coordinates
  return [
    // 서울 대학교
    { name: '서울대학교', short_name: '서울대', type: '대학교', region: '서울특별시', district: '관악구', address: '서울특별시 관악구 관악로 1', latitude: 37.4563, longitude: 126.9520, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '연세대학교', short_name: '연세대', type: '대학교', region: '서울특별시', district: '서대문구', address: '서울특별시 서대문구 연세로 50', latitude: 37.5647, longitude: 126.9387, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '고려대학교', short_name: '고려대', type: '대학교', region: '서울특별시', district: '성북구', address: '서울특별시 성북구 안암로 145', latitude: 37.5895, longitude: 127.0323, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '한양대학교', short_name: '한양대', type: '대학교', region: '서울특별시', district: '성동구', address: '서울특별시 성동구 왕십리로 222', latitude: 37.5574, longitude: 127.0475, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '성균관대학교', short_name: '성균관대', type: '대학교', region: '서울특별시', district: '종로구', address: '서울특별시 종로구 성균관로 25-2', latitude: 37.5876, longitude: 126.9923, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '서강대학교', short_name: '서강대', type: '대학교', region: '서울특별시', district: '마포구', address: '서울특별시 마포구 백범로 35', latitude: 37.5515, longitude: 126.9410, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '중앙대학교', short_name: '중앙대', type: '대학교', region: '서울특별시', district: '동작구', address: '서울특별시 동작구 흑석로 84', latitude: 37.5051, longitude: 126.9571, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '경희대학교', short_name: '경희대', type: '대학교', region: '서울특별시', district: '동대문구', address: '서울특별시 동대문구 경희대로 26', latitude: 37.5966, longitude: 127.0512, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '한국외국어대학교', short_name: '외대', type: '대학교', region: '서울특별시', district: '동대문구', address: '서울특별시 동대문구 이문로 107', latitude: 37.5975, longitude: 127.0581, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '이화여자대학교', short_name: '이화여대', type: '대학교', region: '서울특별시', district: '서대문구', address: '서울특별시 서대문구 이화여대길 52', latitude: 37.5625, longitude: 126.9469, neis_code: null, edu_office_code: null, is_verified: true },

    // 서울 고등학교
    { name: '경기고등학교', short_name: '경기고', type: '고등학교', region: '서울특별시', district: '강남구', address: '서울특별시 강남구 영동대로 643', latitude: 37.5147, longitude: 127.0580, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '휘문고등학교', short_name: '휘문고', type: '고등학교', region: '서울특별시', district: '강남구', address: '서울특별시 강남구 봉은사로 114', latitude: 37.5042, longitude: 127.0508, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '대원외국어고등학교', short_name: '대원외고', type: '고등학교', region: '서울특별시', district: '광진구', address: '서울특별시 광진구 용마산로 158', latitude: 37.5235, longitude: 127.0628, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '서울과학고등학교', short_name: '서울과고', type: '고등학교', region: '서울특별시', district: '종로구', address: '서울특별시 종로구 혜화로 63', latitude: 37.5897, longitude: 127.0019, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '한성과학고등학교', short_name: '한성과고', type: '고등학교', region: '서울특별시', district: '서대문구', address: '서울특별시 서대문구 홍은동 산41-7', latitude: 37.5936, longitude: 126.9391, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '세화고등학교', short_name: '세화고', type: '고등학교', region: '서울특별시', district: '서초구', address: '서울특별시 서초구 효령로 77길 55', latitude: 37.4823, longitude: 127.0154, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '서울고등학교', short_name: '서울고', type: '고등학교', region: '서울특별시', district: '서초구', address: '서울특별시 서초구 효령로 70', latitude: 37.4893, longitude: 127.0117, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '중동고등학교', short_name: '중동고', type: '고등학교', region: '서울특별시', district: '강남구', address: '서울특별시 강남구 일원로 105', latitude: 37.4829, longitude: 127.0727, neis_code: null, edu_office_code: null, is_verified: true },

    // 서울 중학교
    { name: '경기중학교', short_name: '경기중', type: '중학교', region: '서울특별시', district: '강남구', address: '서울특별시 강남구 영동대로 643', latitude: 37.5142, longitude: 127.0575, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '대명중학교', short_name: '대명중', type: '중학교', region: '서울특별시', district: '강남구', address: '서울특별시 강남구 대치동', latitude: 37.5015, longitude: 127.0565, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '서울중학교', short_name: '서울중', type: '중학교', region: '서울특별시', district: '서초구', address: '서울특별시 서초구 방배동', latitude: 37.4889, longitude: 127.0112, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '휘문중학교', short_name: '휘문중', type: '중학교', region: '서울특별시', district: '강남구', address: '서울특별시 강남구 역삼동', latitude: 37.5038, longitude: 127.0503, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '단대부속중학교', short_name: '단대부중', type: '중학교', region: '서울특별시', district: '강남구', address: '서울특별시 강남구 압구정동', latitude: 37.5283, longitude: 127.0292, neis_code: null, edu_office_code: null, is_verified: true },

    // 경기도 대학교
    { name: '한양대학교 ERICA', short_name: 'ERICA', type: '대학교', region: '경기도', district: '안산시', address: '경기도 안산시 상록구 한양대학로 55', latitude: 37.2976, longitude: 126.8371, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '아주대학교', short_name: '아주대', type: '대학교', region: '경기도', district: '수원시', address: '경기도 수원시 영통구 월드컵로 206', latitude: 37.2843, longitude: 127.0466, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '경희대학교 국제캠퍼스', short_name: '경희대(국제)', type: '대학교', region: '경기도', district: '용인시', address: '경기도 용인시 기흥구 덕영대로 1732', latitude: 37.2410, longitude: 127.0800, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '성균관대학교 자연과학캠퍼스', short_name: '성대(자연)', type: '대학교', region: '경기도', district: '수원시', address: '경기도 수원시 장안구 서부로 2066', latitude: 37.2934, longitude: 126.9745, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '단국대학교 죽전캠퍼스', short_name: '단국대', type: '대학교', region: '경기도', district: '용인시', address: '경기도 용인시 수지구 죽전로 152', latitude: 37.3212, longitude: 127.1269, neis_code: null, edu_office_code: null, is_verified: true },

    // 경기도 고등학교
    { name: '용인외국어고등학교', short_name: '용인외고', type: '고등학교', region: '경기도', district: '용인시', address: '경기도 용인시 처인구', latitude: 37.2361, longitude: 127.2001, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '수원외국어고등학교', short_name: '수원외고', type: '고등학교', region: '경기도', district: '수원시', address: '경기도 수원시 장안구', latitude: 37.3085, longitude: 127.0019, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '안양외국어고등학교', short_name: '안양외고', type: '고등학교', region: '경기도', district: '안양시', address: '경기도 안양시 동안구', latitude: 37.3921, longitude: 126.9510, neis_code: null, edu_office_code: null, is_verified: true },

    // 부산 대학교
    { name: '부산대학교', short_name: '부산대', type: '대학교', region: '부산광역시', district: '금정구', address: '부산광역시 금정구 부산대학로63번길 2', latitude: 35.2345, longitude: 129.0824, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '경성대학교', short_name: '경성대', type: '대학교', region: '부산광역시', district: '남구', address: '부산광역시 남구 수영로 309', latitude: 35.1423, longitude: 129.0985, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '동아대학교', short_name: '동아대', type: '대학교', region: '부산광역시', district: '사하구', address: '부산광역시 사하구 낙동대로 550번길 37', latitude: 35.1163, longitude: 128.9656, neis_code: null, edu_office_code: null, is_verified: true },

    // 대전 대학교
    { name: 'KAIST', short_name: 'KAIST', type: '대학교', region: '대전광역시', district: '유성구', address: '대전광역시 유성구 대학로 291', latitude: 36.3721, longitude: 127.3604, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '충남대학교', short_name: '충남대', type: '대학교', region: '대전광역시', district: '유성구', address: '대전광역시 유성구 대학로 99', latitude: 36.3716, longitude: 127.3464, neis_code: null, edu_office_code: null, is_verified: true },

    // 대구 대학교
    { name: 'DGIST', short_name: 'DGIST', type: '대학교', region: '대구광역시', district: '달성군', address: '대구광역시 달성군 현풍읍 테크노중앙대로 333', latitude: 35.8510, longitude: 128.4915, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '경북대학교', short_name: '경북대', type: '대학교', region: '대구광역시', district: '북구', address: '대구광역시 북구 대학로 80', latitude: 35.8906, longitude: 128.6108, neis_code: null, edu_office_code: null, is_verified: true },

    // 광주 대학교
    { name: 'GIST', short_name: 'GIST', type: '대학교', region: '광주광역시', district: '북구', address: '광주광역시 북구 첨단과기로 123', latitude: 35.2293, longitude: 126.8428, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '전남대학교', short_name: '전남대', type: '대학교', region: '광주광역시', district: '북구', address: '광주광역시 북구 용봉로 77', latitude: 35.1763, longitude: 126.9080, neis_code: null, edu_office_code: null, is_verified: true },

    // 인천 대학교
    { name: '인하대학교', short_name: '인하대', type: '대학교', region: '인천광역시', district: '미추홀구', address: '인천광역시 미추홀구 인하로 100', latitude: 37.4505, longitude: 126.6542, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '인천대학교', short_name: '인천대', type: '대학교', region: '인천광역시', district: '연수구', address: '인천광역시 연수구 아카데미로 119', latitude: 37.3757, longitude: 126.6328, neis_code: null, edu_office_code: null, is_verified: true },

    // 제주
    { name: '제주대학교', short_name: '제주대', type: '대학교', region: '제주특별자치도', district: '제주시', address: '제주특별자치도 제주시 제주대학로 102', latitude: 33.4568, longitude: 126.5623, neis_code: null, edu_office_code: null, is_verified: true },
    { name: '제주과학고등학교', short_name: '제주과고', type: '고등학교', region: '제주특별자치도', district: '제주시', address: '제주특별자치도 제주시', latitude: 33.4821, longitude: 126.4761, neis_code: null, edu_office_code: null, is_verified: true },
  ];
}

// ============================================
// Run Script
// ============================================
seedSchools().catch(console.error);
