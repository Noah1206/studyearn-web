'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { pageVariants } from '@/components/ui/motion/variants';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <header className="bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">개인정보처리방침</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-500 mb-6">시행일: 2024년 1월 1일</p>

            <p className="text-gray-600 leading-relaxed mb-6">
              스터플(이하 &quot;회사&quot;)은 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.
            </p>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제1조 (개인정보의 수집 항목 및 수집 방법)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 서비스 제공을 위해 필요한 최소한의 개인정보를 수집합니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>
                <strong>필수 수집 항목</strong>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>회원가입: 이름, 이메일, 휴대폰 번호</li>
                  <li>결제: 결제 정보(카드번호는 결제대행사에서 처리)</li>
                  <li>크리에이터 등록: 계좌정보(정산용)</li>
                </ul>
              </li>
              <li>
                <strong>자동 수집 항목</strong>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>IP 주소, 쿠키, 방문 일시, 서비스 이용 기록, 기기 정보</li>
                </ul>
              </li>
              <li>
                <strong>수집 방법</strong>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>회원가입, 서비스 이용, 고객센터 문의</li>
                  <li>생성정보 수집 툴을 통한 자동 수집</li>
                </ul>
              </li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제2조 (개인정보의 수집 및 이용 목적)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 수집한 개인정보를 다음의 목적을 위해 이용합니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인식별, 불량회원의 부정 이용 방지</li>
              <li>서비스 제공: 콘텐츠 제공, 결제 및 정산, 고객 지원</li>
              <li>마케팅 및 광고: 신규 서비스 안내, 이벤트 정보 제공 (선택 동의 시)</li>
              <li>서비스 개선: 서비스 이용 통계, 신규 서비스 개발</li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제3조 (개인정보의 보유 및 이용 기간)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령에 따라 보존할 필요가 있는 경우에는 아래와 같이 보관합니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
              <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
              <li>표시/광고에 관한 기록: 6개월 (전자상거래법)</li>
              <li>웹사이트 방문기록: 3개월 (통신비밀보호법)</li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제4조 (개인정보의 제3자 제공)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제5조 (개인정보 처리의 위탁)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 서비스 향상을 위해 아래와 같이 개인정보를 위탁하고 있습니다.
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">수탁업체</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">위탁 업무 내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">KG이니시스</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">결제 처리</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">카카오페이</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">간편 결제 처리</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">Supabase</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">데이터 저장 및 인증</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제6조 (이용자의 권리와 행사 방법)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              이용자는 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ol>
            <p className="text-gray-600 leading-relaxed mb-4">
              위 권리 행사는 서비스 내 설정 페이지 또는 이메일(ab40905045@gmail.com)을 통해 가능합니다.
            </p>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제7조 (개인정보의 파기)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>전자적 파일 형태: 복구 및 재생이 불가능한 방법으로 영구 삭제</li>
              <li>종이 문서: 분쇄기로 분쇄하거나 소각</li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제8조 (개인정보의 안전성 확보 조치)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 개인정보보호법에 따라 다음과 같이 안전성 확보에 필요한 기술적, 관리적, 물리적 조치를 하고 있습니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>개인정보 암호화: 비밀번호 및 중요 정보는 암호화하여 저장</li>
              <li>해킹 등에 대비한 기술적 대책: 침입 차단 시스템을 운영</li>
              <li>접근 권한 관리: 개인정보 취급 직원을 최소화하고 정기 교육 실시</li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제9조 (개인정보 보호책임자)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700 font-medium">개인정보 보호책임자</p>
              <ul className="mt-2 space-y-1 text-gray-600 text-sm">
                <li>이메일: ab40905045@gmail.com</li>
              </ul>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제10조 (권익침해 구제방법)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에 문의하시기 바랍니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              <li>개인정보침해신고센터 (privacy.kisa.or.kr / 118)</li>
              <li>대검찰청 사이버수사과 (www.spo.go.kr / 02-3480-3573)</li>
              <li>경찰청 사이버안전국 (cyberbureau.police.go.kr / 182)</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">부칙</h2>
            <p className="text-gray-600 leading-relaxed">
              본 방침은 2024년 1월 1일부터 시행됩니다.
            </p>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
