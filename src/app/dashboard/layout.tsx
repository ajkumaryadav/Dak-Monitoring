import { AdminShell } from "@/components/layout/admin-shell";
import { AppToaster } from "@/components/ui/sonner";
import { syncUserProfile } from "@/features/auth/actions/sync-user";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requirePermission(PERMISSIONS.DASHBOARD);

  await syncUserProfile();

  return (
    <>
      <AdminShell user={user}>{children}</AdminShell>
      <AppToaster />
    </>
  );
}
