'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, User, LogOut, LayoutDashboard, ChevronDown, ArrowRightLeft, Plus, Search, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Avatar, Badge } from '@/components/ui';
import { useUserStore } from '@/store/userStore';
import { useSession } from '@/components/providers';
import { useUnreadCount } from '@/hooks';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  // 서버에서 전달받은 세션 사용
  const { user, isLoading: isSessionLoading } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Supabase client를 useMemo로 캐싱하여 매 렌더마다 새 인스턴스 생성 방지
  const supabase = useMemo(() => createClient(), []);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useUnreadCount(!!user);

  // User Store
  const {
    userType,
    isCreatorOnboarded,
    hasBeenCreator,
    profile,
    isHydrated,
    revertToRunner,
    switchToCreator,
    clearUser,
  } = useUserStore();

  // Store가 hydrate된 후에만 creator 상태 적용
  const isCreatorMode = isHydrated && userType === 'creator' && isCreatorOnboarded;
  const canSwitchMode = isHydrated && hasBeenCreator && isCreatorOnboarded;

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  // 크리에이터 상태는 SessionProvider에서 자동으로 동기화됨

  const handleLogout = async () => {
    console.log('🔴 Logout button clicked');

    // 중복 클릭 방지
    if (isLoggingOut) {
      console.log('⏭️ Already logging out, skipping...');
      return;
    }

    setIsLoggingOut(true);
    console.log('🔄 Starting logout process...');

    // 즉시 UI 닫기
    setIsProfileOpen(false);
    setIsMenuOpen(false);

    try {
      // localStorage/sessionStorage 클리어
      if (typeof window !== 'undefined') {
        const localStorageKeys = Object.keys(localStorage).filter(
          key => key.startsWith('sb-') || key.includes('supabase') || key === 'user-storage'
        );
        console.log('🗑️ Clearing localStorage keys:', localStorageKeys);
        localStorageKeys.forEach(key => localStorage.removeItem(key));

        const sessionStorageKeys = Object.keys(sessionStorage).filter(
          key => key.startsWith('sb-') || key.includes('supabase')
        );
        console.log('🗑️ Clearing sessionStorage keys:', sessionStorageKeys);
        sessionStorageKeys.forEach(key => sessionStorage.removeItem(key));
      }

      // 클라이언트 signOut with timeout
      console.log('📤 Calling supabase.auth.signOut...');
      try {
        const signOutPromise = supabase?.auth.signOut({ scope: 'global' });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('SignOut timeout')), 2000)
        );

        const { error: signOutError } = await Promise.race([signOutPromise, timeoutPromise]) || {};
        if (signOutError) {
          console.error('❌ SignOut error:', signOutError);
        } else {
          console.log('✅ Client signOut successful');
        }
      } catch (err) {
        console.warn('⚠️ SignOut timed out or failed, continuing with logout...', err);
      }

      // 서버 API 호출
      console.log('📤 Calling /api/auth/logout...');
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      console.log('✅ Server logout response:', response.status, response.statusText);

      // User store 클리어
      console.log('🗑️ Clearing user store...');
      clearUser();
      console.log('✅ User store cleared');
    } catch (err) {
      console.error('❌ Logout error:', err);
    }

    // 홈으로 리다이렉트
    console.log('🏠 Redirecting to home...');
    window.location.href = '/';
  };

  const handleSwitchMode = () => {
    if (isCreatorMode) {
      revertToRunner();
      // 이미 프로필 페이지면 refresh, 아니면 push
      if (pathname === '/profile' || pathname.startsWith('/profile/')) {
        router.refresh();
      } else {
        router.push('/profile');
      }
    } else if (canSwitchMode) {
      switchToCreator();
      router.push('/dashboard');
    }
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <header
      className="bg-white"
    >
      <div className="relative flex items-center justify-between h-[72px] px-8 sm:px-24 lg:px-64 gap-6">
        {/* Left: Logo + Search */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/logo.svg"
              alt="StuPle"
              width={36}
              height={36}
              className="w-9 h-9"
            />
            <span className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">StuPle</span>
          </Link>

          {/* Content Search Slot - rendered via portal from content page */}
          <div id="header-search-slot" className="hidden md:flex items-center w-[400px] lg:w-[480px]" />
        </div>

        {/* Right: Nav Links + Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/content"
              className="px-3 py-1.5 text-gray-700 hover:text-gray-900 transition-colors text-[15px] font-medium"
            >
              콘텐츠
            </Link>
            <Link
              href="/studyan"
              className="px-3 py-1.5 text-gray-700 hover:text-gray-900 transition-colors text-[15px] font-medium"
            >
              스터디언
            </Link>
            {user ? (
              <>
                {/* Upload Button - Only on Dashboard */}
                {pathname.startsWith('/dashboard') && isCreatorMode && (
                  <Link
                    href="/dashboard/upload"
                    className="w-9 h-9 bg-orange-500 hover:bg-orange-600 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </Link>
                )}
                <Link
                  href="/notifications"
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </Link>
                <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Avatar
                    src={profile?.avatar_url || user.user_metadata?.avatar_url}
                    alt={profile?.nickname || user.user_metadata?.full_name || user.email || 'User'}
                    size="sm"
                  />
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 pb-2 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {profile?.nickname || user.user_metadata?.full_name || '사용자'}
                        </p>
                        {isCreatorMode && (
                          <Badge variant="primary" size="sm">크리에이터</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">내 프로필</span>
                      </Link>
                      {isCreatorMode && (
                        <Link
                          href="/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">크리에이터 대시보드</span>
                        </Link>
                      )}
                      <Link
                        href="/my/purchases"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">내 구매 내역</span>
                      </Link>
                    </div>
                    {/* 모드 전환 */}
                    {canSwitchMode && (
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={handleSwitchMode}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                        >
                          <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {isCreatorMode ? '일반 모드로 전환' : '크리에이터 모드'}
                          </span>
                        </button>
                      </div>
                    )}
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLogout();
                        }}
                        disabled={isLoggingOut}
                        className="flex items-center gap-3 px-4 py-2.5 text-error hover:bg-error/5 w-full text-left transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-gray-900 text-[15px] font-medium"
                  >
                    로그인
                  </Button>
                </Link>
                <Link href="/onboarding">
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white text-[15px] font-medium px-4 py-2 rounded-lg">
                    회원가입
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-900" />
            ) : (
              <Menu className="w-6 h-6 text-gray-900" />
            )}
          </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white animate-slide-down">
          <div className="px-4 py-4 space-y-1">
            <Link
              href="/content"
              className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              콘텐츠
            </Link>
            <Link
              href="/studyan"
              className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              스터디언
            </Link>

            <div className="pt-4 mt-4">
              {user ? (
                <div className="space-y-1">
                  <div className="px-4 py-2 mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{profile?.nickname || user.user_metadata?.full_name || '사용자'}</p>
                      {isCreatorMode && (
                        <Badge variant="primary" size="sm">크리에이터</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    내 프로필
                  </Link>
                  <Link
                    href="/notifications"
                    className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>알림</span>
                    {unreadCount > 0 && (
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  {isCreatorMode && (
                    <>
                      <Link
                        href="/dashboard"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        크리에이터 대시보드
                      </Link>
                      {pathname.startsWith('/dashboard') && (
                        <Link
                          href="/dashboard/upload"
                          className="flex items-center gap-2 px-4 py-3 text-orange-600 hover:bg-orange-50 rounded-lg font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Plus className="w-4 h-4" />
                          콘텐츠 업로드
                        </Link>
                      )}
                    </>
                  )}
                  <Link
                    href="/my/purchases"
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    내 구매 내역
                  </Link>
                  {canSwitchMode && (
                    <button
                      onClick={() => {
                        handleSwitchMode();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      {isCreatorMode ? '일반 모드로 전환' : '크리에이터 모드'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLogout();
                    }}
                    disabled={isLoggingOut}
                    className="block w-full text-left px-4 py-3 text-error hover:bg-error/5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="outline"
                      fullWidth
                      className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      로그인
                    </Button>
                  </Link>
                  <Link href="/onboarding" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      fullWidth
                      className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                    >
                      회원가입
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
