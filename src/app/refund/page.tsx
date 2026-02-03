'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { pageVariants } from '@/components/ui/motion/variants';

export default function RefundPolicyPage() {
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
            <h1 className="text-xl font-bold">환불 정책</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-500 mb-6">시행일: 2024년 1월 1일</p>

            <p className="text-gray-600 leading-relaxed mb-6">
              스터플(이하 &quot;회사&quot;)은 전자상거래 등에서의 소비자보호에 관한 법률 및 관련 법령에 따라 다음과 같은 환불 정책을 운영합니다.
            </p>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제1조 (디지털 콘텐츠 환불)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              디지털 콘텐츠의 특성상 아래 기준에 따라 환불이 처리됩니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>
                <strong>환불 가능한 경우</strong>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>결제 후 콘텐츠를 전혀 이용(다운로드/열람)하지 않은 경우: 결제일로부터 7일 이내 전액 환불</li>
                  <li>콘텐츠 내용이 표시·광고 내용과 현저히 다른 경우: 전액 환불</li>
                  <li>콘텐츠에 기술적 오류가 있어 정상적으로 이용할 수 없는 경우: 전액 환불</li>
                </ul>
              </li>
              <li>
                <strong>환불이 제한되는 경우</strong>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>콘텐츠를 다운로드하거나 열람한 경우</li>
                  <li>구매 후 7일이 경과한 경우</li>
                  <li>이용자의 귀책사유로 콘텐츠가 멸실·훼손된 경우</li>
                  <li>복제가 가능한 콘텐츠의 포장을 훼손한 경우</li>
                </ul>
              </li>
            </ol>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-orange-800">
                <strong>참고:</strong> 청약철회 권리가 제한되는 콘텐츠의 경우, 구매 전 사전 고지 및 동의를 받습니다.
              </p>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제2조 (환불 절차)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>환불 요청: 서비스 내 &apos;구매내역&apos; 또는 고객센터(ab40905045@gmail.com)를 통해 환불 요청</li>
              <li>환불 심사: 환불 요청일로부터 영업일 기준 3일 이내 심사 완료</li>
              <li>환불 처리: 심사 승인 후 영업일 기준 3~7일 이내 환불 처리
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>신용카드: 카드사 정책에 따라 3~7일 소요</li>
                  <li>계좌이체: 환불 승인 후 1~3일 소요</li>
                  <li>간편결제(카카오페이 등): 결제수단에 따라 즉시~7일 소요</li>
                </ul>
              </li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제3조 (부분 환불)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              콘텐츠의 일부만 이용한 경우, 아래 기준에 따라 부분 환불이 가능할 수 있습니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>전체 콘텐츠의 10% 미만 이용: 결제금액의 90% 환불</li>
              <li>전체 콘텐츠의 10~30% 이용: 결제금액의 70% 환불</li>
              <li>전체 콘텐츠의 30% 이상 이용: 환불 불가</li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제4조 (결제 수단별 환불 방법)</h2>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">결제 수단</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">환불 방법</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">소요 기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">신용카드</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">카드 결제 취소</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">3~7일</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">실시간 계좌이체</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">계좌 환불</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">1~3일</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">카카오페이</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">카카오페이 잔액/연결 결제수단</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">즉시~7일</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">가상계좌</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">환불 계좌 입금</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">1~3일</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제5조 (환불 불가 사유)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              아래의 경우에는 환불이 불가능합니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li>이용자의 단순 변심으로 콘텐츠 이용 후 환불을 요청하는 경우</li>
              <li>이용자의 고의 또는 과실로 콘텐츠가 훼손된 경우</li>
              <li>이용약관 위반으로 서비스 이용이 제한된 경우</li>
              <li>타인에게 콘텐츠를 공유하거나 양도한 경우</li>
            </ol>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제6조 (분쟁 해결)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              환불과 관련하여 회사와 이용자 간에 분쟁이 발생한 경우, 양 당사자는 분쟁의 해결을 위해 성실히 협의합니다.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              협의가 이루어지지 않을 경우 아래 기관에 조정을 신청할 수 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              <li>한국소비자원 (www.kca.go.kr / 1372)</li>
              <li>전자거래분쟁조정위원회 (www.ecmc.or.kr)</li>
              <li>콘텐츠분쟁조정위원회 (www.kcdrc.kr)</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">제7조 (고객센터 안내)</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700 font-medium mb-2">환불 문의</p>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li>이메일: ab40905045@gmail.com</li>
                <li>운영시간: 평일 10:00 ~ 18:00 (주말/공휴일 휴무)</li>
              </ul>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">부칙</h2>
            <p className="text-gray-600 leading-relaxed">
              본 정책은 2024년 1월 1일부터 시행됩니다.
            </p>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
