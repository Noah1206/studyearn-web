'use client';

export default function UploadLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 w-64">
        {/* 프로그레스 바 */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full animate-progress"
            style={{
              animation: 'progress 1.5s ease-in-out infinite',
            }}
          />
        </div>
        <p className="text-gray-500 text-sm">로딩 중...</p>

        <style jsx>{`
          @keyframes progress {
            0% {
              width: 0%;
              margin-left: 0%;
            }
            50% {
              width: 70%;
              margin-left: 15%;
            }
            100% {
              width: 0%;
              margin-left: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
