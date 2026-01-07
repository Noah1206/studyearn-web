/**
 * 학교 주소를 위도/경도로 변환 (Kakao Geocoding API)
 *
 * 사용법:
 *   KAKAO_REST_KEY=your_key node scripts/geocode-schools.js
 *
 * 또는 .env.local에 NEXT_PUBLIC_KAKAO_REST_API_KEY 설정 후:
 *   node scripts/geocode-schools.js
 *
 * 옵션:
 *   --batch=N  한 번에 처리할 개수 (기본: 100)
 *   --delay=N  요청 간 딜레이 ms (기본: 100)
 *   --resume   이전 진행 상황에서 계속
 */

const fs = require('fs');
const path = require('path');

// Load .env.local if exists
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
} catch (e) {
  // Ignore
}

const KAKAO_API_KEY = process.env.KAKAO_REST_KEY ||
                       process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY ||
                       '';

const INPUT_FILE = path.join(__dirname, 'schools-raw.json');
const OUTPUT_FILE = path.join(__dirname, 'schools-geocoded.json');
const PROGRESS_FILE = path.join(__dirname, 'geocode-progress.json');

// Parse command line arguments
const args = process.argv.slice(2);
const BATCH_SIZE = parseInt(args.find(a => a.startsWith('--batch='))?.split('=')[1] || '100');
const DELAY_MS = parseInt(args.find(a => a.startsWith('--delay='))?.split('=')[1] || '100');
const RESUME = args.includes('--resume');

async function geocodeAddress(address) {
  if (!address || !KAKAO_API_KEY) {
    return null;
  }

  try {
    // Try address search first
    const addressResponse = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_API_KEY}`,
        },
      }
    );

    const addressData = await addressResponse.json();

    if (addressData.documents && addressData.documents.length > 0) {
      const doc = addressData.documents[0];
      return {
        latitude: parseFloat(doc.y),
        longitude: parseFloat(doc.x),
        method: 'address',
      };
    }

    // Fallback to keyword search
    const keywordResponse = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_API_KEY}`,
        },
      }
    );

    const keywordData = await keywordResponse.json();

    if (keywordData.documents && keywordData.documents.length > 0) {
      const doc = keywordData.documents[0];
      return {
        latitude: parseFloat(doc.y),
        longitude: parseFloat(doc.x),
        method: 'keyword',
      };
    }

    return null;
  } catch (error) {
    console.error(`  ❌ Geocoding error for "${address}":`, error.message);
    return null;
  }
}

async function main() {
  console.log('🗺️  학교 지오코딩 시작\n');
  console.log('='.repeat(60));
  console.log(`📁 입력: ${INPUT_FILE}`);
  console.log(`📁 출력: ${OUTPUT_FILE}`);
  console.log(`⚙️  배치 크기: ${BATCH_SIZE}`);
  console.log(`⏱️  딜레이: ${DELAY_MS}ms`);
  console.log('='.repeat(60));

  // Check API key
  if (!KAKAO_API_KEY) {
    console.error('\n❌ Kakao REST API 키가 필요합니다.');
    console.error('   KAKAO_REST_KEY=your_key node scripts/geocode-schools.js');
    console.error('   또는 .env.local에 NEXT_PUBLIC_KAKAO_REST_API_KEY 설정');
    process.exit(1);
  }

  console.log(`🔑 API 키: ${KAKAO_API_KEY.substring(0, 8)}...`);

  // Load schools
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`\n❌ 입력 파일을 찾을 수 없습니다: ${INPUT_FILE}`);
    console.error('   먼저 node scripts/fetch-schools.js 를 실행하세요.');
    process.exit(1);
  }

  const schools = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`\n📚 총 ${schools.length}개 학교 로드됨`);

  // Load progress if resuming
  let startIndex = 0;
  let geocodedSchools = [];

  if (RESUME && fs.existsSync(PROGRESS_FILE)) {
    const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    startIndex = progress.lastIndex || 0;
    geocodedSchools = progress.schools || [];
    console.log(`📍 이전 진행 상황에서 재개: ${startIndex}/${schools.length}`);
  }

  // Process schools
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  for (let i = startIndex; i < schools.length; i++) {
    const school = schools[i];

    // Skip if already has coordinates
    if (school.latitude && school.longitude) {
      geocodedSchools.push(school);
      successCount++;
      continue;
    }

    // Try geocoding with address
    const result = await geocodeAddress(school.address);

    if (result) {
      school.latitude = result.latitude;
      school.longitude = result.longitude;
      successCount++;
    } else {
      // Try with school name + region
      const fallbackQuery = `${school.region} ${school.name}`;
      const fallbackResult = await geocodeAddress(fallbackQuery);

      if (fallbackResult) {
        school.latitude = fallbackResult.latitude;
        school.longitude = fallbackResult.longitude;
        successCount++;
      } else {
        failCount++;
      }
    }

    geocodedSchools.push(school);

    // Progress report
    if ((i + 1) % 100 === 0 || i === schools.length - 1) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = (i - startIndex + 1) / elapsed;
      const remaining = (schools.length - i - 1) / rate;

      console.log(`\n📊 진행: ${i + 1}/${schools.length} (${((i + 1) / schools.length * 100).toFixed(1)}%)`);
      console.log(`   ✅ 성공: ${successCount}, ❌ 실패: ${failCount}`);
      console.log(`   ⏱️  소요: ${elapsed.toFixed(1)}초, 예상 남은 시간: ${remaining.toFixed(1)}초`);

      // Save progress
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
        lastIndex: i + 1,
        schools: geocodedSchools,
      }, null, 2));
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }

  // Save final result
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geocodedSchools, null, 2));

  // Summary
  const withCoords = geocodedSchools.filter(s => s.latitude && s.longitude).length;
  const withoutCoords = geocodedSchools.filter(s => !s.latitude || !s.longitude).length;

  console.log('\n' + '='.repeat(60));
  console.log('📊 지오코딩 완료!');
  console.log('='.repeat(60));
  console.log(`  ✅ 좌표 있음: ${withCoords}개 (${(withCoords / geocodedSchools.length * 100).toFixed(1)}%)`);
  console.log(`  ❌ 좌표 없음: ${withoutCoords}개`);
  console.log(`\n💾 저장됨: ${OUTPUT_FILE}`);

  // Cleanup progress file
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }
}

main().catch(console.error);
