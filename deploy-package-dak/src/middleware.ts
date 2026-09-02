import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { isOperatorBlockedRoute } from "@/lib/auth/permissions";
import { readRoleSlugFromProfile } from "@/lib/auth/role-slug";

const PROTECTED_PREFIXES = ["/dashboard"];

export async function middleware(request: NextRequest) {
  const { url, anonKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isProtected && isOperatorBlockedRoute("dak_operator", pathname)) {
    const { data: profile } = await supabase
      .from("users")
      .select("roles(slug)")
      .eq("id", user.id)
      .maybeSingle();

    const role = readRoleSlugFromProfile(
      profile?.roles as { slug?: string } | { slug?: string }[] | null
    );

    if (isOperatorBlockedRoute(role, pathname)) {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = "/unauthorized";
      return NextResponse.redirect(deniedUrl);
    }
  }

  if (user && (pathname === "/login" || pathname === "/")) {
    if (request.nextUrl.searchParams.get("signed_out") === "1") {
      return supabaseResponse;
    }

    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
