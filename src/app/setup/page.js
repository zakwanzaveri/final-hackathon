"use client";

import { useState } from "react";

const initialForm = {
  companyName: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
  timezone: "Asia/Karachi",
  officeStart: "09:00",
  graceMinutes: "15",
};

export default function SetupPage() {
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ status: "idle", message: "" });

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });

    const response = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();

    if (!response.ok) {
      setState({ status: "error", message: result.error?.message || "Setup could not be completed." });
      return;
    }

    setState({ status: "success", message: "Company created. You can now sign in as Admin." });
    setForm(initialForm);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand auth-brand"><div className="brand-mark">H</div><div><strong>HCM Lite</strong><span>People, made clear.</span></div></div>
        <p className="eyebrow">First-run setup</p>
        <h1>Create your workspace</h1>
        <p className="auth-copy">Start with a clean company. No employees, attendance or dashboard figures are created for you.</p>
        <form onSubmit={submit} className="auth-form">
          <label>Company name<input name="companyName" value={form.companyName} onChange={update} placeholder="Acme workspace" required /></label>
          <label>Admin name<input name="adminName" value={form.adminName} onChange={update} placeholder="Your full name" required /></label>
          <label>Admin email<input type="email" name="adminEmail" value={form.adminEmail} onChange={update} placeholder="admin@company.com" required /></label>
          <label>Admin password<input type="password" name="adminPassword" value={form.adminPassword} onChange={update} placeholder="At least 8 characters" minLength="8" required /></label>
          <div className="form-row"><label>Timezone<input name="timezone" value={form.timezone} onChange={update} required /></label><label>Office start<input type="time" name="officeStart" value={form.officeStart} onChange={update} required /></label><label>Grace (min)<input type="number" name="graceMinutes" value={form.graceMinutes} onChange={update} min="0" max="180" required /></label></div>
          {state.message && <p className={`form-message ${state.status}`}>{state.message}</p>}
          <button className="button button-primary auth-submit" disabled={state.status === "loading"}>{state.status === "loading" ? "Creating workspace…" : "Create workspace"}</button>
        </form>
        <p className="auth-switch">Already set up? <a href="/login">Sign in</a></p>
      </section>
    </main>
  );
}
