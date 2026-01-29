import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Top Section */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-5 mb-4 lg:mb-0">
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/logo-white.svg"
                alt="StuPle"
                width={28}
                height={28}
                className="w-7 h-7"
              />
              <span className="text-lg font-bold text-white tracking-tight">StuPle</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-5 max-w-sm">
              학습 콘텐츠 크리에이터와 학생을 연결하는 플랫폼입니다. 공부하고, 배우고, 성장하세요.
            </p>
            <a
              href={process.env.NEXT_PUBLIC_PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              <span className="text-white text-xs font-medium">Google Play</span>
            </a>
          </div>

          {/* Service Links */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="text-white font-semibold mb-4 text-sm">서비스</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/content" className="text-gray-400 hover:text-white transition-colors text-sm">
                  노트 마켓
                </Link>
              </li>
              <li>
                <Link href="/explore" className="text-gray-400 hover:text-white transition-colors text-sm">
                  탐색
                </Link>
              </li>
              <li>
                <Link href="/studyan" className="text-gray-400 hover:text-white transition-colors text-sm">
                  스터디언
                </Link>
              </li>
              <li>
                <Link href="/become-creator" className="text-gray-400 hover:text-white transition-colors text-sm">
                  크리에이터 신청
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="text-white font-semibold mb-4 text-sm">고객지원</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors text-sm">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                  1:1 문의
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-400 hover:text-white transition-colors text-sm">
                  이용가이드
                </Link>
              </li>
              <li>
                <a
                  href="mailto:ab40905045@gmail.com"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  문의하기
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="text-white font-semibold mb-4 text-sm">법적 고지</h4>
            <ul className="space-y-2.5">
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
            </ul>
          </div>
        </div>

        <hr className="border-gray-800 my-8 lg:my-10" />

        {/* Business Information */}
        <div className="text-xs text-gray-500 space-y-1.5 mb-6">
          <p className="font-medium text-gray-400 mb-2">사업자 정보</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <p>상호명: 스터플</p>
            <p>대표자: 조현웅</p>
            <p>사업자등록번호: 508-14-52353</p>
            <p>주소: 경상남도 양산시</p>
            <p>전화번호: 010-4090-5045</p>
            <p>이메일: ab40905045@gmail.com</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} StuPle. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <Link href="/terms" className="hover:text-gray-400 transition-colors">이용약관</Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">개인정보처리방침</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
