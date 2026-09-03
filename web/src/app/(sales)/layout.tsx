import { SalesShell } from '@/components/layout/sales-shell';

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return <SalesShell>{children}</SalesShell>;
}
