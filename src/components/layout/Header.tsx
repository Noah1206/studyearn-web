'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, User, LogOut, LayoutDashboard, ChevronDown, ArrowRightLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Avatar, Badge } from '@/components/ui';
import { useUserStore } from '@/store/userStore';
import type { User as SupabaseUser, AuthChangeEvent, Session } from '@supabase/supabase-js';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const supabase = createClient();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // User Store
  const {
    userType,
    isCreatorOnboarded,
    hasBeenCreator,
    profile,
    revertToRunner,
    switchToCreator,
    syncCreatorStatus,
    clearUser,
  } = useUserStore();

  const isCreatorMode = userType === 'creator' && isCreatorOnboarded;

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

  useEffect(() => {
    if (!supabase) return;

    // 크리에이터 상태 동기화 함수
    const syncUserCreatorStatus = async (userId: string) => {
      const { data: creatorSettings } = await supabase
        .from('creator_settings')
        .select('display_name, bio, profile_image_url, is_verified')
        .eq('user_id', userId)
        .single();

      if (creatorSettings) {
        syncCreatorStatus(true, {
          display_name: creatorSettings.display_name || '',
          bio: creatorSettings.bio,
          profile_image_url: creatorSettings.profile_image_url,
          is_verified: creatorSettings.is_verified || false,
          total_subscribers: 0,
        });
      } else {
        // No creator settings - user has never completed creator onboarding
        syncCreatorStatus(false);
      }
    };

    // getSession은 로컬에서 읽어서 빠름 (getUser는 서버 요청으로 느림)
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // 크리에이터 상태 백그라운드 동기화 (UI 블로킹 X)
      if (session?.user) {
        syncUserCreatorStatus(session.user.id);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);

      // 로그인 시 크리에이터 상태도 동기화
      if (session?.user) {
        await syncUserCreatorStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, syncCreatorStatus]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    clearUser();
    router.push('/');
    setIsProfileOpen(false);
  };

  const handleSwitchMode = () => {
    if (isCreatorMode) {
      revertToRunner();
      router.push('/');
    } else if (hasBeenCreator && isCreatorOnboarded) {
      switchToCreator();
      router.push('/dashboard');
    }
    setIsProfileOpen(false);
  };

  return (
    <header
      className="bg-white border-b border-gray-100"
    >
      <div className="relative flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Logo - 왼쪽 끝에 고정 */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Image
            src="/logo.svg"
            alt="StuPle"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-xl font-bold text-gray-900 tracking-tight">StuPle</span>
        </Link>

        {/* Desktop Navigation - 중앙 */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <Link
              href="/content"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all text-sm font-medium"
            >
              콘텐츠
            </Link>
            <Link
              href="/studyan"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all text-sm font-medium"
            >
              스터디언
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
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
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
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
                    {hasBeenCreator && isCreatorOnboarded && (
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
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-error hover:bg-error/5 w-full text-left transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">로그아웃</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm font-medium"
                  >
                    로그인
                  </Button>
                </Link>
                <Link href="/onboarding">
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg">
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
        <div className="md:hidden border-t border-gray-100 bg-white animate-slide-down">
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

            <div className="pt-4 border-t border-gray-100 mt-4">
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
                  {isCreatorMode && (
                    <Link
                      href="/dashboard"
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      크리에이터 대시보드
                    </Link>
                  )}
                  <Link
                    href="/my/purchases"
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    내 구매 내역
                  </Link>
                  {hasBeenCreator && isCreatorOnboarded && (
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
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-error hover:bg-error/5 rounded-lg"
                  >
                    로그아웃
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
