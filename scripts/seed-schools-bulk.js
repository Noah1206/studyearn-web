/**
 * Bulk insert schools into Supabase
 * Run with: node scripts/seed-schools-bulk.js
 */

const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://tmxgwtouhfzaqljeqzbr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGd3dG91aGZ6YXFsamVxemJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTY3NDEsImV4cCI6MjA3OTU3Mjc0MX0.PjyqJ2GNR0N1hrKl_esTfetrNyLQl5Mp_6QOjFiwdV8';

const BATCH_SIZE = 100;

// Read schools data
const schoolsPath = path.join(__dirname, 'schools-with-coords.json');
const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf-8'));

// Read universities from add-universities.js (hardcoded)
const universities = [
  {id:"uni_dgist",name:"DGIST",short_name:"DGIST",type:"대학교",region:"대구광역시",district:null,address:"대구광역시 달성군 현풍읍 테크노중앙대로 333",latitude:35.851,longitude:128.4915,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_gist",name:"GIST",short_name:"GIST",type:"대학교",region:"광주광역시",district:null,address:"광주광역시 북구 첨단과기로 123",latitude:35.2293,longitude:126.8428,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_kaist",name:"KAIST",short_name:"KAIST",type:"대학교",region:"대전광역시",district:null,address:"대전광역시 유성구 대학로 291",latitude:36.3721,longitude:127.3604,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_postech",name:"POSTECH",short_name:"포스텍",type:"대학교",region:"경상북도",district:null,address:"경상북도 포항시 남구 청암로 77",latitude:36.0107,longitude:129.3218,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_unist",name:"UNIST",short_name:"UNIST",type:"대학교",region:"울산광역시",district:null,address:"울산광역시 울주군 언양읍 유니스트길 50",latitude:35.5729,longitude:129.1903,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_gachon",name:"가천대학교",short_name:null,type:"대학교",region:"경기도",district:null,address:"경기도 성남시 수정구 성남대로 1342",latitude:37.4505,longitude:127.1272,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_konkuk",name:"건국대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 광진구 능동로 120",latitude:37.5427,longitude:127.0758,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_kyungpook",name:"경북대학교",short_name:null,type:"대학교",region:"대구광역시",district:null,address:"대구광역시 북구 대학로 80",latitude:35.8886,longitude:128.6109,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_kyunghee",name:"경희대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 동대문구 경희대로 26",latitude:37.5966,longitude:127.0512,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_kyunghee_global",name:"경희대학교(국제캠퍼스)",short_name:null,type:"대학교",region:"경기도",district:null,address:"경기도 용인시 기흥구 덕영대로 1732",latitude:37.2431,longitude:127.0801,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_keimyung",name:"계명대학교",short_name:null,type:"대학교",region:"대구광역시",district:null,address:"대구광역시 달서구 달구벌대로 1095",latitude:35.8567,longitude:128.4889,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_korea",name:"고려대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 성북구 안암로 145",latitude:37.5895,longitude:127.0323,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_gwangju_edu",name:"광주교육대학교",short_name:null,type:"대학교",region:"광주광역시",district:null,address:"광주광역시 북구 필문대로 55",latitude:35.1823,longitude:126.9034,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_gwangju",name:"광주대학교",short_name:null,type:"대학교",region:"광주광역시",district:null,address:"광주광역시 남구 효덕로 277",latitude:35.1234,longitude:126.8834,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_kookmin",name:"국민대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 성북구 정릉로 77",latitude:37.6101,longitude:126.9976,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_dongguk",name:"동국대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 중구 필동로1길 30",latitude:37.5582,longitude:127.0001,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_donga",name:"동아대학교",short_name:null,type:"대학교",region:"부산광역시",district:null,address:"부산광역시 사하구 낙동대로 550번길 37",latitude:35.1162,longitude:128.9679,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_paichai",name:"배재대학교",short_name:null,type:"대학교",region:"대전광역시",district:null,address:"대전광역시 서구 배재로 155-40",latitude:36.3234,longitude:127.3645,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_pknu",name:"부경대학교",short_name:null,type:"대학교",region:"부산광역시",district:null,address:"부산광역시 남구 용소로 45",latitude:35.1333,longitude:129.1035,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_pusan",name:"부산대학교",short_name:null,type:"대학교",region:"부산광역시",district:null,address:"부산광역시 금정구 부산대학로63번길 2",latitude:35.2332,longitude:129.0809,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_sogang",name:"서강대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 마포구 백범로 35",latitude:37.5515,longitude:126.941,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_snu",name:"서울대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 관악구 관악로 1",latitude:37.4602,longitude:126.9526,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_skku",name:"성균관대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 종로구 성균관로 25-2",latitude:37.5878,longitude:126.9934,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_skku_nat",name:"성균관대학교(자연과학캠퍼스)",short_name:null,type:"대학교",region:"경기도",district:null,address:"경기도 수원시 장안구 서부로 2066",latitude:37.2938,longitude:126.9741,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_sookmyung",name:"숙명여자대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 용산구 청파로47길 100",latitude:37.5456,longitude:126.9647,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_soongsil",name:"숭실대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 동작구 상도로 369",latitude:37.4965,longitude:126.9571,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_ajou",name:"아주대학교",short_name:null,type:"대학교",region:"경기도",district:null,address:"경기도 수원시 영통구 월드컵로 206",latitude:37.2827,longitude:127.0448,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_yonsei",name:"연세대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 서대문구 연세로 50",latitude:37.5665,longitude:126.9389,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_yeungnam",name:"영남대학교",short_name:null,type:"대학교",region:"경상북도",district:null,address:"경상북도 경산시 대학로 280",latitude:35.8266,longitude:128.7548,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_ulsan_sci",name:"울산과학대학교",short_name:null,type:"대학교",region:"울산광역시",district:null,address:"울산광역시 동구 봉수로 101",latitude:35.4956,longitude:129.4156,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_ulsan",name:"울산대학교",short_name:null,type:"대학교",region:"울산광역시",district:null,address:"울산광역시 남구 대학로 93",latitude:35.5444,longitude:129.2567,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_ewha",name:"이화여자대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 서대문구 이화여대길 52",latitude:37.5615,longitude:126.9468,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_inha",name:"인하대학교",short_name:null,type:"대학교",region:"인천광역시",district:null,address:"인천광역시 미추홀구 인하로 100",latitude:37.4507,longitude:126.6572,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_jnu",name:"전남대학교",short_name:null,type:"대학교",region:"광주광역시",district:null,address:"광주광역시 북구 용봉로 77",latitude:35.1759,longitude:126.9067,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_jbnu",name:"전북대학교",short_name:null,type:"대학교",region:"전북특별자치도",district:null,address:"전북특별자치도 전주시 덕진구 백제대로 567",latitude:35.8468,longitude:127.1295,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_jejunu",name:"제주대학교",short_name:null,type:"대학교",region:"제주특별자치도",district:null,address:"제주특별자치도 제주시 제주대학로 102",latitude:33.4572,longitude:126.5617,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_cau",name:"중앙대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 동작구 흑석로 84",latitude:37.5045,longitude:126.9571,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_chungbuk",name:"충북대학교",short_name:null,type:"대학교",region:"충청북도",district:null,address:"충청북도 청주시 서원구 충대로 1",latitude:36.6284,longitude:127.4561,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_chungnam",name:"충남대학교",short_name:null,type:"대학교",region:"대전광역시",district:null,address:"대전광역시 유성구 대학로 99",latitude:36.3676,longitude:127.3445,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_hanbat",name:"한밭대학교",short_name:null,type:"대학교",region:"대전광역시",district:null,address:"대전광역시 유성구 동서대로 125",latitude:36.3514,longitude:127.2998,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_hanyang",name:"한양대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 성동구 왕십리로 222",latitude:37.5579,longitude:127.0475,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_hanyang_erica",name:"한양대학교(ERICA)",short_name:null,type:"대학교",region:"경기도",district:null,address:"경기도 안산시 상록구 한양대학로 55",latitude:37.2969,longitude:126.8356,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_hongik",name:"홍익대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 마포구 와우산로 94",latitude:37.5512,longitude:126.9251,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_hufs",name:"한국외국어대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 동대문구 이문로 107",latitude:37.5967,longitude:127.0581,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
];

// Transform NEIS schools data
const transformedSchools = schools.map(school => ({
  id: `school_${school.atpt_ofcdc_sc_code}_${school.sd_schul_code}`,
  name: school.name,
  short_name: null,
  type: school.type,
  region: school.region,
  district: school.district,
  address: school.address,
  latitude: school.latitude,
  longitude: school.longitude,
  neis_code: school.sd_schul_code,
  edu_office_code: school.atpt_ofcdc_sc_code,
  high_school_type: school.high_school_type && school.high_school_type.trim() ? school.high_school_type.trim() : null,
  foundation_type: school.foundation_type || null,
  coedu_type: school.coedu_type || null,
}));

// Combine all schools
const allSchools = [...universities, ...transformedSchools];

console.log(`Total schools to insert: ${allSchools.length}`);
console.log(`- Universities: ${universities.length}`);
console.log(`- Middle schools: ${transformedSchools.filter(s => s.type === '중학교').length}`);
console.log(`- High schools: ${transformedSchools.filter(s => s.type === '고등학교').length}`);

async function getExistingNeisCodes() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/schools?select=neis_code,name&neis_code=not.is.null`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch existing schools');
  }

  const data = await response.json();
  return new Set(data.map(s => s.neis_code));
}

async function getExistingNames() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/schools?select=name&neis_code=is.null`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch existing schools');
  }

  const data = await response.json();
  return new Set(data.map(s => s.name));
}

async function upsertBatch(batch) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/schools`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(batch.map(s => ({
      name: s.name,
      short_name: s.short_name,
      type: s.type,
      region: s.region,
      district: s.district,
      address: s.address,
      latitude: s.latitude,
      longitude: s.longitude,
      neis_code: s.neis_code,
      edu_office_code: s.edu_office_code,
      high_school_type: s.high_school_type,
      foundation_type: s.foundation_type,
      coedu_type: s.coedu_type,
      location: `POINT(${s.longitude} ${s.latitude})`,
    })))
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upsert failed: ${response.status} - ${error}`);
  }

  return response;
}

async function main() {
  console.log('\n🏫 Starting bulk school insertion...\n');

  // Get existing schools to avoid duplicates
  console.log('📋 Fetching existing schools from database...');
  const existingNeisCodes = await getExistingNeisCodes();
  const existingNames = await getExistingNames();
  console.log(`   Found ${existingNeisCodes.size} schools with NEIS codes`);
  console.log(`   Found ${existingNames.size} schools without NEIS codes (universities)`);

  // Filter out schools that already exist
  const newSchools = allSchools.filter(school => {
    if (school.neis_code) {
      return !existingNeisCodes.has(school.neis_code);
    } else {
      return !existingNames.has(school.name);
    }
  });

  console.log(`\n📊 Schools to insert: ${newSchools.length} (skipping ${allSchools.length - newSchools.length} existing)`);

  if (newSchools.length === 0) {
    console.log('✅ All schools already exist in database!');
    return;
  }

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < newSchools.length; i += BATCH_SIZE) {
    const batch = newSchools.slice(i, i + BATCH_SIZE);

    try {
      await upsertBatch(batch);
      inserted += batch.length;
      console.log(`✅ Inserted ${inserted}/${newSchools.length} (${((inserted/newSchools.length)*100).toFixed(1)}%)`);
    } catch (error) {
      console.error(`❌ Error at batch ${i}: ${error.message}`);
      errors += batch.length;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Insertion Summary');
  console.log('='.repeat(60));
  console.log(`✅ Inserted: ${inserted}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Total new: ${newSchools.length}`);
  console.log(`⏭️  Skipped (already exists): ${allSchools.length - newSchools.length}`);
}

main().catch(console.error);
