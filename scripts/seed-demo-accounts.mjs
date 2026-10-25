import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadLocalEnv() {
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

loadLocalEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding demo accounts.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const accounts = [
  { email: "admin@hcmlite.com", password: "admin123", role: "admin", full_name: "HCM Lite Admin" },
  { email: "hr@hcmlite.com", password: "hr1234", role: "hr", full_name: "HCM Lite HR" },
  { email: "employee@hcmlite.com", password: "employee123", role: "employee", full_name: "HCM Lite Employee" },
];

async function findUser(email) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 100) break;
  }
  return null;
}

const { data: companies, error: companyError } = await supabase.from("companies").select("id").limit(1);
if (companyError) throw companyError;
let companyId = companies[0]?.id;

if (!companyId) {
  const { data: company, error } = await supabase.from("companies").insert({
    name: "HCM Lite Demo Company",
    timezone: "Asia/Karachi",
    setup_completed_at: new Date().toISOString(),
  }).select("id").single();
  if (error) throw error;
  companyId = company.id;
}

for (const account of accounts) {
  let user = await findUser(account.email);
  if (user) {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: account.password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    company_id: companyId,
    role: account.role,
    full_name: account.full_name,
    active: true,
    must_change_password: false,
  }, { onConflict: "id" });
  if (profileError) throw profileError;
  console.log(`Ready: ${account.email} (${account.role})`);
}

const employeeUser = await findUser("employee@hcmlite.com");
if (!employeeUser) throw new Error("Employee demo user was not created.");

const { data: employee, error: employeeError } = await supabase.from("employees").upsert({
  company_id: companyId,
  profile_id: employeeUser.id,
  employee_code: "DEMO-001",
  full_name: "HCM Lite Employee",
  email: "employee@hcmlite.com",
  join_date: new Date().toISOString().slice(0, 10),
  employment_status: "active",
}, { onConflict: "company_id,email" }).select("id").single();
if (employeeError) throw employeeError;

const { error: employeeProfileError } = await supabase.from("profiles")
  .update({ employee_id: employee.id })
  .eq("id", employeeUser.id);
if (employeeProfileError) throw employeeProfileError;

const { data: existingLeaveType, error: leaveTypeLookupError } = await supabase
  .from("leave_types")
  .select("id")
  .eq("company_id", companyId)
  .eq("name", "Annual Leave")
  .maybeSingle();
if (leaveTypeLookupError) throw leaveTypeLookupError;
if (!existingLeaveType) {
  const { error: leaveTypeError } = await supabase.from("leave_types").insert({
    company_id: companyId,
    name: "Annual Leave",
    annual_quota_days: 14,
    is_paid: true,
    active: true,
  });
  if (leaveTypeError) throw leaveTypeError;
}
