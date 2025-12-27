import { CreatorHeader } from '@/components/layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CreatorHeader />
      <div className="flex-1">{children}</div>
    </>
  );
}
