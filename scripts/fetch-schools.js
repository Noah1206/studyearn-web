/**
 * NEIS API에서 전국 중·고등학교 데이터 수집
 * 시도교육청별로 쿼리하여 전국 모든 학교 수집
 * 실행: node scripts/fetch-schools.js
 */

const fs = require('fs');
const path = require('path');

const NEIS_API_BASE = 'https://open.neis.go.kr/hub/schoolInfo';
const NEIS_API_KEY = '094e251dbec642438c6c0dfef0f74f87';
const PAGE_SIZE = 1000;

// 전국 시도교육청 코드
const EDUCATION_OFFICES = [
  { code: 'B10', name: '서울특별시' },
  { code: 'C10', name: '부산광역시' },
  { code: 'D10', name: '대구광역시' },
  { code: 'E10', name: '인천광역시' },
  { code: 'F10', name: '광주광역시' },
  { code: 'G10', name: '대전광역시' },
  { code: 'H10', name: '울산광역시' },
  { code: 'I10', name: '세종특별자치시' },
  { code: 'J10', name: '경기도' },
  { code: 'K10', name: '강원특별자치도' },
  { code: 'M10', name: '충청북도' },
  { code: 'N10', name: '충청남도' },
  { code: 'P10', name: '전북특별자치도' },
  { code: 'Q10', name: '전라남도' },
  { code: 'R10', name: '경상북도' },
  { code: 'S10', name: '경상남도' },
  { code: 'T10', name: '제주특별자치도' },
];

async function fetchSchoolsByRegionAndType(officeCode, officeName, schoolType) {
  console.log(`  📍 ${officeName} ${schoolType} 조회 중...`);

  let allSchools = [];
  let pageIndex = 1;
  let totalCount = 0;

  while (true) {
    const url = `${NEIS_API_BASE}?KEY=${NEIS_API_KEY}&Type=json&pIndex=${pageIndex}&pSize=${PAGE_SIZE}&ATPT_OFCDC_SC_CODE=${officeCode}&SCHUL_KND_SC_NM=${encodeURIComponent(schoolType)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // RESULT 키가 있으면 에러 응답
      if (data.RESULT) {
        // INFO-200: 해당 조건에 맞는 데이터 없음
        if (data.RESULT.CODE === 'INFO-200') {
          console.log(`    ⚠️ ${officeName} ${schoolType}: 데이터 없음`);
          break;
        }
        console.log(`    ❌ 에러: ${data.RESULT.MESSAGE}`);
        break;
      }

      if (!data.schoolInfo) {
        console.log(`    ⚠️ 데이터 구조 오류 (페이지 ${pageIndex})`);
        break;
      }

      const head = data.schoolInfo[0].head;
      const rows = data.schoolInfo[1].row;

      if (pageIndex === 1) {
        totalCount = head[0].list_total_count;
        console.log(`    📊 총 ${totalCount}개 발견`);
      }

      allSchools = allSchools.concat(rows);

      if (allSchools.length >= totalCount) {
        break;
      }

      pageIndex++;

      // Rate limiting - 0.3초 대기
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.error(`    ❌ 에러 (페이지 ${pageIndex}):`, error.message);
      break;
    }
  }

  return allSchools;
}

async function main() {
  console.log('🏫 전국 중·고등학교 데이터 수집 시작\n');
  console.log('='.repeat(60));

  const allSchools = [];
  const stats = {
    byRegion: {},
    byType: { '중학교': 0, '고등학교': 0 },
    byHighSchoolType: {},
  };

  // 각 시도교육청별로 수집
  for (const office of EDUCATION_OFFICES) {
    console.log(`\n📚 ${office.name} 데이터 수집...`);

    stats.byRegion[office.name] = { '중학교': 0, '고등학교': 0 };

    // 중학교 수집
    const middleSchools = await fetchSchoolsByRegionAndType(office.code, office.name, '중학교');
    stats.byRegion[office.name]['중학교'] = middleSchools.length;
    stats.byType['중학교'] += middleSchools.length;

    // 고등학교 수집
    const highSchools = await fetchSchoolsByRegionAndType(office.code, office.name, '고등학교');
    stats.byRegion[office.name]['고등학교'] = highSchools.length;
    stats.byType['고등학교'] += highSchools.length;

    // 데이터 정제 및 추가
    const processSchool = (school, type) => ({
      sd_schul_code: school.SD_SCHUL_CODE,
      atpt_ofcdc_sc_code: school.ATPT_OFCDC_SC_CODE,
      name: school.SCHUL_NM,
      english_name: school.ENG_SCHUL_NM || null,
      type: type,
      region: school.LCTN_SC_NM,
      district: school.JU_ORG_NM,
      address: school.ORG_RDNMA,
      foundation_type: school.FOND_SC_NM, // 공립, 사립
      coedu_type: school.COEDU_SC_NM, // 남여공학, 남, 여
      day_night: school.DGHT_SC_NM, // 주간, 야간
      high_school_type: school.HS_SC_NM || null, // 일반고, 특목고, 특성화고 등
      homepage: school.HMPG_ADRES || null,
      tel: school.ORG_TELNO || null,
      founded_date: school.FOND_YMD || null,
      latitude: null,
      longitude: null,
    });

    middleSchools.forEach(s => {
      allSchools.push(processSchool(s, '중학교'));
    });

    highSchools.forEach(s => {
      const processed = processSchool(s, '고등학교');
      allSchools.push(processed);

      // 고등학교 유형 통계
      const hsType = processed.high_school_type || '기타';
      stats.byHighSchoolType[hsType] = (stats.byHighSchoolType[hsType] || 0) + 1;
    });

    console.log(`    ✅ ${office.name}: 중학교 ${middleSchools.length}개, 고등학교 ${highSchools.length}개`);

    // Region간 Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'schools-raw.json');
  fs.writeFileSync(outputPath, JSON.stringify(allSchools, null, 2), 'utf-8');

  // 통계 출력
  console.log('\n' + '='.repeat(60));
  console.log('📊 수집 결과 요약');
  console.log('='.repeat(60));
  console.log(`  중학교: ${stats.byType['중학교']}개`);
  console.log(`  고등학교: ${stats.byType['고등학교']}개`);
  console.log(`  총계: ${allSchools.length}개`);
  console.log(`\n💾 저장 위치: ${outputPath}`);

  // 지역별 통계
  console.log('\n📍 지역별 분포:');
  Object.entries(stats.byRegion)
    .sort((a, b) => (b[1]['중학교'] + b[1]['고등학교']) - (a[1]['중학교'] + a[1]['고등학교']))
    .forEach(([region, counts]) => {
      const total = counts['중학교'] + counts['고등학교'];
      console.log(`  ${region}: ${total}개 (중 ${counts['중학교']}, 고 ${counts['고등학교']})`);
    });

  // 고등학교 유형별 통계
  console.log('\n🎓 고등학교 유형별 분포:');
  Object.entries(stats.byHighSchoolType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}개`);
    });

  // 통계 파일 저장
  const statsPath = path.join(__dirname, 'schools-stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
  console.log(`\n📈 통계 저장: ${statsPath}`);
}

main().catch(console.error);
