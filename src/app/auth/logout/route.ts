import { NextResponse, type NextRequest } from "next/server";

import { createActivityLog } from "@/features/activity/services/activity-log";
import { AUTH_COOKIE_NAME, verifyOfflineToken } from "@/lib/auth/offline-token";

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

async function handleLogout(request: NextRequest) {
  const loginUrl = getRedirectUrl(request, "/login");
  loginUrl.searchParams.set("signed_out", "1");

  const response = NextResponse.redirect(loginUrl);

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const user = token ? verifyOfflineToken(token) : null;

  if (user) {
    try {
      await createActivityLog({
        userId: user.id,
        action: "Logout",
        module: "auth",
        description: "User signed out",
      });
    } catch {
      // Non-fatal logging error
    }
  }

  // Clear authentication cookie
  response.cookies.delete(AUTH_COOKIE_NAME);
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
  });

  return response;
}

/** Sign out via GET — reliable cookie clearing in production. */
export async function GET(request: NextRequest) {
  return handleLogout(request);
}

/** Sign out via POST — used by sidebar/user-menu forms. */
export async function POST(request: NextRequest) {
  return handleLogout(request);
}
