/**
 * Add universities to schools.ts
 */

const fs = require('fs');
const path = require('path');

const schoolsPath = path.join(__dirname, '..', 'src', 'data', 'schools.ts');

// Korean universities data
const universities = [
  {id:"uni_dgist",name:"DGIST",short_name:"DGIST",type:"대학교",region:"대구광역시",district:null,address:"대구광역시 달성군 현풍읍 테크노중앙대로 333",latitude:35.851,longitude:128.4915,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_gist",name:"GIST",short_name:"GIST",type:"대학교",region:"광주광역시",district:null,address:"광주광역시 북구 첨단과기로 123",latitude:35.2293,longitude:126.8428,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_kaist",name:"KAIST",short_name:"KAIST",type:"대학교",region:"대전광역시",district:null,address:"대전광역시 유성구 대학로 291",latitude:36.3721,longitude:127.3604,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_postech",name:"POSTECH",short_name:"포스텍",type:"대학교",region:"경상북도",district:null,address:"경상북도 포항시 남구 청암로 77",latitude:36.0107,longitude:129.3218,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_unist",name:"UNIST",short_name:"UNIST",type:"대학교",region:"울산광역시",district:null,address:"울산광역시 울주군 언양읍 유니스트길 50",latitude:35.5729,longitude:129.1903,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_gachon",name:"가천대학교",short_name:null,type:"대학교",region:"경기도",district:null,address:"경기도 성남시 수정구 성남대로 1342",latitude:37.4505,longitude:127.1272,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_konkuk",name:"건국대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 광진구 능동로 120",latitude:37.5427,longitude:127.0758,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_kyungpook",name:"경북대학교",short_name:null,type:"대학교",region:"대구광역시",district:null,address:"대구광역시 북구 대학로 80",latitude:35.8886,longitude:128.6109,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_kyunghee",name:"경희대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 동대문구 경희대로 26",latitude:37.5966,longitude:127.0512,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_kyunghee_global",name:"경희대학교(국제캠퍼스)",short_name:null,type:"대학교",region:"경기도",district:null,address:"경기도 용인시 기흥구 덕영대로 1732",latitude:37.2431,longitude:127.0801,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_keimyung",name:"계명대학교",short_name:null,type:"대학교",region:"대구광역시",district:null,address:"대구광역시 달서구 달구벌대로 1095",latitude:35.8567,longitude:128.4889,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_korea",name:"고려대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 성북구 안암로 145",latitude:37.5895,longitude:127.0323,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_gwangju_edu",name:"광주교육대학교",short_name:null,type:"대학교",region:"광주광역시",district:null,address:"광주광역시 북구 필문대로 55",latitude:35.1823,longitude:126.9034,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_gwangju",name:"광주대학교",short_name:null,type:"대학교",region:"광주광역시",district:null,address:"광주광역시 남구 효덕로 277",latitude:35.1234,longitude:126.8834,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_kookmin",name:"국민대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 성북구 정릉로 77",latitude:37.6101,longitude:126.9976,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_dongguk",name:"동국대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 중구 필동로1길 30",latitude:37.5582,longitude:127.0001,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_donga",name:"동아대학교",short_name:null,type:"대학교",region:"부산광역시",district:null,address:"부산광역시 사하구 낙동대로 550번길 37",latitude:35.1162,longitude:128.9679,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_paichai",name:"배재대학교",short_name:null,type:"대학교",region:"대전광역시",district:null,address:"대전광역시 서구 배재로 155-40",latitude:36.3234,longitude:127.3645,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_pknu",name:"부경대학교",short_name:null,type:"대학교",region:"부산광역시",district:null,address:"부산광역시 남구 용소로 45",latitude:35.1333,longitude:129.1035,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_pusan",name:"부산대학교",short_name:null,type:"대학교",region:"부산광역시",district:null,address:"부산광역시 금정구 부산대학로63번길 2",latitude:35.2332,longitude:129.0809,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_sogang",name:"서강대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 마포구 백범로 35",latitude:37.5515,longitude:126.941,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_snu",name:"서울대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 관악구 관악로 1",latitude:37.4602,longitude:126.9526,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_skku",name:"성균관대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 종로구 성균관로 25-2",latitude:37.5878,longitude:126.9934,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_skku_nat",name:"성균관대학교(자연과학캠퍼스)",short_name:null,type:"대학교",region:"경기도",district:null,address:"경기도 수원시 장안구 서부로 2066",latitude:37.2938,longitude:126.9741,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_sookmyung",name:"숙명여자대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 용산구 청파로47길 100",latitude:37.5456,longitude:126.9647,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_soongsil",name:"숭실대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 동작구 상도로 369",latitude:37.4965,longitude:126.9571,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_ajou",name:"아주대학교",short_name:null,type:"대학교",region:"경기도",district:null,address:"경기도 수원시 영통구 월드컵로 206",latitude:37.2827,longitude:127.0448,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_yonsei",name:"연세대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 서대문구 연세로 50",latitude:37.5665,longitude:126.9389,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_yeungnam",name:"영남대학교",short_name:null,type:"대학교",region:"경상북도",district:null,address:"경상북도 경산시 대학로 280",latitude:35.8266,longitude:128.7548,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_ulsan_sci",name:"울산과학대학교",short_name:null,type:"대학교",region:"울산광역시",district:null,address:"울산광역시 동구 봉수로 101",latitude:35.4956,longitude:129.4156,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_ulsan",name:"울산대학교",short_name:null,type:"대학교",region:"울산광역시",district:null,address:"울산광역시 남구 대학로 93",latitude:35.5444,longitude:129.2567,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_ewha",name:"이화여자대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 서대문구 이화여대길 52",latitude:37.5615,longitude:126.9468,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_inha",name:"인하대학교",short_name:null,type:"대학교",region:"인천광역시",district:null,address:"인천광역시 미추홀구 인하로 100",latitude:37.4507,longitude:126.6572,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_jnu",name:"전남대학교",short_name:null,type:"대학교",region:"광주광역시",district:null,address:"광주광역시 북구 용봉로 77",latitude:35.1759,longitude:126.9067,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_jbnu",name:"전북대학교",short_name:null,type:"대학교",region:"전북특별자치도",district:null,address:"전북특별자치도 전주시 덕진구 백제대로 567",latitude:35.8468,longitude:127.1295,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_jejunu",name:"제주대학교",short_name:null,type:"대학교",region:"제주특별자치도",district:null,address:"제주특별자치도 제주시 제주대학로 102",latitude:33.4572,longitude:126.5617,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_cau",name:"중앙대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 동작구 흑석로 84",latitude:37.5045,longitude:126.9571,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_chungbuk",name:"충북대학교",short_name:null,type:"대학교",region:"충청북도",district:null,address:"충청북도 청주시 서원구 충대로 1",latitude:36.6284,longitude:127.4561,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_chungnam",name:"충남대학교",short_name:null,type:"대학교",region:"대전광역시",district:null,address:"대전광역시 유성구 대학로 99",latitude:36.3676,longitude:127.3445,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_hanbat",name:"한밭대학교",short_name:null,type:"대학교",region:"대전광역시",district:null,address:"대전광역시 유성구 동서대로 125",latitude:36.3514,longitude:127.2998,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_hanyang",name:"한양대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 성동구 왕십리로 222",latitude:37.5579,longitude:127.0475,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_hanyang_erica",name:"한양대학교(ERICA)",short_name:null,type:"대학교",region:"경기도",district:null,address:"경기도 안산시 상록구 한양대학로 55",latitude:37.2969,longitude:126.8356,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_hongik",name:"홍익대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 마포구 와우산로 94",latitude:37.5512,longitude:126.9251,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
  {id:"uni_hufs",name:"한국외국어대학교",short_name:null,type:"대학교",region:"서울특별시",district:null,address:"서울특별시 동대문구 이문로 107",latitude:37.5967,longitude:127.0581,active_rooms_count:0,total_members:0,high_school_type:null,foundation_type:null,coedu_type:null},
];

// Read current schools.ts
const content = fs.readFileSync(schoolsPath, 'utf-8');

// Find the SCHOOLS_DATA array start
const arrayStartIndex = content.indexOf('export const SCHOOLS_DATA: SchoolData[] = [');
const arrayDataStart = content.indexOf('[', arrayStartIndex) + 1;

// Create universities JSON string
const universitiesJson = universities.map(u => '\n  ' + JSON.stringify(u)).join(',');

// Insert universities at the beginning of the array
const newContent = content.slice(0, arrayDataStart) + universitiesJson + ',' + content.slice(arrayDataStart);

// Update the comment with correct counts
const updatedContent = newContent.replace(
  /Total: \d+ schools \(\d+ universities, \d+ middle schools, \d+ high schools\)/,
  `Total: ${5738 + universities.length} schools (${universities.length} universities, 3333 middle schools, 2405 high schools)`
);

fs.writeFileSync(schoolsPath, updatedContent);

console.log(`Added ${universities.length} universities to schools.ts`);
console.log(`Total schools: ${5738 + universities.length}`);
