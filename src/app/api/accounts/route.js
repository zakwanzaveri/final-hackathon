import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSupabase } from "../../../lib/supabase/admin";
import { getServerSupabase, requireRole } from "../../../lib/supabase/server";

const accountSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  temporaryPassword: z.string().min(8).max(128),
});

export async function GET() {
  try {
    const profile = await requireRole(["admin"]);
    const supabase = await getServerSupabase();
    const { data, error } = await supabase.from("profiles").select("id, full_name, role, active, must_change_password, created_at").eq("company_id", profile.company_id).in("role", ["admin", "hr"]).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data, error: null });
  } catch (error) {
    const status = error.message === "UNAUTHENTICATED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ data: null, error: { code: "ACCOUNT_READ_FAILED", message: error.message } }, { status });
  }
}

export async function POST(request) {
  try {
    const actor = await requireRole(["admin"]);
    const input = accountSchema.parse(await request.json());
    const admin = getAdminSupabase();
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({ email: input.email, password: input.temporaryPassword, email_confirm: true });
    if (authError) throw authError;
    const { data, error } = await admin.from("profiles").insert({ id: authUser.user.id, company_id: actor.company_id, role: "hr", full_name: input.fullName, must_change_password: true }).select("id, full_name, role, active, must_change_password").single();
    if (error) {
      await admin.auth.admin.deleteUser(authUser.user.id);
      throw error;
    }
    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (error) {
    const status = error.name === "ZodError" ? 400 : error.message === "UNAUTHENTICATED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ data: null, error: { code: "ACCOUNT_CREATE_FAILED", message: error.issues?.[0]?.message || error.message } }, { status });
  }
}
