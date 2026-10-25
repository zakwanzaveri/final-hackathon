"use client";

import { useEffect, useState } from "react";

const emptyForm = { employeeCode: "", fullName: "", email: "", phone: "", address: "", gender: "", joinDate: "", employmentStatus: "active", basicSalary: "", temporaryPassword: "" };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("Loading employees…");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || !["admin", "hr"].includes(result.data?.role)) window.location.href = result.data?.role === "employee" ? "/employee" : "/login";
    }).catch(() => { window.location.href = "/login"; });
  }, []);

  function load() {
    fetch("/api/employees").then((response) => response.json()).then((result) => {
      if (!result.data) { setMessage(result.error?.message || "Employees could not be loaded."); return; }
      setEmployees(result.data);
      setMessage("");
    }).catch(() => setMessage("Connect Supabase to load employees."));
  }

  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    const response = await fetch("/api/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error?.message || "Employee could not be created."); return; }
    setMessage("Employee registered. Their first login requires a password change.");
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  return (
    <main className="content-wrap organization-page">
      <div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>People</strong></div>
      <section className="hero organization-hero"><div><p className="eyebrow">Employee directory</p><h1>Know your people</h1><p className="hero-copy">Register real employee records and create secure first-login access. No demo employees are seeded.</p></div><button className="button button-primary" onClick={() => setShowForm(!showForm)}>＋ Register employee</button></section>
      {showForm && <section className="panel employee-form-panel"><div className="panel-heading"><div><p className="eyebrow">New employee</p><h2>Create employee access</h2></div></div><form className="employee-form" onSubmit={submit}><label>Employee code<input required value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} placeholder="EMP-001" /></label><label>Full name<input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full name" /></label><label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="employee@company.com" /></label><label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label>Join date<input type="date" required value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} /></label><label>Basic salary<input type="number" min="1" required value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} placeholder="100000" /></label><label className="wide-field">Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label><label>Temporary password<input type="password" minLength="8" required value={form.temporaryPassword} onChange={(e) => setForm({ ...form, temporaryPassword: e.target.value })} /></label><div className="employee-form-actions"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-primary">Create employee</button></div></form></section>}
      {message && <p className="form-message">{message}</p>}
      <section className="panel employee-list-panel"><div className="panel-heading"><div><p className="eyebrow">Directory</p><h2>{employees.length} employees</h2></div></div>{employees.length ? <div className="record-list">{employees.map((employee) => <div className="record-row" key={employee.id}><span className="avatar">{employee.full_name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div><b>{employee.full_name}</b><small>{employee.employee_code} · {employee.email}</small></div><span className="status-pill">{employee.employment_status}</span></div>)}</div> : !message && <div className="empty-activity"><div className="empty-icon">＋</div><b>No employees yet</b><p>Register the first employee to start attendance and leave workflows.</p></div>}</section>
    </main>
  );
}
