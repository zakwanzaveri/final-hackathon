"use client";

import { useEffect, useState } from "react";

const sections = [
  { key: "departments", label: "Departments", type: "department", description: "Teams and reporting groups" },
  { key: "designations", label: "Designations", type: "designation", description: "Job titles used by employees" },
  { key: "leaveTypes", label: "Leave types", type: "leaveType", description: "Paid and unpaid leave policies" },
  { key: "holidays", label: "Holidays", type: "holiday", description: "Non-working company dates" },
];

export default function OrganizationPage() {
  const [data, setData] = useState({ departments: [], designations: [], leaveTypes: [], holidays: [] });
  const [active, setActive] = useState(sections[0]);
  const [form, setForm] = useState({ name: "", code: "", annualQuotaDays: "", isPaid: true, holidayDate: "" });
  const [message, setMessage] = useState("Loading organization settings…");

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" }).then(async (profileResponse) => {
      const profile = await profileResponse.json();
      if (!profileResponse.ok || profile.data?.role !== "admin") {
        window.location.href = profile.data?.role === "hr" ? "/hr" : profile.data?.role === "employee" ? "/employee" : "/login";
      }
    }).catch(() => { window.location.href = "/login"; });
    fetch("/api/organization")
      .then((response) => response.json().then((result) => ({ response, result })))
      .then(({ response, result }) => {
        if (!response.ok) {
          setMessage(result.error?.message || "Connect Supabase to load organization settings.");
          return;
        }
        setData(result.data);
        setMessage("");
      })
      .catch(() => setMessage("Connect Supabase to load organization settings."));
  }, []);

  function changeSection(section) {
    setActive(section);
    setForm({ name: "", code: "", annualQuotaDays: "", isPaid: true, holidayDate: "" });
  }

  async function submit(event) {
    event.preventDefault();
    const payload = { type: active.type, name: form.name };
    if (active.type === "department") payload.code = form.code;
    if (active.type === "leaveType") {
      payload.annualQuotaDays = form.annualQuotaDays === "" ? null : Number(form.annualQuotaDays);
      payload.isPaid = form.isPaid;
    }
    if (active.type === "holiday") payload.holidayDate = form.holidayDate;
    const response = await fetch("/api/organization", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error?.message || "The record could not be saved.");
      return;
    }
    setMessage(`${active.label.slice(0, -1)} added.`);
    setForm({ name: "", code: "", annualQuotaDays: "", isPaid: true, holidayDate: "" });
    fetch("/api/organization")
      .then((response) => response.json())
      .then((result) => {
        if (result.data) setData(result.data);
      });
  }

  const records = data[active.key] || [];

  return (
    <main className="content-wrap organization-page">
      <div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>Organization</strong></div>
      <section className="hero organization-hero"><div><p className="eyebrow">Organization setup</p><h1>Build your company structure</h1><p className="hero-copy">Configure the lists and policies HR will use when registering employees. Nothing is pre-seeded.</p></div></section>
      <div className="organization-layout">
        <div className="org-tabs">{sections.map((section) => <button key={section.key} className={active.key === section.key ? "org-tab active" : "org-tab"} onClick={() => changeSection(section)}><span>{section.label}</span><small>{section.description}</small></button>)}</div>
        <section className="panel org-content"><div className="panel-heading"><div><p className="eyebrow">{active.label}</p><h2>{records.length} configured</h2></div></div><form className="org-form" onSubmit={submit}><label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={active.type === "holiday" ? "Eid holiday" : `New ${active.label.toLowerCase().replace(/s$/, "")}`} required /></label>{active.type === "department" && <label>Code<input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="ENG" required /></label>}{active.type === "leaveType" && <><label>Annual quota days<input type="number" min="0" value={form.annualQuotaDays} onChange={(event) => setForm({ ...form, annualQuotaDays: event.target.value })} placeholder="14" /></label><label className="checkbox-label"><input type="checkbox" checked={form.isPaid} onChange={(event) => setForm({ ...form, isPaid: event.target.checked })} /> Paid leave</label></>}{active.type === "holiday" && <label>Date<input type="date" value={form.holidayDate} onChange={(event) => setForm({ ...form, holidayDate: event.target.value })} required /></label>}<button className="button button-primary">Add {active.label.slice(0, -1)}</button></form>{message && <p className="form-message">{message}</p>}<div className="record-list">{records.map((record) => <div className="record-row" key={record.id}><span className="record-dot" /><div><b>{record.name}</b><small>{record.code || record.holiday_date || (record.is_paid ? `${record.annual_quota_days ?? "Unlimited"} paid days` : "Unpaid leave")}</small></div></div>)}{!records.length && !message && <div className="empty-activity"><div className="empty-icon">＋</div><b>No {active.label.toLowerCase()} yet</b><p>Use the form above to add the first record.</p></div>}</div></section>
      </div>
    </main>
  );
}
