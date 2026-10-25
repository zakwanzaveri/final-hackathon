"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "../../lib/supabase/browser";

export default function LeavePage() {
  const [types, setTypes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [form, setForm] = useState({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
  const [message, setMessage] = useState("Loading leave…");

  async function load() {
    try {
      setMessage("Loading leave history…");
      const leaveResponse = await fetch("/api/leave", { cache: "no-store", credentials: "include" });
      const leave = await leaveResponse.json();
      if (leaveResponse.ok && Array.isArray(leave.data)) {
        setTypes(leave.leaveTypes || []);
        setRequests(leave.data);
        setLoaded(true);
        setMessage("");
        return;
      }
      if (leaveResponse.status === 403) console.warn("Leave history forbidden: verify the signed-in role and company profile.");
      setLoaded(false);
      setMessage(`${leave.error?.code || "LEAVE_ERROR"}: ${leave.error?.message || "Leave is unavailable."}`);
    } catch (error) {
      console.error("Leave history request failed:", error);
      setLoaded(false);
      setMessage("Leave history is unavailable. Please sign in again.");
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (!authReady) {
      setMessage("Your session is still loading. Please try again in a moment.");
      return;
    }
    if (!form.leaveTypeId || !form.startDate || !form.endDate || !form.reason.trim()) {
      setMessage("Select a leave type, dates and enter a reason.");
      return;
    }
    if (form.endDate < form.startDate) {
      setMessage("End date cannot be before start date.");
      return;
    }
    try {
      const response = await fetch("/api/leave", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 403) {
          console.warn("Leave submission forbidden: only an active employee can submit leave.");
          setMessage("Leave submission is forbidden for this account. Sign in with an Employee account.");
        } else {
          setMessage(result.error?.message || "Leave request failed.");
        }
        return;
      }
      setForm({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
      await load();
      setMessage("Leave request submitted and history refreshed.");
    } catch (error) {
      console.error("Leave submission failed:", error);
      setMessage("Leave request failed. Please try again.");
    }
  }
  useEffect(() => {
    const supabase = getBrowserSupabase();
    let active = true;
    let loadedForSession = false;

    async function initialiseSession() {
      setMessage("Loading authentication…");
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error || !data.session) {
        setAuthReady(false);
        setLoaded(false);
        setMessage("Your session is missing or expired. Please sign in again.");
        return;
      }
      setAuthReady(true);
      if (!loadedForSession) {
        loadedForSession = true;
        await load();
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session) {
        setAuthReady(true);
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          loadedForSession = true;
          load();
        }
      } else if (event === "SIGNED_OUT") {
        setAuthReady(false);
        setLoaded(false);
        setMessage("Your session is missing or expired. Please sign in again.");
      }
    });

    initialiseSession();
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  return <main className="content-wrap organization-page"><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>Leave</strong></div><section className="hero organization-hero"><div><p className="eyebrow">Leave management</p><h1>Request time off</h1><p className="hero-copy">Submit a request for review. Approval remains a human decision.</p></div></section><section className="panel employee-form-panel"><form className="employee-form" onSubmit={submit}><label>Leave type<select value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })} required><option value="">Select type</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label><label>Start date<input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></label><label>End date<input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></label><label className="wide-field">Reason<input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required placeholder="Reason for leave" /></label><div className="employee-form-actions"><button className="button button-primary" disabled={!types.length}>Submit request</button></div></form></section>{message && <p className={`form-message ${loaded ? "success" : "error"}`}>{message}</p>}<section className="panel employee-list-panel"><div className="panel-heading"><div><p className="eyebrow">History</p><h2>{loaded ? `${requests.length} requests` : "History unavailable"}</h2></div></div>{loaded && <div className="record-list">{requests.length ? requests.map((request) => <div className="record-row" key={request.id}><span className="record-dot" /><div><b>{request.start_date} → {request.end_date}</b><small>{request.reason}</small></div><span className="status-pill">{request.status}</span></div>) : <div className="empty-activity"><b>No leave requests yet</b><p>Submitted requests will appear here.</p></div>}</div>}</section></main>;
}
