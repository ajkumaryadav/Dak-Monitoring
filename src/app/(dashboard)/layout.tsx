import { AdminShell } from "@/components/layout/admin-shell";
import { getSessionUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return <AdminShell user={user}>{children}</AdminShell>;
}
