"use client";

import { useEffect, useState } from "react";

export default function PayrollPage() {
  const [month, setMonth] = useState("");
  const [role, setRole] = useState("");
  const [data, setData] = useState({ run: null, items: [] });
  const [message, setMessage] = useState("Loading payroll…");
  async function load() {
    const response = await fetch(`/api/payroll?month=${month}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error?.message || "Payroll unavailable.");
    setData(result.data); setMessage("");
  }
  async function createDraft() {
    const response = await fetch("/api/payroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month }) });
    const result = await response.json();
    setMessage(response.ok ? "Payroll draft ready for review." : result.error?.message || "Payroll draft failed.");
    if (response.ok) setData(result.data);
  }
  async function finalize() {
    const response = await fetch("/api/payroll", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: data.run.id }) });
    const result = await response.json();
    setMessage(response.ok ? "Payroll finalized and locked." : result.error?.message || "Finalization failed.");
    if (response.ok) load();
  }
  useEffect(() => {
    fetch("/api/me", { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || result.data?.role !== "admin") {
        window.location.href = result.data?.role === "hr" ? "/hr" : result.data?.role === "employee" ? "/employee" : "/login";
        return;
      }
      setRole("admin");
      setMonth(new Date().toISOString().slice(0, 7));
    }).catch(() => { window.location.href = "/login"; });
  }, []);
  useEffect(() => { if (month) load(); }, [month]);
  return <main className="content-wrap organization-page"><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>Payroll</strong></div><section className="hero organization-hero"><div><p className="eyebrow">Payroll lite</p><h1>Review monthly payroll</h1><p className="hero-copy">Draft payroll is calculated from current employee salary structures. Admin finalization locks the run.</p></div><div className="hero-actions"><input className="month-input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />{role === "admin" && data.run?.status === "draft" && <button className="button button-primary" onClick={finalize}>Finalize</button>}<button className="button button-secondary" onClick={createDraft}>Create draft</button></div></section>{message && <p className="form-message">{message}</p>}<section className="panel employee-list-panel"><div className="panel-heading"><div><p className="eyebrow">Payroll run</p><h2>{data.run ? `${data.run.status} · ${data.items.length} employees` : "No draft for this month"}</h2></div></div><div className="record-list">{data.items.map((item) => <div className="record-row" key={item.employee_id}><div><b>{item.full_name}</b><small>{item.employee_code} · Basic {item.basic_salary.toLocaleString()} · Gross {item.gross.toLocaleString()} · Net {item.net.toLocaleString()}</small></div></div>)}</div></section></main>;
}
