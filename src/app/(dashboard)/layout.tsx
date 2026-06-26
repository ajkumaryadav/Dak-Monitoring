import { AdminShell } from "@/components/layout/admin-shell";
import { requireSessionUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireSessionUser();

  return <AdminShell user={user}>{children}</AdminShell>;
}
