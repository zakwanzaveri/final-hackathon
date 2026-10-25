"use client";

import { useEffect, useState } from "react";

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [month, setMonth] = useState(null);
  const [message, setMessage] = useState("Loading attendance…");

  async function load() {
    const response = await fetch("/api/attendance");
    const result = await response.json();
    if (!response.ok) return setMessage(result.error?.message || "Attendance is unavailable.");
    setRecords(result.data || []);
    setMessage("");
  }

  async function toggle() {
    const response = await fetch("/api/attendance", { method: "POST" });
    const result = await response.json();
    setMessage(response.ok ? result.action === "checked_in" ? "Checked in successfully." : "Checked out successfully." : result.error?.message || "Attendance action failed.");
    if (response.ok) load();
  }

  useEffect(() => { load(); setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); }, []);
  if (!month) return <main className="content-wrap organization-page"><p className="form-message">Loading calendar…</p></main>;
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const recordByDate = Object.fromEntries(records.map((record) => [record.work_date, record]));
  const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 && day <= daysInMonth ? `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null;
  });
  return <main className="content-wrap organization-page"><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>Attendance</strong></div><section className="hero organization-hero"><div><p className="eyebrow">Daily attendance</p><h1>Check in and out</h1><p className="hero-copy">Server timestamps keep attendance reliable and prevent duplicate daily records.</p></div><button className="button button-primary" onClick={toggle}>Check in / out</button></section>{message && <p className="form-message">{message}</p>}<section className="panel calendar-panel"><div className="panel-heading"><div><p className="eyebrow">Attendance calendar</p><h2>{month.toLocaleDateString("en", { month: "long", year: "numeric" })}</h2></div><div className="calendar-controls"><button className="calendar-button" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))} aria-label="Previous month">‹</button><button className="calendar-button" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))} aria-label="Next month">›</button></div></div><div className="calendar-weekdays">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <b key={day}>{day}</b>)}</div><div className="calendar-grid">{cells.map((date, index) => { const record = date ? recordByDate[date] : null; return <div className={`calendar-day ${!date ? "calendar-day-empty" : ""}`} key={`${date || "empty"}-${index}`}>{date && <><span>{Number(date.slice(-2))}</span>{record && <i className={`calendar-status ${record.status}`} title={record.status} />}</>}</div>; })}</div></section><section className="panel employee-list-panel"><div className="panel-heading"><div><p className="eyebrow">Recent records</p><h2>{records.length} records</h2></div></div><div className="record-list">{records.map((record) => <div className="record-row" key={record.id}><span className="record-dot" /><div><b>{record.employee?.full_name || "My attendance"}</b><small>{record.work_date} · {record.check_in_at ? new Date(record.check_in_at).toLocaleTimeString() : "—"} → {record.check_out_at ? new Date(record.check_out_at).toLocaleTimeString() : "Open"}</small></div><span className="status-pill">{record.status}</span></div>)}</div></section></main>;
}
