import { DashboardShell } from "@/components/layout/dashboard-shell";
import { QueryProvider } from "@/components/query-provider";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <DashboardShell>{children}</DashboardShell>
    </QueryProvider>
  );
}
