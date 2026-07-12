import Link from "next/link";
import { ArrowLeft, ListTodo } from "lucide-react";

import { getAssignFormOptions } from "@/features/dak/services/get-assign-form-options";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { CreateTaskForm } from "@/features/tasks/components/create-task-form";
import { buttonVariants } from "@/components/ui/button";
import { TASK_MANAGE_ROLES, requireRole } from "@/lib/auth";
import { getDistrictDateString } from "@/features/dak/lib/dak-dates";
import { cn } from "@/lib/utils";

export default async function NewTaskPage() {
  await requireRole([...TASK_MANAGE_ROLES]);
  const options = await getAssignFormOptions();
  const minDue = getDistrictDateString();

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/tasks"
        className={cn(buttonVariants({ variant: "outline" }), "h-9 w-fit gap-1.5")}
      >
        <ArrowLeft className="size-4" />
        Back to Tasks
      </Link>
      <DakPageHeader
        title="Create Task"
        description="Create a district coordination task and assign multiple departments or officers."
        icon={ListTodo}
      />
      <CreateTaskForm options={options} minDueDate={minDue} />
    </div>
  );
}
