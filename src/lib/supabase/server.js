import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

export async function getServerSupabase() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot always write cookies. Proxy refreshes sessions.
        }
      },
    },
  });
}

export async function getCurrentUser() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (error.name === "AuthSessionMissingError" || error.message === "Auth session missing!") return null;
    throw error;
  }
  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, company_id, role, full_name, active, must_change_password, employee_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function requireRole(allowedRoles) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.active) {
    throw new Error("UNAUTHENTICATED");
  }
  if (!allowedRoles.includes(profile.role)) {
    throw new Error("FORBIDDEN");
  }
  return profile;
}
