import { Home } from "../page";
import { requireRole } from "../../lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HrPage() {
  try {
    await requireRole(["hr"]);
  } catch {
    redirect("/login");
  }
  return <Home forcedRole="HR" />;
}
