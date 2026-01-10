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
                href={process.env.NEXT_PUBLIC_APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="text-white text-sm font-medium">App Store</span>
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
                  href={process.env.NEXT_PUBLIC_APP_STORE_URL}
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

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} StuPle. All rights reserved.
          </p>
          <p className="text-sm text-gray-500">
            사업자등록번호: 000-00-00000 | 대표: 홍길동
          </p>
        </div>
      </div>
    </footer>
  );
}
