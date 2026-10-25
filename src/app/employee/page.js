import { Home } from "../page";
import { requireRole } from "../../lib/supabase/server";
import { redirect } from "next/navigation";

export default async function EmployeePage() {
  try {
    await requireRole(["employee"]);
  } catch {
    redirect("/login");
  }
  return <Home forcedRole="Employee" />;
}
