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

function applySecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = isDev ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";

  // 1. Content Security Policy & Frame Protection
  const cspHeader = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  );
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // 2. Sensitive routes cache disabling (Login, Dashboard, APIs, Auth)
  const isSensitive =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api");

  if (isSensitive) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Block and eliminate any sensitive query parameters from URLs
  const SENSITIVE_PARAMS = [
    "password",
    "pass",
    "pwd",
    "credential",
    "secret",
    "auth_hash",
    "auth_token",
  ];
  const hasSensitiveQuery = SENSITIVE_PARAMS.some((p) =>
    request.nextUrl.searchParams.has(p)
  );
  if (hasSensitiveQuery) {
    const cleanUrl = request.nextUrl.clone();
    for (const p of SENSITIVE_PARAMS) {
      cleanUrl.searchParams.delete(p);
    }
    return applySecurityHeaders(
      NextResponse.redirect(cleanUrl, { status: 301 }),
      pathname
    );
  }

  // Intercept malformed action requests that contain null bytes or illegal characters
  const nextAction = request.headers.get("next-action");
  if (nextAction && (nextAction.includes("%00") || nextAction.includes("\0") || nextAction.length > 200)) {
    return applySecurityHeaders(
      NextResponse.json({ error: "Invalid action identifier" }, { status: 400 }),
      pathname
    );
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const user = token ? verifyOfflineToken(token) : null;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!user && isProtected) {
    const loginUrl = getRedirectUrl(request, "/login");
    loginUrl.searchParams.set("next", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl), pathname);
  }

  if (user && isProtected && isOperatorBlockedRoute("dak_operator", pathname)) {
    const role = mapRoleSlug(user.user_metadata?.role);
    if (isOperatorBlockedRoute(role, pathname)) {
      const deniedUrl = getRedirectUrl(request, "/unauthorized");
      return applySecurityHeaders(NextResponse.redirect(deniedUrl), pathname);
    }
  }

  if (user && (pathname === "/login" || pathname === "/")) {
    const rawSignedOut = request.nextUrl.searchParams.get("signed_out");
    if (rawSignedOut === "1" || rawSignedOut === "true") {
      return applySecurityHeaders(NextResponse.next({ request }), pathname);
    }

    const dashboardUrl = getRedirectUrl(request, "/dashboard");
    return applySecurityHeaders(NextResponse.redirect(dashboardUrl), pathname);
  }

  return applySecurityHeaders(NextResponse.next({ request }), pathname);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
