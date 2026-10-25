import { NextResponse } from "next/server";
import { getAdminSupabase } from "../../../lib/supabase/admin";
import { setupSchema } from "../../../lib/validation/setup";

export async function POST(request) {
  let input;
  try {
    input = setupSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: error.issues?.[0]?.message || "Invalid setup details." } },
      { status: 400 },
    );
  }

  try {
    const supabase = getAdminSupabase();
    const { count, error: countError } = await supabase
      .from("companies")
      .select("id", { count: "exact", head: true });
    if (countError) throw countError;
    if (count > 0) {
      return NextResponse.json(
        { data: null, error: { code: "SETUP_COMPLETE", message: "Initial setup has already been completed." } },
        { status: 409 },
      );
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: input.companyName,
        timezone: input.timezone,
        office_start: input.officeStart,
        grace_minutes: input.graceMinutes,
      })
      .select("id")
      .single();
    if (companyError) throw companyError;

    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: input.adminEmail,
      password: input.adminPassword,
      email_confirm: true,
    });
    if (userError) throw userError;

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.user.id,
      company_id: company.id,
      role: "admin",
      full_name: input.adminName,
    });
    if (profileError) {
      await supabase.auth.admin.deleteUser(user.user.id);
      await supabase.from("companies").delete().eq("id", company.id);
      throw profileError;
    }

    const { error: completeError } = await supabase
      .from("companies")
      .update({ setup_completed_at: new Date().toISOString() })
      .eq("id", company.id);
    if (completeError) throw completeError;

    return NextResponse.json({ data: { companyId: company.id }, error: null }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: { code: "SETUP_FAILED", message: error.message || "Setup could not be completed." } },
      { status: 500 },
    );
  }
}
