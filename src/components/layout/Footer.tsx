import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-gray-900 font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">StuPle</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              학습 콘텐츠 크리에이터와 학생을 연결하는 플랫폼입니다.
              공부하고, 배우고, 성장하세요.
            </p>
            <div className="flex gap-4">
              <a
                href={process.env.NEXT_PUBLIC_PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <span className="text-white text-sm font-medium">Google Play</span>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">서비스</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/studyan" className="text-gray-400 hover:text-white transition-colors text-sm">
                  스터디언
                </Link>
              </li>
              <li>
                <a
                  href={process.env.NEXT_PUBLIC_PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  앱 다운로드
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">고객지원</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-gray-400 hover:text-white transition-colors text-sm">
                  환불정책
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@stuple.kr"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  문의하기
                </a>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-800 my-10" />

        {/* Business Information - Required for Korean E-commerce */}
        <div className="text-sm text-gray-500 space-y-2 mb-6">
          <p className="font-medium text-gray-400">사업자 정보</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <p>상호명: 스터플</p>
            <p>대표자: 조현웅</p>
            <p>사업자등록번호: 01040905045</p>
            <p>주소: 경상남도 양산시</p>
            <p>이메일: ab40905045@gmail.com</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} StuPle. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-400 transition-colors">이용약관</Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">개인정보처리방침</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
