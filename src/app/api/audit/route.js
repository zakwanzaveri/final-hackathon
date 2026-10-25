import { NextResponse } from "next/server";
import { getAdminSupabase } from "../../../lib/supabase/admin";
import { requireRole } from "../../../lib/supabase/server";

export async function GET() {
  try {
    const profile = await requireRole(["admin"]);
    const { data, error } = await getAdminSupabase().from("audit_logs").select("id, action, entity_type, entity_id, before_json, after_json, created_at").eq("company_id", profile.company_id).order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ data, error: null });
  } catch (error) {
    const status = error.message === "UNAUTHENTICATED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ data: null, error: { code: "AUDIT_READ_FAILED", message: error.message } }, { status });
  }
}
