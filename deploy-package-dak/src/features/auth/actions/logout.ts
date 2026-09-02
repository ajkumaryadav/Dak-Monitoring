"use server";

import { redirect } from "next/navigation";

/** @deprecated Prefer GET/POST /auth/logout route for reliable cookie clearing on Vercel. */
export async function logoutAction() {
  redirect("/auth/logout");
}
