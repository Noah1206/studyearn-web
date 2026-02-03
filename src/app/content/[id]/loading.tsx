import { Skeleton } from '@/components/ui';

export default function ContentDetailLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton variant="circular" width={48} height={48} />
            <div>
              <Skeleton variant="text" width={120} height={18} className="mb-1" />
              <Skeleton variant="text" width={80} height={14} />
            </div>
          </div>

          <Skeleton variant="text" width="80%" height={32} className="mb-3" />
          <Skeleton variant="text" width="60%" height={20} className="mb-4" />

          <div className="flex gap-2 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" width={60} height={28} />
            ))}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Skeleton variant="rounded" height={400} className="mb-6" />
            <div className="bg-white rounded-xl p-6">
              <Skeleton variant="text" width={150} height={24} className="mb-4" />
              <Skeleton variant="text" width="100%" height={16} className="mb-2" />
              <Skeleton variant="text" width="100%" height={16} className="mb-2" />
              <Skeleton variant="text" width="80%" height={16} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6">
              <Skeleton variant="text" width={100} height={32} className="mb-4" />
              <Skeleton variant="rounded" width="100%" height={48} className="mb-3" />
              <Skeleton variant="rounded" width="100%" height={48} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
