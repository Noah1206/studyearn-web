import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/signup" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">개인정보 처리방침</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-500 mb-6">시행일: 2024년 1월 1일</p>

            <p className="text-gray-600 leading-relaxed mb-6">
              스터플(이하 &quot;회사&quot;)은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 및 관련 법령을 준수하고 있습니다. 회사는 개인정보처리방침을 통해 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보 보호를 위해 어떠한 조치를 취하고 있는지 알려드립니다.
            </p>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">1. 수집하는 개인정보 항목</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 회원가입, 서비스 이용, 고객상담 등을 위해 아래와 같은 개인정보를 수집합니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              <li>필수항목: 이메일 주소, 비밀번호, 닉네임</li>
              <li>선택항목: 프로필 사진, 학교명, 자기소개</li>
              <li>자동수집항목: IP 주소, 쿠키, 서비스 이용 기록, 접속 로그, 기기정보</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">2. 개인정보의 수집 및 이용목적</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 수집한 개인정보를 다음의 목적을 위해 이용합니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              <li>회원 가입 및 관리: 회원 가입 의사 확인, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지</li>
              <li>서비스 제공: 콘텐츠 제공, 구독 서비스 제공, 결제 및 정산</li>
              <li>마케팅 및 광고: 이벤트 정보 및 참여기회 제공, 서비스 이용 통계 및 분석</li>
              <li>고충처리: 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">3. 개인정보의 보유 및 이용기간</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계 법령의 규정에 의해 보존할 필요가 있는 경우 회사는 아래와 같이 일정 기간 동안 회원정보를 보관합니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래등에서의 소비자보호에 관한 법률)</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래등에서의 소비자보호에 관한 법률)</li>
              <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래등에서의 소비자보호에 관한 법률)</li>
              <li>접속에 관한 기록: 3개월 (통신비밀보호법)</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">4. 개인정보의 제3자 제공</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">5. 개인정보 처리의 위탁</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 서비스 향상을 위해 아래와 같이 개인정보를 위탁하고 있으며, 관계 법령에 따라 위탁계약 시 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              <li>결제대행: 토스페이먼츠 (결제 처리)</li>
              <li>클라우드 서비스: Supabase (데이터 저장 및 관리)</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">6. 이용자의 권리와 행사방법</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원탈퇴를 통해 개인정보 이용에 대한 동의를 철회할 수 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              <li>개인정보 조회/수정: 프로필 &gt; 설정 &gt; 개인정보</li>
              <li>회원탈퇴: 프로필 &gt; 설정 &gt; 계정 &gt; 계정 삭제</li>
              <li>기타 문의: support@stuple.kr</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">7. 개인정보의 파기</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 원칙적으로 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              <li>전자적 파일 형태의 정보: 복구 및 재생이 불가능한 방법으로 영구 삭제</li>
              <li>종이에 출력된 개인정보: 분쇄기로 분쇄하거나 소각</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">8. 개인정보의 안전성 확보조치</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
              <li>기술적 조치: 개인정보 암호화, 접근권한 관리, 보안프로그램 설치</li>
              <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">9. 쿠키의 운용 및 거부</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 쿠키(cookie)를 사용합니다. 이용자는 웹브라우저 설정을 통해 쿠키의 저장을 거부할 수 있습니다. 단, 쿠키 저장을 거부할 경우 일부 서비스 이용에 어려움이 있을 수 있습니다.
            </p>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">10. 개인정보 보호책임자</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              <li>개인정보 보호책임자: 홍길동</li>
              <li>연락처: privacy@stuple.kr</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">11. 개인정보 처리방침의 변경</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              본 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 서비스 화면을 통해 공지할 것입니다.
            </p>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">12. 권익침해 구제방법</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              이용자는 개인정보침해로 인한 피해를 구제 받기 위하여 아래의 기관에 상담 등을 요청할 수 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              <li>개인정보침해신고센터: (국번없이) 118</li>
              <li>개인정보분쟁조정위원회: 1833-6972</li>
              <li>대검찰청 사이버범죄수사단: (국번없이) 1301</li>
              <li>경찰청 사이버안전국: (국번없이) 182</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">부칙</h2>
            <p className="text-gray-600 leading-relaxed">
              본 개인정보처리방침은 2024년 1월 1일부터 시행됩니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
