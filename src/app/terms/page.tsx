import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/signup" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">이용약관</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-500 mb-6">시행일: 2024년 1월 1일</p>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제1조 (목적)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              본 약관은 스터플(이하 &quot;회사&quot;)이 제공하는 서비스의 이용조건 및 절차, 회사와 이용자의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제2조 (정의)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>&quot;서비스&quot;란 회사가 제공하는 모든 서비스를 의미합니다.</li>
              <li>&quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
              <li>&quot;회원&quot;이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며, 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
              <li>&quot;크리에이터&quot;란 회원 중 콘텐츠를 제작하여 서비스에 업로드하는 자를 말합니다.</li>
              <li>&quot;콘텐츠&quot;란 크리에이터가 서비스에 업로드한 동영상, 이미지, 문서, 오디오 등 모든 형태의 자료를 말합니다.</li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>본 약관은 서비스를 이용하고자 하는 모든 이용자에게 그 효력이 발생합니다.</li>
              <li>회사는 필요하다고 인정되는 경우 본 약관을 변경할 수 있으며, 변경된 약관은 서비스 화면에 공지함으로써 효력이 발생합니다.</li>
              <li>이용자는 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다.</li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제4조 (회원가입)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>회원가입은 이용자가 본 약관에 동의하고, 회사가 정한 양식에 따라 회원정보를 기입한 후 회원가입 신청을 하면, 회사가 이를 승낙함으로써 완료됩니다.</li>
              <li>회사는 다음 각 호에 해당하는 경우 회원가입을 거절할 수 있습니다.
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>타인의 명의를 도용한 경우</li>
                  <li>허위의 정보를 기재한 경우</li>
                  <li>만 14세 미만인 경우</li>
                  <li>기타 회사가 정한 이용신청 요건을 충족하지 못한 경우</li>
                </ul>
              </li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제5조 (서비스의 제공)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>회사는 다음과 같은 서비스를 제공합니다.
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>콘텐츠 업로드 및 공유 서비스</li>
                  <li>구독 및 결제 서비스</li>
                  <li>크리에이터 수익 정산 서비스</li>
                  <li>기타 회사가 정하는 서비스</li>
                </ul>
              </li>
              <li>서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.</li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제6조 (서비스 이용료)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>회사가 제공하는 서비스는 기본적으로 무료입니다. 단, 유료 콘텐츠 및 구독 서비스는 별도의 요금이 부과됩니다.</li>
              <li>크리에이터의 수익에서 회사는 플랫폼 이용료로 15%를 공제합니다.</li>
              <li>결제 취소 및 환불은 관련 법령 및 회사의 환불 정책에 따릅니다.</li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제7조 (이용자의 의무)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              이용자는 다음 행위를 하여서는 안 됩니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>타인의 정보 도용</li>
              <li>회사가 게시한 정보의 변경</li>
              <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 송신 또는 게시</li>
              <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
              <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
              <li>외설 또는 폭력적인 메시지, 화상, 음성 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제8조 (저작권의 귀속)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>크리에이터가 업로드한 콘텐츠의 저작권은 해당 크리에이터에게 귀속됩니다.</li>
              <li>이용자는 서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.</li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제9조 (면책조항)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
              <li>회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
              <li>회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖에 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제10조 (분쟁해결)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 고객센터를 운영합니다.</li>
              <li>회사와 이용자 간에 발생한 분쟁은 대한민국 법률에 따라 해결합니다.</li>
              <li>서비스 이용으로 발생한 분쟁에 대해 소송이 제기될 경우 회사의 본사 소재지를 관할하는 법원을 전속관할법원으로 합니다.</li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">부칙</h2>
            <p className="text-gray-600 leading-relaxed">
              본 약관은 2024년 1월 1일부터 시행됩니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
