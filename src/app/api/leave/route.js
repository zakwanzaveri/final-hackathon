import { NextResponse } from "next/server";
import { getAdminSupabase } from "../../../lib/supabase/admin";
import { getCurrentUser, requireRole } from "../../../lib/supabase/server";

async function resolveEmployeeId(profile) {
  if (profile.employee_id) return profile.employee_id;
  const user = await getCurrentUser();
  if (!user?.email) throw new Error("EMPLOYEE_PROFILE_REQUIRED");

  const admin = getAdminSupabase();
  const { data: employee, error } = await admin
    .from("employees")
    .select("id")
    .eq("company_id", profile.company_id)
    .eq("email", user.email)
    .maybeSingle();
  if (error) throw error;
  if (!employee) throw new Error("EMPLOYEE_PROFILE_REQUIRED");
  return employee.id;
}

async function resolveLeaveType(profile, leaveTypeId) {
  const { data, error } = await getAdminSupabase()
    .from("leave_types")
    .select("id")
    .eq("id", leaveTypeId)
    .eq("company_id", profile.company_id)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("LEAVE_TYPE_NOT_FOUND");
  return data.id;
}

export async function GET(request) {
  try {
    const profile = await requireRole(["admin", "hr", "employee"]);
    const supabase = getAdminSupabase();
    const requestUrl = new URL(request.url);
    let query = supabase.from("leave_requests").select("id, employee_id, leave_type_id, start_date, end_date, working_days, reason, status, reviewer_comment, created_at").eq("company_id", profile.company_id).order("created_at", { ascending: false });
    if (requestUrl.searchParams.get("status") === "pending") query = query.eq("status", "pending");
    if (profile.role === "employee") {
      query = query.eq("employee_id", await resolveEmployeeId(profile));
    }
    const [{ data, error }, { data: leaveTypes, error: leaveTypeError }] = await Promise.all([
      query,
      supabase.from("leave_types").select("id, name, annual_quota_days, is_paid").eq("company_id", profile.company_id).eq("active", true).order("name", { ascending: true }),
    ]);
    if (error) throw error;
    if (leaveTypeError) throw leaveTypeError;
    return NextResponse.json({ data, leaveTypes, error: null });
  } catch (error) {
    const status = error.message === "UNAUTHENTICATED" ? 401 : error.message === "FORBIDDEN" ? 403 : ["EMPLOYEE_PROFILE_REQUIRED", "LEAVE_TYPE_NOT_FOUND"].includes(error.message) ? 400 : 500;
    return NextResponse.json({ data: null, error: { code: "LEAVE_READ_FAILED", message: error.message } }, { status });
  }
}

export async function POST(request) {
  try {
    const profile = await requireRole(["employee"]);
    const body = await request.json();
    const start = new Date(`${body.startDate}T00:00:00Z`);
    const end = new Date(`${body.endDate}T00:00:00Z`);
    const workingDays = Math.floor((end - start) / 86400000) + 1;
    if (!body.leaveTypeId || !body.startDate || !body.endDate || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || workingDays < 1 || !body.reason?.trim()) {
      return NextResponse.json({ data: null, error: { code: "VALIDATION_ERROR", message: "Leave type, valid dates and reason are required." } }, { status: 400 });
    }
    const employeeId = await resolveEmployeeId(profile);
    const leaveTypeId = await resolveLeaveType(profile, body.leaveTypeId);
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from("leave_requests").insert({ company_id: profile.company_id, employee_id: employeeId, leave_type_id: leaveTypeId, start_date: body.startDate, end_date: body.endDate, working_days: workingDays, reason: body.reason.trim() }).select().single();
    if (error) throw error;
    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (error) {
    const status = error.message === "UNAUTHENTICATED" ? 401 : error.message === "FORBIDDEN" ? 403 : ["EMPLOYEE_PROFILE_REQUIRED", "LEAVE_TYPE_NOT_FOUND"].includes(error.message) ? 400 : 500;
    return NextResponse.json({ data: null, error: { code: "LEAVE_CREATE_FAILED", message: error.message } }, { status });
  }
}

export async function PATCH(request) {
  try {
    const profile = await requireRole(["admin", "hr"]);
    const { id, status, reviewerComment } = await request.json();
    if (!id || !["approved", "rejected"].includes(status) || (status === "rejected" && !reviewerComment?.trim())) {
      return NextResponse.json({ data: null, error: { code: "VALIDATION_ERROR", message: "Decision and rejection comment are required." } }, { status: 400 });
    }
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from("leave_requests").update({ status, reviewer_id: profile.id, reviewer_comment: reviewerComment?.trim() || null, decided_at: new Date().toISOString() }).eq("id", id).eq("company_id", profile.company_id).eq("status", "pending").select().single();
    if (error) throw error;
    return NextResponse.json({ data, error: null });
  } catch (error) {
    const status = error.message === "UNAUTHENTICATED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ data: null, error: { code: "LEAVE_DECISION_FAILED", message: error.message } }, { status });
  }
}
