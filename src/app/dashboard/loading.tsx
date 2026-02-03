import { Skeleton } from '@/components/ui';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Skeleton variant="text" width={200} height={32} className="mb-2" />
          <Skeleton variant="text" width={150} height={20} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
              <Skeleton variant="text" width={80} height={14} className="mb-2" />
              <Skeleton variant="text" width={100} height={32} className="mb-1" />
              <Skeleton variant="text" width={60} height={12} />
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Skeleton variant="text" width={150} height={20} className="mb-4" />
            <Skeleton variant="rounded" height={200} />
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Skeleton variant="text" width={150} height={20} className="mb-4" />
            <Skeleton variant="rounded" height={200} />
          </div>
        </div>

        {/* Recent Items */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <Skeleton variant="text" width={120} height={20} className="mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
              <Skeleton variant="rounded" width={48} height={48} />
              <div className="flex-1">
                <Skeleton variant="text" width="60%" height={16} className="mb-1" />
                <Skeleton variant="text" width="40%" height={14} />
              </div>
              <Skeleton variant="text" width={60} height={14} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
