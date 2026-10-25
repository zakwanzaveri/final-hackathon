import { Home } from "../page";
import { requireRole } from "../../lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  try {
    await requireRole(["admin"]);
  } catch {
    redirect("/login");
  }
  return <Home forcedRole="Admin" />;
}
