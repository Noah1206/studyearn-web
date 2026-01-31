import { Skeleton } from '@/components/ui';

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <Skeleton variant="rounded" width={80} height={36} />
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <Skeleton variant="circular" width={96} height={96} className="mb-4" />

            {/* Name & Email */}
            <Skeleton variant="text" width={150} height={24} className="mb-2" />
            <Skeleton variant="text" width={200} height={16} className="mb-6" />

            {/* Edit Button */}
            <Skeleton variant="rounded" width="100%" height={44} className="max-w-xs mb-6" />

            {/* Stats */}
            <div className="w-full border-t pt-6">
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <Skeleton variant="text" width={40} height={28} className="mx-auto mb-1" />
                    <Skeleton variant="text" width={60} height={14} className="mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <Skeleton variant="text" width={100} height={16} className="mb-4 px-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 px-2">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={20} height={20} />
                <Skeleton variant="text" width={120} height={16} />
              </div>
              <Skeleton variant="text" width={20} height={20} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
