import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { createActivityLog } from "@/features/activity/services/activity-log";
import { getSupabaseEnv } from "@/lib/supabase/env";

async function handleLogout(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("signed_out", "1");

  const { url, anonKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.redirect(loginUrl);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await createActivityLog({
      userId: user.id,
      action: "Logout",
      module: "auth",
      description: "User signed out",
    });
  }

  await supabase.auth.signOut();

  return response;
}

/** Sign out via GET — reliable cookie clearing on Vercel/production. */
export async function GET(request: NextRequest) {
  return handleLogout(request);
}

/** Sign out via POST — used by sidebar/user-menu forms. */
export async function POST(request: NextRequest) {
  return handleLogout(request);
}
