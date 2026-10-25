"use client";

import { useEffect, useState } from "react";

const emptyForm = { fullName: "", email: "", temporaryPassword: "" };

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("Loading accounts…");

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || result.data?.role !== "admin") window.location.href = result.data?.role === "hr" ? "/hr" : "/employee";
    }).catch(() => { window.location.href = "/login"; });
  }, []);

  async function load() {
    const response = await fetch("/api/accounts");
    const result = await response.json();
    if (!response.ok) return setMessage(result.error?.message || "Accounts could not be loaded.");
    setAccounts(result.data || []);
    setMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    const response = await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const result = await response.json();
    setMessage(response.ok ? "HR account created. They must change the temporary password on first login." : result.error?.message || "HR account could not be created.");
    if (response.ok) { setForm(emptyForm); load(); }
  }

  useEffect(() => { load(); }, []);
  return <main className="content-wrap organization-page"><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>Accounts</strong></div><section className="hero organization-hero"><div><p className="eyebrow">Access administration</p><h1>Manage HR access</h1><p className="hero-copy">Create HR accounts with a temporary password. Employees are created from the People page.</p></div></section><section className="panel employee-form-panel"><div className="panel-heading"><div><p className="eyebrow">New HR user</p><h2>Invite an HR partner</h2></div></div><form className="employee-form" onSubmit={submit}><label>Full name<input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="HR full name" /></label><label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="hr@company.com" /></label><label>Temporary password<input required type="password" minLength="8" value={form.temporaryPassword} onChange={(e) => setForm({ ...form, temporaryPassword: e.target.value })} /></label><div className="employee-form-actions"><button className="button button-primary">Create HR account</button></div></form></section>{message && <p className="form-message">{message}</p>}<section className="panel employee-list-panel"><div className="panel-heading"><div><p className="eyebrow">Workspace accounts</p><h2>{accounts.length} accounts</h2></div></div><div className="record-list">{accounts.map((account) => <div className="record-row" key={account.id}><span className="avatar">{account.role === "admin" ? "AD" : "HR"}</span><div><b>{account.full_name}</b><small>{account.role.toUpperCase()} · {account.must_change_password ? "Password change required" : "Active access"}</small></div><span className="status-pill">{account.active ? "active" : "inactive"}</span></div>)}</div></section></main>;
}
