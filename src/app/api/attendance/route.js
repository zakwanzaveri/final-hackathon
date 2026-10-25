import { NextResponse } from "next/server";
import { getAdminSupabase } from "../../../lib/supabase/admin";
import { getServerSupabase, requireRole } from "../../../lib/supabase/server";

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
}

export async function GET() {
  try {
    const profile = await requireRole(["admin", "hr", "employee"]);
    const supabase = getAdminSupabase();
    let query = supabase.from("attendance").select("id, employee_id, work_date, check_in_at, check_out_at, status, minutes_worked").eq("company_id", profile.company_id).order("work_date", { ascending: false }).limit(30);
    if (profile.role === "employee") query = query.eq("employee_id", profile.employee_id);
    const { data, error } = await query;
    if (error) throw error;
    const employeeIds = [...new Set((data || []).map((record) => record.employee_id).filter(Boolean))];
    const { data: employees, error: employeeError } = employeeIds.length
      ? await supabase.from("employees").select("id, employee_code, full_name").in("id", employeeIds)
      : { data: [], error: null };
    if (employeeError) throw employeeError;
    const names = Object.fromEntries((employees || []).map((employee) => [employee.id, employee]));
    return NextResponse.json({ data: (data || []).map((record) => ({ ...record, employee: names[record.employee_id] || null })), error: null });
  } catch (error) {
    const status = error.message === "UNAUTHENTICATED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ data: null, error: { code: "ATTENDANCE_READ_FAILED", message: error.message } }, { status });
  }
}

export async function POST(request) {
  try {
    const profile = await requireRole(["admin", "hr", "employee"]);
    const supabase = getAdminSupabase();
    const workDate = today();
    let employeeId = profile.employee_id;
    if (profile.role !== "employee") {
      const body = await request.json().catch(() => ({}));
      employeeId = body.employeeId || employeeId;
    }
    if (!employeeId) throw new Error("EMPLOYEE_PROFILE_REQUIRED");

    const { data: existing, error: existingError } = await supabase.from("attendance").select("id, check_in_at, check_out_at").eq("company_id", profile.company_id).eq("employee_id", employeeId).eq("work_date", workDate).maybeSingle();
    if (existingError) throw existingError;
    if (existing?.check_in_at && !existing.check_out_at) {
      const checkOut = new Date().toISOString();
      const minutes = Math.max(0, Math.round((new Date(checkOut) - new Date(existing.check_in_at)) / 60000));
      const { data, error } = await supabase.from("attendance").update({ check_out_at: checkOut, minutes_worked: minutes, status: minutes < 300 ? "half_day" : "present" }).eq("id", existing.id).select().single();
      if (error) throw error;
      return NextResponse.json({ data, action: "checked_out", error: null });
    }
    if (existing?.check_out_at) {
      return NextResponse.json({ data: null, error: { code: "ALREADY_CHECKED_OUT", message: "Attendance is already complete for today." } }, { status: 409 });
    }
    const { data, error } = await supabase.from("attendance").insert({ company_id: profile.company_id, employee_id: employeeId, work_date: workDate, check_in_at: new Date().toISOString(), status: "present", policy_snapshot: { source: "web" } }).select().single();
    if (error) throw error;
    return NextResponse.json({ data, action: "checked_in", error: null }, { status: 201 });
  } catch (error) {
    const status = error.message === "UNAUTHENTICATED" ? 401 : error.message === "FORBIDDEN" ? 403 : error.message === "EMPLOYEE_PROFILE_REQUIRED" ? 400 : 500;
    return NextResponse.json({ data: null, error: { code: "ATTENDANCE_ACTION_FAILED", message: error.message } }, { status });
  }
}
