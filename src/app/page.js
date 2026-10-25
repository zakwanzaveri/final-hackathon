"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const roles = {
  Admin: {
    workspace: "Admin control center",
    eyebrow: "Company control center",
    title: "Good morning, Admin",
    description: "Set up your company and build a trusted people operations workspace.",
    actions: ["Complete company setup", "Invite HR partner"],
    metrics: [
      ["Headcount", "—", "No employee records yet"],
      ["Payroll cost", "—", "Available after payroll"],
      ["Attendance rate", "—", "Available after attendance"],
      ["Open approvals", "—", "Nothing pending"],
    ],
  },
  HR: {
    workspace: "HR operations desk",
    eyebrow: "People operations",
    title: "Good morning, HR",
    description: "Register employees and keep daily people operations moving.",
    actions: ["Register first employee", "View attendance"],
    metrics: [
      ["Employees", "—", "No employee records yet"],
      ["Present today", "—", "Available after check-in"],
      ["On leave", "—", "No leave records yet"],
      ["Pending approvals", "—", "Nothing pending"],
    ],
  },
  Employee: {
    workspace: "Employee self-service",
    eyebrow: "Your private workspace",
    title: "Welcome to HCM Lite",
    description: "See your profile, attendance and leave status in one private workspace.",
    actions: ["Check in", "Request leave"],
    metrics: [
      ["Hours this week", "—", "No attendance yet"],
      ["Late count", "—", "No attendance yet"],
      ["Leave balance", "—", "No leave policy assigned"],
      ["Profile", "—", "Your personal employee record"],
    ],
  },
};

function Icon({ name }) {
  const paths = {
    clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    plus: "M12 5v14M5 12h14",
    chevron: "m9 18 6-6-6-6",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  };
  return <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none"><path d={paths[name] || paths.users} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function LeaveApprovals() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("Loading pending leave requests…");

  async function load() {
    try {
      const response = await fetch("/api/leave?status=pending", { cache: "no-store", credentials: "include" });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error?.message || "Leave approvals are unavailable.");
        return;
      }
      setRequests(result.data || []);
      setMessage("");
    } catch (error) {
      console.error("Pending leave load failed:", error);
      setMessage("Leave approvals are unavailable.");
    }
  }

  async function decide(id, status) {
    const reviewerComment = status === "rejected" ? window.prompt("Reason for rejection:")?.trim() : "";
    if (status === "rejected" && !reviewerComment) return;
    try {
      const response = await fetch("/api/leave", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, reviewerComment }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error?.message || "Leave decision failed.");
        return;
      }
      await load();
      setMessage(`Leave request ${status}.`);
    } catch (error) {
      console.error("Leave decision failed:", error);
      setMessage("Leave decision failed. Try again.");
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <article className="panel activity-panel leave-approvals-panel">
      <div className="panel-heading"><div><p className="eyebrow">Management</p><h2>Leave requests</h2></div><span className="status-pill">{requests.length} pending</span></div>
      {message && <p className="form-message">{message}</p>}
      <div className="record-list">
        {requests.length ? requests.map((request) => (
          <div className="record-row" key={request.id}>
            <span className="record-dot" />
            <div><b>{request.start_date} → {request.end_date}</b><small>{request.reason} · {request.working_days} day(s)</small></div>
            <div className="hero-actions"><button className="button button-primary" onClick={() => decide(request.id, "approved")}>Approve</button><button className="button button-secondary" onClick={() => decide(request.id, "rejected")}>Reject</button></div>
          </div>
        )) : !message && <div className="empty-activity"><b>No pending leave requests</b><p>New employee requests will appear here.</p></div>}
      </div>
    </article>
  );
}

export function Home({ forcedRole }) {
  const pathname = usePathname();
  const routeRole = pathname === "/hr" || pathname === "/hr/dashboard" ? "HR" : pathname === "/employee" || pathname === "/employee/dashboard" ? "Employee" : "Admin";
  const [role, setRole] = useState(forcedRole || routeRole);
  const content = useMemo(() => roles[role], [role]);
  const actionPath = role === "Admin" ? "/accounts" : role === "HR" ? "/employees" : "/attendance";
  const secondaryPath = role === "Employee" ? "/leave" : role === "HR" ? "/attendance" : "/accounts";

  const goTo = (path) => { window.location.href = path; };

  return (
    <div className={`content-wrap ${role.toLowerCase()}-dashboard`}>
      {!forcedRole && <div className="role-switcher" aria-label="Preview role">{Object.keys(roles).map((item) => <button key={item} onClick={() => setRole(item)} className={role === item ? "selected" : ""}>{item} view</button>)}</div>}
      <section className="hero">
        <div><p className="eyebrow">{content.eyebrow}</p><h1>{content.title}</h1><p className="hero-copy">{content.description}</p></div>
        <div className="hero-actions"><button className="button button-secondary" onClick={() => goTo(secondaryPath)}>{content.actions[1]}</button><button className="button button-primary" onClick={() => goTo(actionPath)}><Icon name="plus" />{content.actions[0]}</button></div>
      </section>
      <section className="metric-grid">{content.metrics.map(([label, value, hint]) => <article className="metric-card" key={label}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon name={label.includes("Hours") ? "clock" : "users"} /></span></div><strong>{value}</strong><small>{hint}</small></article>)}</section>
      <section className="dashboard-grid">
        <article className="panel setup-panel">
          <div className="panel-heading"><div><p className="eyebrow">{role === "Employee" ? "Personal workspace" : "Next best step"}</p><h2>{role === "Employee" ? "Your profile and status" : "Start with a clean workspace"}</h2></div><span className="status-pill">{role === "Employee" ? "Private" : "0% complete"}</span></div>
          <p className="panel-copy">{role === "Employee" ? "Only your own profile, attendance and leave information is shown here." : "HCM Lite never invents people or metrics. Complete setup to create the records your team will use."}</p>
          <div className="setup-list">
            {role === "Employee" ? <><div className="setup-row"><span className="step-number">1</span><div><b>Attendance status</b><small>Check in or check out using server time</small></div><button className="text-button" onClick={() => goTo("/attendance")}>Open <Icon name="chevron" /></button></div><div className="setup-row"><span className="step-number">2</span><div><b>Leave status</b><small>View your history or submit a request</small></div><button className="text-button" onClick={() => goTo("/leave")}>Open <Icon name="chevron" /></button></div><div className="setup-row"><span className="step-number">3</span><div><b>Personal profile</b><small>Your employee account and company assignment</small></div><span className="locked">Private</span></div></> : <><div className="setup-row"><span className="step-number">1</span><div><b>Set up your company</b><small>Name, timezone, office hours and leave policies</small></div><button className="text-button">Start <Icon name="chevron" /></button></div><div className="setup-row"><span className="step-number">2</span><div><b>Add your people</b><small>Create HR access and register employees</small></div><span className="locked">Locked</span></div><div className="setup-row"><span className="step-number">3</span><div><b>Run your first day</b><small>Attendance, leave and payroll insights</small></div><span className="locked">Locked</span></div></>}
          </div>
        </article>
        <article className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">Live workspace</p><h2>Recent activity</h2></div></div><div className="empty-activity"><div className="empty-icon"><Icon name="clock" /></div><b>No activity yet</b><p>Events from setup, attendance, leave and payroll will appear here.</p></div></article>
      </section>
      {role !== "Employee" && <section className="dashboard-grid"><LeaveApprovals /></section>}
      <footer className="page-footer"><span>HCM Lite · Secure by design</span><span><i className="online-dot" />All systems operational</span></footer>
    </div>
  );
}

export default Home;
