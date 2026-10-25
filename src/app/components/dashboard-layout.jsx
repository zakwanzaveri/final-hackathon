"use client";

import Link from "next/link";
import Sidebar, { navigation } from "./sidebar";
import ChatPanel from "./chat-panel";

export default function DashboardLayout({ children, role, pathname, sidebarOpen, onOpenSidebar, onCloseSidebar }) {
  return (
    <div className="app-frame">
      <div className={sidebarOpen ? "sidebar-mobile-open" : ""}>
        <Sidebar role={role} pathname={pathname} onClose={onCloseSidebar} />
      </div>
      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" onClick={onOpenSidebar} aria-label="Open navigation">☰</button>
          <div className="breadcrumbs"><span>{role === "admin" ? "Admin" : role === "hr" ? "HR" : "Employee"} workspace</span><b>/</b><strong>{SidebarLabel({ role, pathname })}</strong></div>
          <Link className="topbar-avatar" href="/login">{role === "admin" ? "AD" : role === "hr" ? "HR" : "EM"}</Link>
        </header>
        {children}
      </main>
      <ChatPanel />
    </div>
  );
}

function SidebarLabel({ role, pathname }) {
  const normalized = pathname === "/admin/dashboard" ? "/admin" : pathname === "/hr/dashboard" ? "/hr" : pathname === "/employee/dashboard" ? "/employee" : pathname;
  return (navigation[role] || []).find(([href]) => href === normalized)?.[1] || "Workspace";
}
