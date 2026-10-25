import { NextResponse } from "next/server";
import { getAdminSupabase } from "../../../lib/supabase/admin";
import { getServerSupabase, requireRole } from "../../../lib/supabase/server";
import { employeeSchema } from "../../../lib/validation/employee";

export async function GET() {
  try {
    const profile = await requireRole(["admin", "hr"]);
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from("employees")
      .select("id, employee_code, full_name, email, phone, gender, join_date, employment_status, department_id, designation_id")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data, error: null });
  } catch (error) {
    const status = error.message === "UNAUTHENTICATED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ data: null, error: { code: "EMPLOYEE_READ_FAILED", message: error.message } }, { status });
  }
}

export async function POST(request) {
  try {
    const actor = await requireRole(["admin", "hr"]);
    const input = employeeSchema.parse(await request.json());
    const admin = getAdminSupabase();

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.temporaryPassword,
      email_confirm: true,
    });
    if (authError) throw authError;

    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .insert({
        company_id: actor.company_id,
        employee_code: input.employeeCode,
        full_name: input.fullName,
        email: input.email,
        phone: input.phone || null,
        address: input.address || null,
        gender: input.gender || null,
        department_id: input.departmentId || null,
        designation_id: input.designationId || null,
        join_date: input.joinDate,
        employment_status: input.employmentStatus,
        created_by: actor.id,
      })
      .select("id")
      .single();
    if (employeeError) {
      await admin.auth.admin.deleteUser(authUser.user.id);
      throw employeeError;
    }

    const { error: profileError } = await admin.from("profiles").insert({
      id: authUser.user.id,
      company_id: actor.company_id,
      role: "employee",
      full_name: input.fullName,
      must_change_password: true,
      employee_id: employee.id,
    });
    if (profileError) {
      await admin.from("employees").delete().eq("id", employee.id);
      await admin.auth.admin.deleteUser(authUser.user.id);
      throw profileError;
    }

    const { error: linkError } = await admin.from("employees").update({ profile_id: authUser.user.id }).eq("id", employee.id);
    if (linkError) throw linkError;

    const { error: salaryError } = await admin.from("salary_structures").insert({
      company_id: actor.company_id,
      employee_id: employee.id,
      basic_salary: input.basicSalary,
      effective_from: input.joinDate,
      created_by: actor.id,
    });
    if (salaryError) throw salaryError;

    return NextResponse.json({ data: { employeeId: employee.id }, error: null }, { status: 201 });
  } catch (error) {
    const status = error.name === "ZodError" ? 400 : error.message === "UNAUTHENTICATED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ data: null, error: { code: "EMPLOYEE_CREATE_FAILED", message: error.issues?.[0]?.message || error.message } }, { status });
  }
}
