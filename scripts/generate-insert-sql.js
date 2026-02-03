/**
 * Generate SQL INSERT statements for schools
 * Output is chunked into multiple files for execution
 */

const fs = require('fs');
const path = require('path');

const CHUNK_SIZE = 200; // Schools per SQL file

// Read schools data
const schoolsPath = path.join(__dirname, 'schools-with-coords.json');
const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf-8'));

// Universities
const universities = [
  {name:"DGIST",short_name:"DGIST",type:"대학교",region:"대구광역시",district:null,address:"대구광역시 달성군 현풍읍 테크노중앙대로 333",latitude:35.851,longitude:128.4915,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"GIST",short_name:"GIST",type:"대학교",region:"광주광역시",district:null,address:"광주광역시 북구 첨단과기로 123",latitude:35.2293,longitude:126.8428,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"KAIST",short_name:"KAIST",type:"대학교",region:"대전광역시",district:null,address:"대전광역시 유성구 대학로 291",latitude:36.3721,longitude:127.3604,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"POSTECH",short_name:"포스텍",type:"대학교",region:"경상북도",district:null,address:"경상북도 포항시 남구 청암로 77",latitude:36.0107,longitude:129.3218,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"UNIST",short_name:"UNIST",type:"대학교",region:"울산광역시",district:null,address:"울산광역시 울주군 언양읍 유니스트길 50",latitude:35.5729,longitude:129.1903,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"가천대학교",short_name:null,type:"대학교",region:"경기도",district:null,address:"경기도 성남시 수정구 성남대로 1342",latitude:37.4505,longitude:127.1272,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"건국대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 광진구 능동로 120",latitude:37.5427,longitude:127.0758,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"경북대학교",short_name:null,type:"대학교",region:"대구광역시",district:null,address:"대구광역시 북구 대학로 80",latitude:35.8886,longitude:128.6109,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"경희대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 동대문구 경희대로 26",latitude:37.5966,longitude:127.0512,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"경희대학교(국제캠퍼스)",short_name:null,type:"대학교",region:"경기도",district:null,address:"경기도 용인시 기흥구 덕영대로 1732",latitude:37.2431,longitude:127.0801,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"계명대학교",short_name:null,type:"대학교",region:"대구광역시",district:null,address:"대구광역시 달서구 달구벌대로 1095",latitude:35.8567,longitude:128.4889,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"고려대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 성북구 안암로 145",latitude:37.5895,longitude:127.0323,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"광주교육대학교",short_name:null,type:"대학교",region:"광주광역시",district:null,address:"광주광역시 북구 필문대로 55",latitude:35.1823,longitude:126.9034,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"광주대학교",short_name:null,type:"대학교",region:"광주광역시",district:null,address:"광주광역시 남구 효덕로 277",latitude:35.1234,longitude:126.8834,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"국민대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 성북구 정릉로 77",latitude:37.6101,longitude:126.9976,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"동국대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 중구 필동로1길 30",latitude:37.5582,longitude:127.0001,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"동아대학교",short_name:null,type:"대학교",region:"부산광역시",district:null,address:"부산광역시 사하구 낙동대로 550번길 37",latitude:35.1162,longitude:128.9679,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"배재대학교",short_name:null,type:"대학교",region:"대전광역시",district:null,address:"대전광역시 서구 배재로 155-40",latitude:36.3234,longitude:127.3645,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"부경대학교",short_name:null,type:"대학교",region:"부산광역시",district:null,address:"부산광역시 남구 용소로 45",latitude:35.1333,longitude:129.1035,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"부산대학교",short_name:null,type:"대학교",region:"부산광역시",district:null,address:"부산광역시 금정구 부산대학로63번길 2",latitude:35.2332,longitude:129.0809,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"서강대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 마포구 백범로 35",latitude:37.5515,longitude:126.941,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"서울대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 관악구 관악로 1",latitude:37.4602,longitude:126.9526,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"성균관대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 종로구 성균관로 25-2",latitude:37.5878,longitude:126.9934,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"성균관대학교(자연과학캠퍼스)",short_name:null,type:"대학교",region:"경기도",district:null,address:"경기도 수원시 장안구 서부로 2066",latitude:37.2938,longitude:126.9741,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"숙명여자대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 용산구 청파로47길 100",latitude:37.5456,longitude:126.9647,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"숭실대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 동작구 상도로 369",latitude:37.4965,longitude:126.9571,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"아주대학교",short_name:null,type:"대학교",region:"경기도",district:null,address:"경기도 수원시 영통구 월드컵로 206",latitude:37.2827,longitude:127.0448,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"연세대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 서대문구 연세로 50",latitude:37.5665,longitude:126.9389,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"영남대학교",short_name:null,type:"대학교",region:"경상북도",district:null,address:"경상북도 경산시 대학로 280",latitude:35.8266,longitude:128.7548,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"울산과학대학교",short_name:null,type:"대학교",region:"울산광역시",district:null,address:"울산광역시 동구 봉수로 101",latitude:35.4956,longitude:129.4156,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"울산대학교",short_name:null,type:"대학교",region:"울산광역시",district:null,address:"울산광역시 남구 대학로 93",latitude:35.5444,longitude:129.2567,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"이화여자대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 서대문구 이화여대길 52",latitude:37.5615,longitude:126.9468,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"인하대학교",short_name:null,type:"대학교",region:"인천광역시",district:null,address:"인천광역시 미추홀구 인하로 100",latitude:37.4507,longitude:126.6572,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"전남대학교",short_name:null,type:"대학교",region:"광주광역시",district:null,address:"광주광역시 북구 용봉로 77",latitude:35.1759,longitude:126.9067,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"전북대학교",short_name:null,type:"대학교",region:"전북특별자치도",district:null,address:"전북특별자치도 전주시 덕진구 백제대로 567",latitude:35.8468,longitude:127.1295,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"제주대학교",short_name:null,type:"대학교",region:"제주특별자치도",district:null,address:"제주특별자치도 제주시 제주대학로 102",latitude:33.4572,longitude:126.5617,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"중앙대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 동작구 흑석로 84",latitude:37.5045,longitude:126.9571,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"충북대학교",short_name:null,type:"대학교",region:"충청북도",district:null,address:"충청북도 청주시 서원구 충대로 1",latitude:36.6284,longitude:127.4561,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"충남대학교",short_name:null,type:"대학교",region:"대전광역시",district:null,address:"대전광역시 유성구 대학로 99",latitude:36.3676,longitude:127.3445,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"한밭대학교",short_name:null,type:"대학교",region:"대전광역시",district:null,address:"대전광역시 유성구 동서대로 125",latitude:36.3514,longitude:127.2998,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"한양대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 성동구 왕십리로 222",latitude:37.5579,longitude:127.0475,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"한양대학교(ERICA)",short_name:null,type:"대학교",region:"경기도",district:null,address:"경기도 안산시 상록구 한양대학로 55",latitude:37.2969,longitude:126.8356,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"홍익대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 마포구 와우산로 94",latitude:37.5512,longitude:126.9251,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
  {name:"한국외국어대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 동대문구 이문로 107",latitude:37.5967,longitude:127.0581,neis_code:null,edu_office_code:null,high_school_type:null,foundation_type:null,coedu_type:null},
];

// Transform NEIS schools
const transformedSchools = schools.map(school => ({
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

console.log(`Total schools: ${allSchools.length}`);

// Helper to escape SQL string
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

// Generate VALUES clause for a school
function schoolToValues(s) {
  return `(${escapeSql(s.name)}, ${escapeSql(s.short_name)}, ${escapeSql(s.type)}, ${escapeSql(s.region)}, ${escapeSql(s.district)}, ${escapeSql(s.address)}, ${s.latitude}, ${s.longitude}, ${escapeSql(s.neis_code)}, ${escapeSql(s.edu_office_code)}, ${escapeSql(s.high_school_type)}, ${escapeSql(s.foundation_type)}, ${escapeSql(s.coedu_type)}, ST_SetSRID(ST_MakePoint(${s.longitude}, ${s.latitude}), 4326))`;
}

// Generate SQL files
const outputDir = path.join(__dirname, 'sql-chunks');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

let fileIndex = 0;
for (let i = 0; i < allSchools.length; i += CHUNK_SIZE) {
  const chunk = allSchools.slice(i, i + CHUNK_SIZE);
  const values = chunk.map(schoolToValues).join(',\n');

  const sql = `-- Chunk ${fileIndex + 1}: schools ${i + 1} to ${Math.min(i + CHUNK_SIZE, allSchools.length)}
INSERT INTO schools (name, short_name, type, region, district, address, latitude, longitude, neis_code, edu_office_code, high_school_type, foundation_type, coedu_type, location)
VALUES
${values};
`;

  const filePath = path.join(outputDir, `chunk_${String(fileIndex).padStart(3, '0')}.sql`);
  fs.writeFileSync(filePath, sql);
  fileIndex++;
}

console.log(`Generated ${fileIndex} SQL files in ${outputDir}`);
console.log(`Run them using Supabase MCP execute_sql tool`);
