'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { pageVariants } from '@/components/ui/motion/variants';
import Link from 'next/link';

export default function TermsPage() {
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
            <h1 className="text-xl font-bold">이용약관</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-500 mb-6">시행일: 2025년 1월 1일 | 최종 수정일: 2025년 1월 27일</p>

            {/* 제1장 총칙 */}
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-6 pb-2 border-b">제1장 총칙</h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제1조 (목적)</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              본 약관은 스터플(이하 &quot;회사&quot;)이 운영하는 웹사이트 및 모바일 애플리케이션(이하 &quot;플랫폼&quot;)을 통해 제공하는 디지털 학습 콘텐츠 서비스(이하 &quot;서비스&quot;)의 이용조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제2조 (정의)</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
            </p>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li><strong>&quot;플랫폼&quot;</strong>이란 회사가 디지털 학습 콘텐츠를 이용자에게 제공하기 위하여 컴퓨터, 모바일 기기 등 정보통신설비를 이용하여 설정한 가상의 영업장을 말하며, 웹사이트(studyearn-web.vercel.app) 및 모바일 애플리케이션을 포함합니다.</li>
              <li><strong>&quot;이용자&quot;</strong>란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
              <li><strong>&quot;회원&quot;</strong>이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사가 제공하는 서비스를 지속적으로 이용할 수 있는 자를 말합니다.</li>
              <li><strong>&quot;비회원&quot;</strong>이란 회원에 가입하지 않고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
              <li><strong>&quot;크리에이터&quot;</strong>란 회원 중 회사와 별도의 크리에이터 계약을 체결하고 콘텐츠를 제작하여 플랫폼에 등록·판매하는 자를 말합니다.</li>
              <li><strong>&quot;콘텐츠&quot;</strong>란 크리에이터가 플랫폼에 등록한 학습 자료로서, 동영상, PDF 문서, 이미지, 학습 루틴, 플래너 등 디지털 형태의 모든 학습 자료를 말합니다.</li>
              <li><strong>&quot;유료 콘텐츠&quot;</strong>란 이용자가 결제를 통해 이용권을 구매해야 이용할 수 있는 콘텐츠를 말합니다.</li>
              <li><strong>&quot;구매&quot;</strong>란 이용자가 유료 콘텐츠의 이용권을 취득하기 위해 대금을 결제하는 행위를 말합니다.</li>
              <li><strong>&quot;다운로드&quot;</strong>란 이용자가 콘텐츠 파일을 자신의 기기에 저장하는 행위를 말합니다.</li>
              <li><strong>&quot;열람&quot;</strong>이란 이용자가 콘텐츠를 스트리밍, 미리보기 등의 방식으로 확인하는 행위를 말합니다.</li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제3조 (약관의 게시와 개정)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 플랫폼의 초기 화면 또는 연결화면에 게시합니다.</li>
              <li>회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 「콘텐츠산업 진흥법」 등 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</li>
              <li>회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행 약관과 함께 플랫폼에 그 적용일자 7일 전부터 적용일자 전일까지 공지합니다. 다만, 이용자에게 불리한 약관의 개정의 경우에는 30일 전부터 공지합니다.</li>
              <li>이용자가 개정약관의 적용에 동의하지 않는 경우, 이용자는 이용계약을 해지할 수 있습니다. 개정약관의 효력 발생일 이후에도 서비스를 계속 이용하는 경우에는 약관의 변경사항에 동의한 것으로 봅니다.</li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제4조 (약관 외 준칙)</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              본 약관에서 정하지 아니한 사항과 본 약관의 해석에 관하여는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「콘텐츠산업 진흥법」, 공정거래위원회가 정하는 「전자상거래 등에서의 소비자보호지침」 및 관계 법령 또는 상관례에 따릅니다.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제4조의2 (개인정보 처리)</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 이용자의 개인정보를 「개인정보보호법」 및 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」에 따라 보호하며, 개인정보의 수집·이용·보관·파기 등에 관한 사항은 <Link href="/privacy" className="text-orange-600 hover:underline font-medium">개인정보처리방침</Link>에서 정한 바에 따릅니다.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
              <p className="text-sm text-gray-700">
                <strong>개인정보처리방침</strong>은 본 약관과 별도로 관리되며, 개인정보 수집 항목, 이용 목적, 보관 기간, 제3자 제공, 파기 절차, 개인정보 보호책임자 정보 등을 포함합니다.
                <br />
                👉 <Link href="/privacy" className="text-orange-600 hover:underline">개인정보처리방침 바로가기</Link>
              </p>
            </div>

            {/* 제2장 회원가입 및 서비스 이용 */}
            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-6 pb-2 border-b">제2장 회원가입 및 서비스 이용</h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제5조 (회원가입)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</li>
              <li>회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>가입신청자가 본 약관 제8조에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                  <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                  <li>만 14세 미만인 경우</li>
                  <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                </ul>
              </li>
              <li>회원가입계약의 성립 시기는 회사의 승낙이 회원에게 도달한 시점으로 합니다.</li>
              <li>회원은 회원가입 시 등록한 사항에 변경이 있는 경우, 상당한 기간 이내에 회사에 대하여 회원정보 수정 등의 방법으로 그 변경사항을 알려야 합니다.</li>
              <li>만 14세 이상 만 19세 미만의 미성년자가 유료 서비스를 이용하고자 하는 경우, 법정대리인(부모 등)의 동의가 필요합니다. 미성년자가 결제를 진행하는 경우 법정대리인의 동의를 받은 것으로 간주합니다.</li>
            </ol>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 my-6">
              <p className="text-sm text-orange-800 font-medium mb-2">미성년자 이용 안내</p>
              <p className="text-sm text-orange-700">
                미성년자가 유료 콘텐츠를 구매하는 경우, 법정대리인이 해당 계약에 동의하지 아니하면 미성년자 본인 또는 법정대리인이 계약을 취소할 수 있습니다. 단, 미성년자가 법정대리인의 동의 없이 결제한 경우라도 법정대리인의 동의가 있었던 것으로 믿게 한 경우(법정대리인 명의 결제수단 사용 등)에는 취소가 제한될 수 있습니다.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제6조 (회원 탈퇴 및 자격 상실)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>회원은 회사에 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.</li>
              <li>회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다.
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>가입 신청 시에 허위 내용을 등록한 경우</li>
                  <li>플랫폼을 이용하여 구입한 콘텐츠 등의 대금, 기타 플랫폼 이용에 관련하여 회원이 부담하는 채무를 기일에 지급하지 않는 경우</li>
                  <li>다른 사람의 플랫폼 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
                  <li>플랫폼을 이용하여 법령 또는 본 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
                </ul>
              </li>
              <li>회사가 회원 자격을 제한·정지시킨 후, 동일한 행위가 2회 이상 반복되거나 30일 이내에 그 사유가 시정되지 아니하는 경우 회사는 회원자격을 상실시킬 수 있습니다.</li>
              <li>회사가 회원자격을 상실시키는 경우에는 회원등록을 말소합니다. 이 경우 회원에게 이를 통지하고, 회원등록 말소 전에 최소한 30일 이상의 기간을 정하여 소명할 기회를 부여합니다.</li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제7조 (서비스의 제공 및 변경)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>회사는 다음과 같은 서비스를 제공합니다.
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>디지털 학습 콘텐츠(동영상, PDF, 이미지, 루틴 등) 열람 및 다운로드 서비스</li>
                  <li>콘텐츠 검색 및 추천 서비스</li>
                  <li>콘텐츠 구매 및 결제 서비스</li>
                  <li>크리에이터를 위한 콘텐츠 등록 및 판매 서비스</li>
                  <li>크리에이터 수익 정산 서비스</li>
                  <li>기타 회사가 추가 개발하거나 다른 회사와의 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
                </ul>
              </li>
              <li>회사는 콘텐츠의 품절 또는 기술적 사양의 변경 등의 경우에는 장차 체결되는 계약에 의해 제공할 콘텐츠의 내용을 변경할 수 있습니다. 이 경우에는 변경된 콘텐츠의 내용 및 제공일자를 명시하여 현재의 콘텐츠의 내용을 게시한 곳에 즉시 공지합니다.</li>
              <li>서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 다만, 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제8조 (서비스의 중단)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>회사는 컴퓨터 등 정보통신설비의 보수점검·교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
              <li>회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.</li>
              <li>사업종목의 전환, 사업의 포기, 업체 간의 통합 등의 이유로 서비스를 제공할 수 없게 되는 경우에는 회사는 제3조에서 정한 방법으로 이용자에게 통지하고 당초 회사에서 제시한 조건에 따라 소비자에게 보상합니다.</li>
            </ol>

            {/* 제3장 콘텐츠 구매 및 결제 */}
            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-6 pb-2 border-b">제3장 콘텐츠 구매 및 결제</h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제9조 (콘텐츠 정보의 제공)</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사는 이용자가 콘텐츠 구매 의사결정을 할 수 있도록 다음 각 호의 사항을 해당 콘텐츠 상세 페이지에 표시합니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>콘텐츠의 명칭, 종류 및 내용</li>
              <li>콘텐츠의 가격 및 결제 방법</li>
              <li>콘텐츠의 이용 방법 및 이용 조건</li>
              <li>청약철회 및 환불이 제한되는 경우 그 조건</li>
              <li>콘텐츠 제작자(크리에이터) 정보</li>
              <li>이용자 평점 및 리뷰</li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제10조 (구매신청 및 결제)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>이용자는 플랫폼에서 다음 또는 이와 유사한 방법에 의하여 구매를 신청하며, 회사는 이용자가 구매신청을 함에 있어서 다음의 각 내용을 알기 쉽게 제공하여야 합니다.
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>콘텐츠의 검색 및 선택</li>
                  <li>결제방법의 선택</li>
                  <li>결제정보의 입력</li>
                  <li>구매신청에 대한 확인 또는 회사의 확인에 대한 동의</li>
                </ul>
              </li>
              <li>회사는 다음의 결제수단을 제공합니다.
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>신용카드 결제</li>
                  <li>간편결제 (카카오페이 등)</li>
                  <li>기타 회사가 추가 지정하는 결제수단</li>
                </ul>
              </li>
              <li>회사가 제3자에게 결제업무를 위탁한 경우, 회사는 해당 결제대행사의 이름과 연락처를 이용자가 알 수 있도록 표시합니다.</li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제11조 (수신확인통지·구매신청 변경 및 취소)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>회사는 이용자의 구매신청이 있는 경우 이용자에게 수신확인통지를 합니다.</li>
              <li>수신확인통지를 받은 이용자는 의사표시의 불일치 등이 있는 경우에는 수신확인통지를 받은 후 즉시 구매신청 변경 및 취소를 요청할 수 있고, 회사는 콘텐츠 이용 전에 이용자의 요청이 있는 경우에는 지체 없이 그 요청에 따라 처리하여야 합니다.</li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제12조 (콘텐츠 이용)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>디지털 콘텐츠의 특성상, 구매가 완료되면 즉시 콘텐츠 이용이 가능합니다.</li>
              <li>구매한 콘텐츠의 이용권한은 구매자 본인에게만 부여되며, 타인에게 양도하거나 공유할 수 없습니다.</li>
              <li>콘텐츠의 이용기간은 별도의 표시가 없는 한 제한이 없습니다. 다만, 서비스 종료 시에는 회사가 정한 절차에 따릅니다.</li>
            </ol>

            {/* 제4장 청약철회 및 환불 */}
            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-6 pb-2 border-b">제4장 청약철회 및 환불</h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제13조 (청약철회)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>회사와 콘텐츠 구매에 관한 계약을 체결한 이용자는 「전자상거래 등에서의 소비자보호에 관한 법률」 제13조 제2항에 따른 계약내용에 관한 서면을 받은 날(그 서면을 받은 때보다 콘텐츠의 공급이 늦게 이루어진 경우에는 콘텐츠를 공급받거나 콘텐츠의 공급이 시작된 날을 말합니다)부터 7일 이내에 청약의 철회를 할 수 있습니다.</li>
              <li>이용자는 콘텐츠를 다운로드하거나 열람한 경우에는 다음 각 호의 경우를 제외하고 청약철회를 할 수 없습니다.
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>콘텐츠 내용이 표시·광고 내용과 다르거나 계약내용과 다르게 이행된 경우</li>
                  <li>콘텐츠에 기술적 오류가 있어 정상적인 이용이 불가능한 경우</li>
                </ul>
              </li>
              <li>이용자는 제1항 및 제2항의 규정에도 불구하고 콘텐츠의 내용이 표시·광고 내용과 다르거나 계약내용과 다르게 이행된 때에는 그 콘텐츠를 공급받은 날부터 3개월 이내, 그 사실을 안 날 또는 알 수 있었던 날부터 30일 이내에 청약철회 등을 할 수 있습니다.</li>
            </ol>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 my-6">
              <p className="text-sm text-orange-800 font-medium mb-2">디지털 콘텐츠 청약철회 제한 안내</p>
              <p className="text-sm text-orange-700">
                「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따라, 디지털콘텐츠의 제공이 개시된 경우(다운로드 또는 열람 시작) 청약철회가 제한됩니다. 이에 회사는 콘텐츠 구매 전 미리보기 등 시험 사용 기회를 제공합니다.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제14조 (청약철회의 효과)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>회사는 이용자로부터 청약철회의 의사표시를 받은 날부터 3영업일 이내에 대금의 결제와 동일한 방법으로 이를 환급합니다. 이 경우 회사가 환급을 지연한 때에는 그 지연기간에 대하여 「전자상거래 등에서의 소비자보호에 관한 법률 시행령」에서 정하는 지연이자율을 곱하여 산정한 지연이자를 지급합니다.</li>
              <li>회사는 대금을 환급함에 있어서 이용자가 신용카드 또는 전자화폐 등의 결제수단으로 대금을 지급한 때에는 지체 없이 당해 결제수단을 제공한 사업자로 하여금 대금의 청구를 정지 또는 취소하도록 요청합니다.</li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제15조 (환불 정책)</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              회사의 환불 정책에 관한 상세한 내용은 <Link href="/refund" className="text-orange-600 hover:underline">환불정책</Link> 페이지에서 확인할 수 있습니다.
            </p>

            {/* 제5장 크리에이터 */}
            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-6 pb-2 border-b">제5장 크리에이터</h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제16조 (크리에이터 등록)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>회원은 회사가 정한 절차에 따라 크리에이터로 등록을 신청할 수 있습니다.</li>
              <li>회사는 크리에이터 신청자가 다음 각 호에 해당하는 경우 등록을 거부하거나 등록 후 자격을 취소할 수 있습니다.
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>타인의 저작권을 침해한 콘텐츠를 등록한 경우</li>
                  <li>허위 또는 과장된 정보로 콘텐츠를 등록한 경우</li>
                  <li>불법적이거나 공서양속에 반하는 콘텐츠를 등록한 경우</li>
                  <li>기타 회사가 정한 크리에이터 정책을 위반한 경우</li>
                </ul>
              </li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제17조 (수익 정산)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>크리에이터의 콘텐츠 판매수익은 판매대금에서 플랫폼 이용료를 공제한 금액입니다.</li>
              <li>플랫폼 이용료는 판매대금의 20%입니다. 다만, 회사는 프로모션 등의 사유로 이용료를 조정할 수 있으며, 변경 시 사전에 공지합니다.</li>
              <li>정산금은 매월 1회 이상 정산되며, 정산 기준 및 지급일은 별도의 크리에이터 가이드를 통해 안내합니다.</li>
              <li>환불로 인해 판매가 취소된 경우, 해당 금액은 정산금에서 차감됩니다.</li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제18조 (크리에이터의 의무)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>크리에이터는 본인이 적법한 권리를 보유한 콘텐츠만 등록해야 합니다.</li>
              <li>크리에이터는 콘텐츠 설명에 허위 또는 과장된 정보를 기재해서는 안 됩니다.</li>
              <li>크리에이터는 등록한 콘텐츠에 대한 이용자 문의에 성실히 응해야 합니다.</li>
              <li>크리에이터의 콘텐츠로 인해 발생하는 저작권 분쟁 등 모든 법적 책임은 해당 크리에이터가 부담합니다.</li>
            </ol>

            {/* 제6장 저작권 및 지적재산권 */}
            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-6 pb-2 border-b">제6장 저작권 및 지적재산권</h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제19조 (저작권의 귀속)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.</li>
              <li>크리에이터가 플랫폼에 등록한 콘텐츠의 저작권은 해당 크리에이터에게 귀속됩니다.</li>
              <li>이용자는 플랫폼을 이용함으로써 얻은 정보 중 회사 또는 크리에이터에게 지적재산권이 귀속된 정보를 회사 또는 크리에이터의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.</li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제20조 (저작권 침해 신고)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>회사는 타인의 저작권을 존중하며, 저작권 침해 신고를 접수받고 처리합니다.</li>
              <li>저작권 침해를 발견한 경우 ab40905045@gmail.com으로 신고할 수 있습니다.</li>
              <li>회사는 신고 접수 후 확인 절차를 거쳐 침해가 인정되는 경우 해당 콘텐츠를 삭제하거나 접근을 차단할 수 있습니다.</li>
            </ol>

            {/* 제7장 이용자의 의무 */}
            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-6 pb-2 border-b">제7장 이용자의 의무</h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제21조 (이용자의 ID 및 비밀번호 관리 의무)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>회원의 ID와 비밀번호에 관한 관리책임은 회원에게 있습니다.</li>
              <li>회원은 자신의 ID 및 비밀번호를 제3자에게 이용하게 해서는 안 됩니다.</li>
              <li>회원이 자신의 ID 및 비밀번호를 도난당하거나 제3자가 사용하고 있음을 인지한 경우에는 바로 회사에 통보하고 회사의 안내가 있는 경우에는 그에 따라야 합니다.</li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제22조 (금지행위)</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              이용자는 다음 각 호의 행위를 하여서는 안 됩니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>신청 또는 변경 시 허위 내용의 등록</li>
              <li>타인의 정보 도용</li>
              <li>회사가 게시한 정보의 변경</li>
              <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등)의 송신 또는 게시</li>
              <li>회사 또는 제3자의 저작권 등 지적재산권에 대한 침해</li>
              <li>회사 또는 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
              <li>구매한 콘텐츠를 무단으로 복제, 배포, 전송, 판매하는 행위</li>
              <li>구매한 콘텐츠를 타인과 공유하거나 양도하는 행위</li>
              <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 플랫폼에 공개 또는 게시하는 행위</li>
              <li>회사의 동의 없이 영리를 목적으로 서비스를 사용하는 행위</li>
              <li>서비스의 안정적 운영을 방해하는 행위</li>
              <li>기타 불법적이거나 부당한 행위</li>
            </ol>

            {/* 제8장 면책 및 손해배상 */}
            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-6 pb-2 border-b">제8장 면책 및 손해배상</h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제23조 (회사의 면책)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
              <li>회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</li>
              <li>회사는 회원이 서비스와 관련하여 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.</li>
              <li>회사는 이용자 간 또는 이용자와 제3자 상호간에 서비스를 매개로 하여 거래 등을 한 경우에는 책임이 면제됩니다.</li>
              <li>회사는 무료로 제공되는 서비스 이용과 관련하여 관련법에 특별한 규정이 없는 한 책임을 지지 않습니다.</li>
              <li>회사는 크리에이터가 등록한 콘텐츠의 내용, 품질, 정확성에 대해 보증하지 않으며, 이로 인해 발생하는 손해에 대해 책임을 지지 않습니다.</li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제24조 (손해배상)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>회사가 고의 또는 과실로 이용자에게 손해를 끼친 경우, 회사는 이용자에게 그 손해를 배상합니다.</li>
              <li>이용자가 본 약관을 위반하여 회사에 손해를 끼친 경우, 이용자는 회사에 그 손해를 배상합니다.</li>
            </ol>

            {/* 제9장 분쟁해결 */}
            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-6 pb-2 border-b">제9장 분쟁해결</h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제25조 (분쟁해결)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 고객센터를 운영합니다.</li>
              <li>회사는 이용자로부터 제출되는 불만사항 및 의견은 우선적으로 그 사항을 처리합니다. 다만, 신속한 처리가 곤란한 경우에는 이용자에게 그 사유와 처리일정을 즉시 통보합니다.</li>
              <li>회사와 이용자 간에 발생한 전자상거래 분쟁과 관련하여 이용자의 피해구제신청이 있는 경우에는 공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.</li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제26조 (재판권 및 준거법)</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-4">
              <li>회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다. 다만, 제소 당시 이용자의 주소 또는 거소가 분명하지 않거나 외국 거주자의 경우에는 민사소송법상의 관할법원에 제기합니다.</li>
              <li>회사와 이용자 간에 제기된 전자상거래 소송에는 대한민국 법률을 적용합니다.</li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제27조 (고객센터)</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700 font-medium mb-2">고객센터 안내</p>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li>이메일: ab40905045@gmail.com</li>
                <li>운영시간: 평일 10:00 ~ 18:00 (주말/공휴일 휴무)</li>
              </ul>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              서비스 이용 관련 분쟁에 대해 다음 기관에 조정을 신청할 수 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              <li>한국소비자원 (www.kca.go.kr / 1372)</li>
              <li>전자거래분쟁조정위원회 (www.ecmc.or.kr)</li>
              <li>콘텐츠분쟁조정위원회 (www.kcdrc.kr)</li>
            </ul>

            {/* 부칙 */}
            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-6 pb-2 border-b">부칙</h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제1조 (시행일)</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              본 약관은 2025년 1월 1일부터 시행됩니다.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">제2조 (경과조치)</h3>
            <p className="text-gray-600 leading-relaxed">
              본 약관 시행 전에 이미 가입한 회원에 대해서도 본 약관이 적용됩니다.
            </p>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
