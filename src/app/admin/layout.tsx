'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드', icon: '📊' },
  { href: '/admin/users', label: '유저 관리', icon: '👤' },
  { href: '/admin/creators', label: '크리에이터', icon: '🎨' },
  { href: '/admin/content', label: '콘텐츠', icon: '📝' },
  { href: '/admin/transactions', label: '거래 내역', icon: '💳' },
  { href: '/admin/subscriptions', label: '구독 관리', icon: '🔄' },
  { href: '/admin/purchases', label: 'P2P 구매', icon: '🛒' },
  { href: '/admin/payouts', label: '정산', icon: '💰' },
  { href: '/admin/settings', label: '설정', icon: '⚙️' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Skip auth check on login page
    if (pathname === '/admin/login') {
      setIsAuthenticated(true);
      return;
    }

    // Check admin session
    fetch('/api/admin/login', { method: 'HEAD' })
      .then(() => {
        // Session cookie is checked server-side via requireAdmin
        // For client-side check, we verify by making a simple API call
        return fetch('/api/admin/analytics');
      })
      .then((res) => {
        if (res.status === 403) {
          router.push('/admin/login');
        } else {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        setIsAuthenticated(true); // Allow render, API will handle auth
      });
  }, [pathname, router]);

  // Login page - no sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">StudyEarn</h1>
          <p className="text-sm text-gray-500 mt-1">관리자 대시보드</p>
        </div>

        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
