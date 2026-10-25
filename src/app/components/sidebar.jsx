"use client";

import Link from "next/link";

export const navigation = {
  admin: [
    ["/admin", "Overview"],
    ["/organization", "Organization"],
    ["/employees", "People"],
    ["/attendance", "Attendance"],
    ["/leave", "Leave"],
    ["/payroll", "Payroll"],
    ["/audit", "Audit log"],
    ["/change-password", "Profile / Settings"],
  ],
  hr: [
    ["/hr", "Overview"],
    ["/employees", "People"],
    ["/attendance", "Attendance"],
    ["/leave", "Leave"],
    ["/change-password", "Profile / Settings"],
  ],
  employee: [
    ["/employee", "My Overview"],
    ["/attendance", "My Attendance"],
    ["/leave", "My Leaves"],
    ["/change-password", "Profile"],
  ],
};

export default function Sidebar({ role, pathname, onClose }) {
  const links = navigation[role] || [];
  const activePath = pathname === "/admin/dashboard" ? "/admin" : pathname === "/hr/dashboard" ? "/hr" : pathname === "/employee/dashboard" ? "/employee" : pathname;
  const workspaceLabel = role === "admin" ? "Admin workspace" : role === "hr" ? "HR workspace" : "Employee workspace";
  const roleLabel = role === "admin" ? "Admin" : role === "hr" ? "HR" : "Employee";

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">H</div>
        <div><strong>HCM Lite</strong><span>People, made clear.</span></div>
        {onClose && <button className="close-nav" onClick={onClose} aria-label="Close navigation">×</button>}
      </div>
      <div className="workspace-switcher"><span className="workspace-icon"><span className="mini-mark">H</span></span><span><b>{workspaceLabel}</b><small>{roleLabel} dashboard</small></span></div>
      <nav className="main-nav" aria-label="Main navigation">
        <p className="nav-label">Workspace</p>
        {links.map(([href, label]) => <Link className={`nav-item ${activePath === href ? "active" : ""}`} href={href} key={href}>{label}</Link>)}
        <p className="nav-label nav-label-spaced">Account</p>
        <Link className="nav-item" href="/login">Sign out / switch user</Link>
      </nav>
      <div className="sidebar-footer"><div className="help-card"><span className="help-dot">?</span><div><b>Demo workspace</b><small>Use the menu to navigate</small></div></div></div>
    </aside>
  );
}
