import { Header } from '@/components/layout';
import { DashboardPageWrapper } from './DashboardPageWrapper';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <DashboardPageWrapper>{children}</DashboardPageWrapper>
    </>
  );
}
