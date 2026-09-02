import { Settings } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { ProfileSettingsForm } from "@/features/profile/components/profile-settings-form";
import { ChangePasswordForm } from "@/features/profile/components/change-password-form";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requirePermission(PERMISSIONS.DASHBOARD);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Settings"
        description="Update your display name and designation."
        icon={Settings}
      />

      <Card className="max-w-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Account Settings</CardTitle>
          <CardDescription>
            Changes apply across the dashboard and reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm user={user} />
        </CardContent>
      </Card>

      <Card className="max-w-2xl border-border/60" id="change-password">
        <CardHeader>
          <CardTitle className="text-lg">Change Password</CardTitle>
          <CardDescription>
            Update your login password securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
