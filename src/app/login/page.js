"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "../../lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const demoAccounts = [
    { label: "Login as Admin", email: "admin@hcmlite.com", password: "admin123" },
    { label: "Login as HR", email: "hr@hcmlite.com", password: "hr1234" },
    { label: "Login as Employee", email: "employee@hcmlite.com", password: "employee123" },
  ];

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = getBrowserSupabase();
      const authResult = await Promise.race([
        supabase.auth.signInWithPassword(form),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Sign in timed out. Check your connection and try again.")), 15000)),
      ]);
      const { data: authData, error } = authResult;
      if (error) throw error;
      if (!authData.user) throw new Error("Sign in succeeded but no user session was returned.");
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, must_change_password")
        .eq("id", authData.user.id)
        .single();
      if (profileError) throw profileError;
      if (!["admin", "hr", "employee"].includes(profile.role)) throw new Error("Your account has no valid application role.");
      if (profile.must_change_password) {
        router.push("/change-password");
      } else {
        router.push(profile.role === "admin" ? "/admin/dashboard" : profile.role === "hr" ? "/hr/dashboard" : "/employee/dashboard");
      }
    } catch (error) {
      setMessage(error?.message || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-compact">
        <div className="brand auth-brand"><div className="brand-mark">H</div><div><strong>HCM Lite</strong><span>People, made clear.</span></div></div>
        <p className="eyebrow">Secure sign in</p>
        <h1>Welcome back</h1>
        <p className="auth-copy">Sign in to continue to your role-based workspace.</p>
        <form onSubmit={submit} className="auth-form">
          <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@company.com" required /></label>
          <label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>
          {message && <p className="form-message error">{message}</p>}
          <button className="button button-primary auth-submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <div className="demo-login-list">
          <p className="eyebrow">Hackathon demo access</p>
          {demoAccounts.map((account) => (
            <button className="button button-secondary demo-login-button" type="button" key={account.email} onClick={() => setForm({ email: account.email, password: account.password })}>
              {account.label}
            </button>
          ))}
        </div>
        <p className="auth-switch">New workspace? <a href="/signup">Create an account</a></p>
      </section>
    </main>
  );
}
