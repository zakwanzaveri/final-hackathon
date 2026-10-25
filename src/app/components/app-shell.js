"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "./dashboard-layout";
import { getBrowserSupabase } from "../../lib/supabase/browser";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [role, setRole] = useState(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let active = true;

    async function loadRole() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session) {
        setRole(null);
        setRoleLoaded(true);
        if (pathname !== "/login") window.location.href = "/login";
        return;
      }
      const response = await fetch("/api/me", { cache: "no-store", credentials: "include" });
      const result = response.ok ? await response.json() : null;
      const nextRole = String(result?.data?.role || "").toLowerCase();
      if (!active) return;
      setRole(["admin", "hr", "employee"].includes(nextRole) ? nextRole : null);
      setRoleLoaded(true);
      if (!nextRole && pathname !== "/login") window.location.href = "/login";
    }

    loadRole().catch(() => {
      if (!active) return;
      setRole(null);
      setRoleLoaded(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) loadRole();
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [pathname]);

  if (["/", "/login", "/signup", "/setup"].includes(pathname)) return children;

  if (!roleLoaded) return <main className="auth-page"><p className="form-message loading">Loading workspace…</p></main>;
  if (!role) return null;
  return <DashboardLayout role={role} pathname={pathname} sidebarOpen={sidebarOpen} onOpenSidebar={() => setSidebarOpen(true)} onCloseSidebar={() => setSidebarOpen(false)}>{children}</DashboardLayout>;
}
