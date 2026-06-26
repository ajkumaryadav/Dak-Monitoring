import { LoginForm } from "@/components/auth/login-form";
import { appConfig } from "@/lib/constants/navigation";

export default function LoginPage() {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6">
      <div className="space-y-2 text-center lg:hidden">
        <h1 className="text-2xl font-semibold tracking-tight">
          {appConfig.shortName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {appConfig.districtAdministration}
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
