import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionUser } from "@/lib/session";

const statCards = [
  {
    title: "Total DAK Received",
    value: "—",
    description: "Awaiting module integration",
    icon: FileText,
  },
  {
    title: "Under Process",
    value: "—",
    description: "Active workflow items",
    icon: Clock,
  },
  {
    title: "Escalated",
    value: "—",
    description: "Requires attention",
    icon: AlertTriangle,
  },
  {
    title: "Disposed Today",
    value: "—",
    description: "Completed disposals",
    icon: CheckCircle2,
  },
] as const;

export default async function DashboardPage() {
  const user = await getSessionUser();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user?.name}. District overview and DAK monitoring at
            a glance.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit capitalize">
          <TrendingUp className="size-3" />
          {user?.role.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Timeline of DAK movements and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
            <p className="pt-2 text-center text-xs text-muted-foreground">
              Activity feed will populate when modules are connected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Pipeline</CardTitle>
            <CardDescription>
              DAK status distribution across the district
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Received",
              "Assigned",
              "Under Process",
              "Pending",
              "Escalated",
            ].map((status) => (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{status}</span>
                  <span className="text-muted-foreground">—</span>
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
