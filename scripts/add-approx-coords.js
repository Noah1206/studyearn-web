/**
 * 학교에 근사 좌표 추가 (API 키 없이 사용 가능)
 * 시/군/구 중심 좌표를 기반으로 대략적인 위치 추정
 *
 * 실행: node scripts/add-approx-coords.js
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'schools-raw.json');
const OUTPUT_FILE = path.join(__dirname, 'schools-with-coords.json');

// 시/도 중심 좌표
const REGION_CENTERS = {
  '서울특별시': { lat: 37.5665, lng: 126.9780 },
  '부산광역시': { lat: 35.1796, lng: 129.0756 },
  '대구광역시': { lat: 35.8714, lng: 128.6014 },
  '인천광역시': { lat: 37.4563, lng: 126.7052 },
  '광주광역시': { lat: 35.1595, lng: 126.8526 },
  '대전광역시': { lat: 36.3504, lng: 127.3845 },
  '울산광역시': { lat: 35.5384, lng: 129.3114 },
  '세종특별자치시': { lat: 36.4800, lng: 127.2890 },
  '경기도': { lat: 37.4138, lng: 127.5183 },
  '강원특별자치도': { lat: 37.8228, lng: 128.1555 },
  '강원도': { lat: 37.8228, lng: 128.1555 },
  '충청북도': { lat: 36.6357, lng: 127.4914 },
  '충청남도': { lat: 36.6588, lng: 126.6728 },
  '전북특별자치도': { lat: 35.8203, lng: 127.1088 },
  '전라북도': { lat: 35.8203, lng: 127.1088 },
  '전라남도': { lat: 34.8161, lng: 126.4629 },
  '경상북도': { lat: 36.4919, lng: 128.8889 },
  '경상남도': { lat: 35.4606, lng: 128.2132 },
  '제주특별자치도': { lat: 33.4996, lng: 126.5312 },
};

// 주요 시/군/구 중심 좌표
const DISTRICT_CENTERS = {
  // 서울특별시
  '종로구': { lat: 37.5735, lng: 126.9788 },
  '중구': { lat: 37.5636, lng: 126.9976 },
  '용산구': { lat: 37.5326, lng: 126.9909 },
  '성동구': { lat: 37.5633, lng: 127.0371 },
  '광진구': { lat: 37.5385, lng: 127.0823 },
  '동대문구': { lat: 37.5744, lng: 127.0396 },
  '중랑구': { lat: 37.6066, lng: 127.0927 },
  '성북구': { lat: 37.5894, lng: 127.0167 },
  '강북구': { lat: 37.6396, lng: 127.0257 },
  '도봉구': { lat: 37.6688, lng: 127.0471 },
  '노원구': { lat: 37.6542, lng: 127.0568 },
  '은평구': { lat: 37.6027, lng: 126.9291 },
  '서대문구': { lat: 37.5794, lng: 126.9368 },
  '마포구': { lat: 37.5638, lng: 126.9084 },
  '양천구': { lat: 37.5169, lng: 126.8664 },
  '강서구': { lat: 37.5510, lng: 126.8495 },
  '구로구': { lat: 37.4954, lng: 126.8875 },
  '금천구': { lat: 37.4569, lng: 126.8955 },
  '영등포구': { lat: 37.5264, lng: 126.8962 },
  '동작구': { lat: 37.5124, lng: 126.9393 },
  '관악구': { lat: 37.4784, lng: 126.9516 },
  '서초구': { lat: 37.4837, lng: 127.0324 },
  '강남구': { lat: 37.5172, lng: 127.0473 },
  '송파구': { lat: 37.5145, lng: 127.1059 },
  '강동구': { lat: 37.5301, lng: 127.1238 },

  // 경기도 주요 도시
  '수원시': { lat: 37.2636, lng: 127.0286 },
  '성남시': { lat: 37.4449, lng: 127.1389 },
  '의정부시': { lat: 37.7381, lng: 127.0337 },
  '안양시': { lat: 37.3943, lng: 126.9568 },
  '부천시': { lat: 37.5034, lng: 126.7660 },
  '광명시': { lat: 37.4786, lng: 126.8644 },
  '평택시': { lat: 36.9921, lng: 127.0858 },
  '동두천시': { lat: 37.9034, lng: 127.0606 },
  '안산시': { lat: 37.3219, lng: 126.8309 },
  '고양시': { lat: 37.6584, lng: 126.8320 },
  '과천시': { lat: 37.4292, lng: 126.9876 },
  '구리시': { lat: 37.5943, lng: 127.1295 },
  '남양주시': { lat: 37.6360, lng: 127.2165 },
  '오산시': { lat: 37.1498, lng: 127.0776 },
  '시흥시': { lat: 37.3800, lng: 126.8028 },
  '군포시': { lat: 37.3614, lng: 126.9352 },
  '의왕시': { lat: 37.3446, lng: 126.9685 },
  '하남시': { lat: 37.5392, lng: 127.2148 },
  '용인시': { lat: 37.2411, lng: 127.1776 },
  '파주시': { lat: 37.7591, lng: 126.7800 },
  '이천시': { lat: 37.2792, lng: 127.4350 },
  '안성시': { lat: 37.0079, lng: 127.2798 },
  '김포시': { lat: 37.6153, lng: 126.7156 },
  '화성시': { lat: 37.1995, lng: 126.8313 },
  '광주시': { lat: 37.4095, lng: 127.2550 },
  '양주시': { lat: 37.7852, lng: 127.0456 },
  '포천시': { lat: 37.8949, lng: 127.2003 },
  '여주시': { lat: 37.2982, lng: 127.6370 },
  '연천군': { lat: 38.0964, lng: 127.0752 },
  '가평군': { lat: 37.8315, lng: 127.5095 },
  '양평군': { lat: 37.4918, lng: 127.4874 },

  // 부산광역시
  '중구': { lat: 35.1064, lng: 129.0328 },
  '서구': { lat: 35.0976, lng: 129.0243 },
  '동구': { lat: 35.1294, lng: 129.0450 },
  '영도구': { lat: 35.0911, lng: 129.0680 },
  '부산진구': { lat: 35.1629, lng: 129.0532 },
  '동래구': { lat: 35.1960, lng: 129.0838 },
  '남구': { lat: 35.1366, lng: 129.0844 },
  '북구': { lat: 35.1972, lng: 128.9903 },
  '해운대구': { lat: 35.1631, lng: 129.1636 },
  '사하구': { lat: 35.1046, lng: 128.9749 },
  '금정구': { lat: 35.2428, lng: 129.0920 },
  '강서구': { lat: 35.1121, lng: 128.9352 },
  '연제구': { lat: 35.1764, lng: 129.0798 },
  '수영구': { lat: 35.1457, lng: 129.1131 },
  '사상구': { lat: 35.1526, lng: 128.9913 },
  '기장군': { lat: 35.2446, lng: 129.2219 },

  // 대구광역시
  '중구': { lat: 35.8691, lng: 128.6062 },
  '동구': { lat: 35.8868, lng: 128.6359 },
  '서구': { lat: 35.8717, lng: 128.5591 },
  '남구': { lat: 35.8462, lng: 128.5976 },
  '북구': { lat: 35.8860, lng: 128.5830 },
  '수성구': { lat: 35.8585, lng: 128.6305 },
  '달서구': { lat: 35.8282, lng: 128.5329 },
  '달성군': { lat: 35.7747, lng: 128.4314 },

  // 인천광역시
  '중구': { lat: 37.4738, lng: 126.6217 },
  '동구': { lat: 37.4736, lng: 126.6433 },
  '미추홀구': { lat: 37.4635, lng: 126.6503 },
  '연수구': { lat: 37.4101, lng: 126.6783 },
  '남동구': { lat: 37.4485, lng: 126.7315 },
  '부평구': { lat: 37.5067, lng: 126.7219 },
  '계양구': { lat: 37.5371, lng: 126.7378 },
  '서구': { lat: 37.5457, lng: 126.6760 },
  '강화군': { lat: 37.7468, lng: 126.4878 },
  '옹진군': { lat: 37.4467, lng: 126.6367 },

  // 기타 주요 도시 (더 추가 가능)
  '춘천시': { lat: 37.8813, lng: 127.7298 },
  '원주시': { lat: 37.3422, lng: 127.9202 },
  '강릉시': { lat: 37.7519, lng: 128.8761 },
  '청주시': { lat: 36.6424, lng: 127.4890 },
  '충주시': { lat: 36.9910, lng: 127.9259 },
  '천안시': { lat: 36.8151, lng: 127.1139 },
  '아산시': { lat: 36.7898, lng: 127.0018 },
  '전주시': { lat: 35.8242, lng: 127.1480 },
  '익산시': { lat: 35.9483, lng: 126.9577 },
  '군산시': { lat: 35.9676, lng: 126.7367 },
  '목포시': { lat: 34.8118, lng: 126.3922 },
  '여수시': { lat: 34.7604, lng: 127.6622 },
  '순천시': { lat: 34.9506, lng: 127.4872 },
  '포항시': { lat: 36.0190, lng: 129.3435 },
  '경주시': { lat: 35.8562, lng: 129.2247 },
  '구미시': { lat: 36.1195, lng: 128.3446 },
  '창원시': { lat: 35.2279, lng: 128.6811 },
  '진주시': { lat: 35.1799, lng: 128.1076 },
  '김해시': { lat: 35.2285, lng: 128.8894 },
  '제주시': { lat: 33.4996, lng: 126.5312 },
  '서귀포시': { lat: 33.2541, lng: 126.5601 },
};

function extractDistrict(address) {
  if (!address) return null;

  // 패턴: "시/도 시/군/구 동/면/읍/리"
  // 예: "서울특별시 송파구 송이로 45"
  const patterns = [
    /([가-힣]+시)\s/,      // ~시
    /([가-힣]+구)\s/,      // ~구
    /([가-힣]+군)\s/,      // ~군
  ];

  for (const pattern of patterns) {
    const match = address.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function getApproxCoordinates(school) {
  // 1. 주소에서 구/시/군 추출
  const district = extractDistrict(school.address);

  // 2. 구/시/군 좌표 확인
  if (district && DISTRICT_CENTERS[district]) {
    const center = DISTRICT_CENTERS[district];
    // 약간의 랜덤 오프셋 추가 (같은 구 내 학교들이 겹치지 않도록)
    const offset = 0.01; // ~1km
    return {
      lat: center.lat + (Math.random() - 0.5) * offset,
      lng: center.lng + (Math.random() - 0.5) * offset,
      accuracy: 'district',
    };
  }

  // 3. 시/도 중심 좌표 사용
  if (school.region && REGION_CENTERS[school.region]) {
    const center = REGION_CENTERS[school.region];
    const offset = 0.1; // ~10km
    return {
      lat: center.lat + (Math.random() - 0.5) * offset,
      lng: center.lng + (Math.random() - 0.5) * offset,
      accuracy: 'region',
    };
  }

  // 4. 기본값 (서울 중심)
  return {
    lat: 37.5665 + (Math.random() - 0.5) * 0.1,
    lng: 126.9780 + (Math.random() - 0.5) * 0.1,
    accuracy: 'default',
  };
}

async function main() {
  console.log('📍 학교 근사 좌표 추가 시작\n');
  console.log('='.repeat(60));

  // Load schools
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ 입력 파일을 찾을 수 없습니다: ${INPUT_FILE}`);
    console.error('   먼저 node scripts/fetch-schools.js 를 실행하세요.');
    process.exit(1);
  }

  const schools = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`📚 총 ${schools.length}개 학교 로드됨`);

  // Add coordinates
  const stats = {
    district: 0,
    region: 0,
    default: 0,
  };

  const processedSchools = schools.map(school => {
    if (school.latitude && school.longitude) {
      return school; // 이미 좌표가 있으면 스킵
    }

    const coords = getApproxCoordinates(school);
    stats[coords.accuracy]++;

    return {
      ...school,
      latitude: coords.lat,
      longitude: coords.lng,
      coord_accuracy: coords.accuracy,
    };
  });

  // Save result
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedSchools, null, 2));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 좌표 추가 완료!');
  console.log('='.repeat(60));
  console.log(`  ✅ 구/시/군 기준: ${stats.district}개`);
  console.log(`  📍 시/도 기준: ${stats.region}개`);
  console.log(`  ⚠️  기본값: ${stats.default}개`);
  console.log(`\n💾 저장됨: ${OUTPUT_FILE}`);

  // Generate TypeScript file
  generateTypescript(processedSchools);
}

function generateTypescript(schools) {
  const tsOutputFile = path.join(__dirname, '..', 'src', 'data', 'schools-generated.ts');

  // Generate unique IDs
  const schoolsWithIds = schools.map((school, index) => ({
    id: `school_${school.atpt_ofcdc_sc_code}_${school.sd_schul_code}`,
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
    high_school_type: school.high_school_type,
  }));

  const tsContent = `// Auto-generated file - DO NOT EDIT
// Generated from NEIS API data
// Total: ${schools.length} schools

export interface SchoolData {
  id: string;
  name: string;
  short_name: string | null;
  type: '중학교' | '고등학교';
  region: string;
  district: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  active_rooms_count: number;
  total_members: number;
  high_school_type: string | null;
}

export const SCHOOLS_DATA: SchoolData[] = ${JSON.stringify(schoolsWithIds, null, 2)};

// Export count for reference
export const SCHOOLS_COUNT = ${schools.length};

// Export by region
export const SCHOOLS_BY_REGION: Record<string, SchoolData[]> = {};
SCHOOLS_DATA.forEach(school => {
  if (!SCHOOLS_BY_REGION[school.region]) {
    SCHOOLS_BY_REGION[school.region] = [];
  }
  SCHOOLS_BY_REGION[school.region].push(school);
});
`;

  fs.writeFileSync(tsOutputFile, tsContent);
  console.log(`\n📝 TypeScript 파일 생성됨: ${tsOutputFile}`);
}

main().catch(console.error);
