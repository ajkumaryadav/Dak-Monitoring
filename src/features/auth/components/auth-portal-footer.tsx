import { appConfig } from "@/lib/constants/navigation";

/** Centered administration & support footer below the lifecycle panel. */
export function AuthPortalFooter() {
  return (
    <footer className="text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
      <p className="text-sm font-semibold text-foreground">
        {appConfig.districtAdministration}
      </p>
      <p className="mt-1">{appConfig.districtTagline}</p>
      <p className="mt-2">
        © 2026 Copyright {appConfig.copyrightHolder}, All rights reserved
      </p>
      <p className="mt-2">
        Tech support:{" "}
        <a
          href={`mailto:${appConfig.supportEmail}`}
          className="font-medium text-primary hover:underline"
        >
          {appConfig.supportEmail}
        </a>
        <span className="mx-1.5 text-border">·</span>
        <span className="font-medium tabular-nums text-foreground">
          IP: {appConfig.portalIpCode}
        </span>
      </p>
    </footer>
  );
}
