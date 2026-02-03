import { Skeleton } from '@/components/ui';

export default function StudyWithMeLoading() {
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Skeleton variant="text" width={200} height={32} className="mb-2" />
          <Skeleton variant="text" width={350} height={20} />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" width={100} height={40} />
          ))}
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
              {/* Thumbnail */}
              <Skeleton variant="rectangular" height={160} />

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton variant="rounded" width={60} height={24} />
                  <Skeleton variant="rounded" width={40} height={24} />
                </div>
                <Skeleton variant="text" width="80%" height={20} />
                <div className="flex items-center gap-2">
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="text" width={80} height={14} />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Skeleton variant="text" width={60} height={14} />
                  <Skeleton variant="text" width={40} height={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
