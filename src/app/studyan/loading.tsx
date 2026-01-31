import { Skeleton } from '@/components/ui';

export default function StudyanLoading() {
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Skeleton variant="text" width={150} height={32} className="mb-2" />
          <Skeleton variant="text" width={280} height={20} />
        </div>

        {/* Search Bar */}
        <Skeleton variant="rounded" width="100%" height={48} className="mb-6 max-w-md" />

        {/* Creator Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm text-center">
              <Skeleton variant="circular" width={80} height={80} className="mx-auto mb-4" />
              <Skeleton variant="text" width="60%" height={20} className="mx-auto mb-2" />
              <Skeleton variant="text" width="80%" height={14} className="mx-auto mb-4" />
              <div className="flex justify-center gap-4">
                <Skeleton variant="text" width={60} height={14} />
                <Skeleton variant="text" width={60} height={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
