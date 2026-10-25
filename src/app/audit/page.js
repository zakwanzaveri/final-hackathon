"use client";

import { useEffect, useState } from "react";

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("Loading audit log…");
  useEffect(() => {
    fetch("/api/me", { cache: "no-store" }).then(async (profileResponse) => {
      const profile = await profileResponse.json();
      if (!profileResponse.ok || profile.data?.role !== "admin") {
        window.location.href = profile.data?.role === "hr" ? "/hr" : profile.data?.role === "employee" ? "/employee" : "/login";
        return;
      }
      const response = await fetch("/api/audit", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Audit log unavailable.");
      setLogs(result.data || []);
      setMessage("");
    }).catch((error) => setMessage(error.message));
  }, []);
  return <main className="content-wrap organization-page"><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>Audit log</strong></div><section className="hero organization-hero"><div><p className="eyebrow">Security history</p><h1>Audit log</h1><p className="hero-copy">Append-only record of important workspace actions. Admin access only.</p></div></section>{message && <p className="form-message">{message}</p>}<section className="panel employee-list-panel"><div className="panel-heading"><div><p className="eyebrow">Recent events</p><h2>{logs.length} events</h2></div></div><div className="record-list">{logs.map((log) => <div className="record-row" key={log.id}><span className="record-dot" /><div><b>{log.action}</b><small>{log.entity_type} · {new Date(log.created_at).toLocaleString()}</small></div></div>)}</div></section></main>;
}
