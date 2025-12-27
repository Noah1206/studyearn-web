'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  ArrowRightLeft,
  Video,
  LayoutDashboard,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Avatar, Badge } from '@/components/ui';
import { useUserStore } from '@/store/userStore';
import type { User as SupabaseUser, AuthChangeEvent, Session } from '@supabase/supabase-js';

export function CreatorHeader() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const supabase = createClient();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const { revertToRunner, clearUser } = useUserStore();

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

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    clearUser();
    router.push('/');
    setIsProfileOpen(false);
  };

  const handleSwitchToViewer = () => {
    revertToRunner();
    router.push('/');
    setIsProfileOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Same as regular header */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">StuPle</span>
          </Link>

          {/* Desktop Navigation - Same as regular header */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/content"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all text-sm font-medium"
            >
              콘텐츠
            </Link>
            <Link
              href="/study-with-me"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all text-sm font-medium"
            >
              Study With Me
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Upload Button - YouTube Style (크리에이터 전용) */}
            <Link href="/dashboard/upload">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full transition-colors">
                <Video className="w-4 h-4" />
                <span className="text-sm font-medium">만들기</span>
              </button>
            </Link>

            {/* Profile Dropdown */}
            {user && (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Avatar
                    src={user.user_metadata?.avatar_url}
                    alt={user.user_metadata?.full_name || user.email || 'User'}
                    size="sm"
                  />
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {user.user_metadata?.full_name || '사용자'}
                        </p>
                        <Badge variant="primary" size="sm">크리에이터</Badge>
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
                      <Link
                        href="/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">크리에이터 대시보드</span>
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleSwitchToViewer}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                      >
                        <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">일반 모드로 전환</span>
                      </button>
                    </div>
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">로그아웃</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
              href="/study-with-me"
              className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Study With Me
            </Link>
            <Link
              href="/dashboard/upload"
              className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              콘텐츠 만들기
            </Link>

            <div className="pt-4 border-t border-gray-100 mt-4">
              {user && (
                <div className="space-y-1">
                  <div className="px-4 py-2 mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{user.user_metadata?.full_name || '사용자'}</p>
                      <Badge variant="primary" size="sm">크리에이터</Badge>
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
                    href="/dashboard"
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    크리에이터 대시보드
                  </Link>
                  <button
                    onClick={() => {
                      handleSwitchToViewer();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    일반 모드로 전환
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
