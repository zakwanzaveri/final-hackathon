"use client";

import { useState } from "react";

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(event) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ messages: next }) });
      const result = await response.json();
      setMessages([...next, { role: "assistant", content: result.message || "I couldn't answer that." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "AI assistant is temporarily unavailable. Please use the manual forms." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="fixed bottom-6 right-6 z-20 grid h-12 w-12 place-items-center rounded-full bg-indigo-600 font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700" onClick={() => setOpen((value) => !value)} aria-label="Open HCM Lite AI assistant">AI</button>
      {open && <section className="fixed bottom-20 right-6 z-20 flex h-[500px] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" aria-label="HCM Lite AI assistant">
        <header className="flex shrink-0 items-center justify-between bg-indigo-900 px-4 py-4 text-white"><div><b className="block">HCM Lite AI</b><small className="mt-1 block text-indigo-200">Policy-aware assistant</small></div><button className="text-2xl leading-none" onClick={() => setOpen(false)} aria-label="Close assistant">×</button></header>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4">
          {!messages.length && <p className="m-auto max-w-60 text-center text-xs leading-relaxed text-slate-500">Ask about attendance, leave policy, headcount, or your own leave balance.</p>}
          {messages.map((message, index) => <div className={`max-w-[86%] rounded-xl border px-3 py-2 text-xs leading-relaxed ${message.role === "user" ? "ml-auto border-indigo-600 bg-indigo-600 text-white" : "mr-auto border-slate-200 bg-white text-slate-700"}`} key={`${message.role}-${index}`}>{message.content}</div>)}
          {loading && <div className="mr-auto max-w-[86%] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">Thinking…</div>}
        </div>
        <form onSubmit={send} className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white p-3"><input className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask HCM Lite…" disabled={loading} /><button className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={loading || !input.trim()}>Send</button></form>
      </section>}
    </>
  );
}
