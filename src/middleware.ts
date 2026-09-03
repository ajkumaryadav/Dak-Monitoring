import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, verifyOfflineToken } from "@/lib/auth/offline-token";
import { isOperatorBlockedRoute } from "@/lib/auth/permissions";
import { mapRoleSlug } from "@/lib/auth/role-slug";

const PROTECTED_PREFIXES = ["/dashboard"];

function getRedirectUrl(request: NextRequest, targetPath: string): URL {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (request.url.startsWith("https") ? "https" : "http");

  if (host && !host.startsWith("0.0.0.0")) {
    return new URL(targetPath, `${proto}://${host}`);
  }

  const url = request.nextUrl.clone();
  url.pathname = targetPath;
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
  return url;
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const user = token ? verifyOfflineToken(token) : null;

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!user && isProtected) {
    const loginUrl = getRedirectUrl(request, "/login");
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isProtected && isOperatorBlockedRoute("dak_operator", pathname)) {
    const role = mapRoleSlug(user.user_metadata?.role);
    if (isOperatorBlockedRoute(role, pathname)) {
      const deniedUrl = getRedirectUrl(request, "/unauthorized");
      return NextResponse.redirect(deniedUrl);
    }
  }

  if (user && (pathname === "/login" || pathname === "/")) {
    if (request.nextUrl.searchParams.get("signed_out") === "1") {
      return NextResponse.next({ request });
    }

    const dashboardUrl = getRedirectUrl(request, "/dashboard");
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
