import { Skeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      {/* Hero Section Skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center space-y-4">
            <Skeleton variant="text" width="60%" height={40} className="mx-auto" />
            <Skeleton variant="text" width="40%" height={24} className="mx-auto" />
          </div>
        </div>
      </div>

      {/* Content Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton variant="text" width={200} height={28} className="mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
              <Skeleton variant="rounded" height={160} className="mb-4" />
              <Skeleton variant="text" width="80%" height={20} className="mb-2" />
              <Skeleton variant="text" width="60%" height={16} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
