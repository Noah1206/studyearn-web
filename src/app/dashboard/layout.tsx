import { CreatorHeader } from '@/components/layout';
import { DashboardPageWrapper } from './DashboardPageWrapper';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CreatorHeader />
      <DashboardPageWrapper>{children}</DashboardPageWrapper>
    </>
  );
}
