import { NextResponse } from "next/server";
import { getAdminSupabase } from "../../../lib/supabase/admin";
import { getCurrentUser, requireRole } from "../../../lib/supabase/server";

async function calculate(profile, period) {
  const supabase = getAdminSupabase();
  const monthStart = `${period}-01`;
  const monthEnd = new Date(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0).toISOString().slice(0, 10);
  const { data: employees, error: employeeError } = await supabase.from("employees").select("id, employee_code, full_name").eq("company_id", profile.company_id).in("employment_status", ["active", "probation"]);
  if (employeeError) throw employeeError;
  const { data: salaries, error: salaryError } = await supabase.from("salary_structures").select("employee_id, basic_salary, effective_from").eq("company_id", profile.company_id).lte("effective_from", monthEnd).order("effective_from", { ascending: false });
  if (salaryError) throw salaryError;
  const latest = new Map();
  for (const salary of salaries || []) if (!latest.has(salary.employee_id)) latest.set(salary.employee_id, salary);
  return (employees || []).map((employee) => {
    const salary = latest.get(employee.id);
    const basic = Number(salary?.basic_salary || 0);
    const hra = basic * 0.4;
    const medical = basic * 0.1;
    return { employee_id: employee.id, employee_code: employee.employee_code, full_name: employee.full_name, basic_salary: basic, hra, medical, gross: basic + hra + medical, deductions: 0, tax: 0, net: basic + hra + medical, period: monthStart };
  });
}

export async function GET(request) {
  try {
    const profile = await requireRole(["admin"]);
    const period = new URL(request.url).searchParams.get("month") || new Date().toISOString().slice(0, 7);
    const supabase = getAdminSupabase();
    const { data: run, error } = await supabase.from("payroll_runs").select("id, period_month, status, created_at, finalized_at").eq("company_id", profile.company_id).eq("period_month", `${period}-01`).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data: { run, items: await calculate(profile, period) }, error: null });
  } catch (error) {
    const status = error.message === "UNAUTHENTICATED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ data: null, error: { code: "PAYROLL_READ_FAILED", message: error.message } }, { status });
  }
}

export async function POST(request) {
  try {
    const profile = await requireRole(["admin"]);
    const { month } = await request.json();
    if (!/^\d{4}-\d{2}$/.test(month || "")) return NextResponse.json({ data: null, error: { code: "VALIDATION_ERROR", message: "Select a valid payroll month." } }, { status: 400 });
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from("payroll_runs").insert({ company_id: profile.company_id, period_month: `${month}-01`, status: "draft", created_by: profile.id }).select().single();
    if (error && error.code !== "23505") throw error;
    const run = data || (await supabase.from("payroll_runs").select().eq("company_id", profile.company_id).eq("period_month", `${month}-01`).single()).data;
    const items = await calculate(profile, month);
    if (run?.id) {
      await supabase.from("payroll_items").upsert(items.map((item) => ({ payroll_run_id: run.id, company_id: profile.company_id, employee_id: item.employee_id, basic_salary: item.basic_salary, hra: item.hra, medical: item.medical, gross: item.gross, deductions: item.deductions, tax: item.tax, net: item.net })), { onConflict: "payroll_run_id,employee_id" });
    }
    const user = await getCurrentUser();
    await supabase.from("audit_logs").insert({ company_id: profile.company_id, actor_user_id: user?.id, action: "payroll_draft_created", entity_type: "payroll_runs", entity_id: run?.id || null, after_json: { month } });
    return NextResponse.json({ data: { run, items }, error: null }, { status: 201 });
  } catch (error) {
    const status = error.message === "UNAUTHENTICATED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ data: null, error: { code: "PAYROLL_CREATE_FAILED", message: error.message } }, { status });
  }
}

export async function PATCH(request) {
  try {
    const profile = await requireRole(["admin"]);
    const { id } = await request.json();
    if (!id) return NextResponse.json({ data: null, error: { code: "VALIDATION_ERROR", message: "Payroll run is required." } }, { status: 400 });
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from("payroll_runs").update({ status: "finalized", finalized_by: profile.id, finalized_at: new Date().toISOString() }).eq("id", id).eq("company_id", profile.company_id).eq("status", "draft").select().single();
    if (error) throw error;
    await supabase.from("audit_logs").insert({ company_id: profile.company_id, actor_user_id: profile.id, action: "payroll_finalized", entity_type: "payroll_runs", entity_id: id, after_json: { status: "finalized" } });
    return NextResponse.json({ data, error: null });
  } catch (error) {
    const status = error.message === "UNAUTHENTICATED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ data: null, error: { code: "PAYROLL_FINALIZE_FAILED", message: error.message } }, { status });
  }
}
