import { NextResponse } from "next/server";
import { getServerSupabase, requireRole } from "../../../lib/supabase/server";
import { organizationSchema } from "../../../lib/validation/organization";

const readTables = {
  departments: "departments",
  designations: "designations",
  leaveTypes: "leave_types",
  holidays: "holidays",
};

export async function GET() {
  try {
    const profile = await requireRole(["admin", "hr", "employee"]);
    const supabase = await getServerSupabase();
    const results = await Promise.all(
      Object.entries(readTables).map(async ([key, table]) => {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq("company_id", profile.company_id)
          .eq("active", true)
          .order("name", { ascending: true });
        if (error) throw error;
        return [key, data];
      }),
    );
    return NextResponse.json({ data: Object.fromEntries(results), error: null });
  } catch (error) {
    const status = error.message === "UNAUTHENTICATED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ data: null, error: { code: "ORGANIZATION_READ_FAILED", message: error.message } }, { status });
  }
}

export async function POST(request) {
  try {
    const profile = await requireRole(["admin"]);
    const input = organizationSchema.parse(await request.json());
    const supabase = await getServerSupabase();
    const rows = {
      department: { name: input.name, code: input.code },
      designation: { name: input.name, department_id: input.departmentId || null },
      leaveType: { name: input.name, annual_quota_days: input.annualQuotaDays, is_paid: input.isPaid },
      holiday: { name: input.name, holiday_date: input.holidayDate },
    };
    const tables = { department: "departments", designation: "designations", leaveType: "leave_types", holiday: "holidays" };
    const { data, error } = await supabase
      .from(tables[input.type])
      .insert({ ...rows[input.type], company_id: profile.company_id })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (error) {
    const status = error.name === "ZodError" ? 400 : error.message === "UNAUTHENTICATED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ data: null, error: { code: "ORGANIZATION_WRITE_FAILED", message: error.issues?.[0]?.message || error.message } }, { status });
  }
}
