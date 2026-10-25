"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "../../lib/supabase/browser";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");
    const supabase = getBrowserSupabase();
    const { data: authData, error: authError } = await supabase.auth.updateUser({ password });

    if (authError) {
      setMessage(authError.message);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", authData.user.id);

    if (profileError) {
      setMessage("Password changed, but the account status could not be updated. Contact an Admin.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();
    router.push(profile?.role === "admin" ? "/admin" : profile?.role === "hr" ? "/hr" : "/employee");
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-compact">
        <div className="brand auth-brand"><div className="brand-mark">H</div><div><strong>HCM Lite</strong><span>People, made clear.</span></div></div>
        <p className="eyebrow">Account security</p>
        <h1>Choose a new password</h1>
        <p className="auth-copy">Your temporary password must be replaced before using the workspace.</p>
        <form onSubmit={submit} className="auth-form">
          <label>New password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" required /></label>
          <label>Confirm password<input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength="8" required /></label>
          {message && <p className="form-message error">{message}</p>}
          <button className="button button-primary auth-submit" disabled={loading}>{loading ? "Updating…" : "Update password"}</button>
        </form>
      </section>
    </main>
  );
}
