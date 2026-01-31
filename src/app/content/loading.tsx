import { Skeleton } from '@/components/ui';

export default function ContentLoading() {
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Skeleton variant="text" width={150} height={32} className="mb-2" />
          <Skeleton variant="text" width={300} height={20} />
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" width={80} height={36} />
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
              <Skeleton variant="rectangular" height={180} />
              <div className="p-4 space-y-3">
                <Skeleton variant="text" width="90%" height={18} />
                <Skeleton variant="text" width="60%" height={14} />
                <div className="flex items-center gap-2 pt-2">
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="text" width={80} height={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
