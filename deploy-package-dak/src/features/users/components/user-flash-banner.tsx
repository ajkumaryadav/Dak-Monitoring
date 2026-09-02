import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

interface UserFlashBannerProps {
  created?: boolean;
  updated?: boolean;
}

/** Success flash after create/update redirects back to User Management. */
export function UserFlashBanner({ created, updated }: UserFlashBannerProps) {
  if (!created && !updated) {
    return null;
  }

  const message = created
    ? "User created successfully."
    : "User details updated successfully.";

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300"
      role="status"
    >
      <p className="flex items-center gap-2 font-medium">
        <CheckCircle2 className="size-4 shrink-0" />
        {message}
      </p>
      <Link
        href="/dashboard/admin/users"
        className="text-xs font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
      >
        Dismiss
      </Link>
    </div>
  );
}
