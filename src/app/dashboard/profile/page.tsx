import { User } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await requirePermission(PERMISSIONS.DASHBOARD);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Profile"
        description="Your account details and role in the Collectorate portal."
        icon={User}
      />

      <Card className="max-w-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">{user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Designation
              </p>
              <p className="mt-1 text-sm font-medium">{user.designation}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Role
              </p>
              <Badge variant="secondary" className="mt-1 capitalize">
                {user.role.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
