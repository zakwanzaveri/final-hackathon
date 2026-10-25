import { NextResponse } from "next/server";
import { getAdminSupabase } from "../../../lib/supabase/admin";
import { getCurrentProfile, getCurrentUser } from "../../../lib/supabase/server";

const toolDefinitions = [
  { type: "function", function: { name: "get_headcount", description: "Get active employee headcount for the current company.", parameters: { type: "object", properties: {}, additionalProperties: false } } },
  { type: "function", function: { name: "get_attendance_summary", description: "Get attendance totals for a date. Employees receive only their own totals.", parameters: { type: "object", properties: { date: { type: "string", description: "ISO date, defaults to today." } }, additionalProperties: false } } },
  { type: "function", function: { name: "get_late_comers", description: "List late employees for a date. Admin and HR only.", parameters: { type: "object", properties: { date: { type: "string", description: "ISO date, defaults to today." } }, additionalProperties: false } } },
  { type: "function", function: { name: "get_leave_summary", description: "Summarize leave requests for the current company. Employees receive only their own summary.", parameters: { type: "object", properties: { status: { type: "string", enum: ["pending", "approved", "rejected", "cancelled"] } }, additionalProperties: false } } },
  { type: "function", function: { name: "get_my_leave_balance", description: "Get the signed-in employee's leave balance.", parameters: { type: "object", properties: {}, additionalProperties: false } } },
  { type: "function", function: { name: "get_payroll_summary", description: "Get payroll run summary. Admin only.", parameters: { type: "object", properties: { month: { type: "string", description: "YYYY-MM, defaults to current month." } }, additionalProperties: false } } },
  { type: "function", function: { name: "search_employees", description: "Search employees by name or employee code. Admin and HR only.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false } } },
];

const systemPrompt = `You are HCM Lite Assistant. Answer only about HCM Lite, HR operations, attendance, leave, payroll summaries, and company policy.
Never reveal passwords, secrets, raw personal data, or another employee's salary. Respect the tool permission errors and politely refuse unauthorized requests.
Employees may access only their own attendance, leave, and balance. Admin and HR may access company people operations. Payroll details are Admin-only.
Do not approve, reject, create, modify, or delete records. You are read-only.
For a natural-language employee leave request, include exactly one machine-readable marker at the end:
<LEAVE_DRAFT>{"type":"leave type or null","start":"YYYY-MM-DD or null","end":"YYYY-MM-DD or null","reason":"short reason"}</LEAVE_DRAFT>
If dates are ambiguous, use null and ask a clarification question.`;

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function employeeId(profile) {
  if (profile.employee_id) return profile.employee_id;
  const user = await getCurrentUser();
  const { data, error } = await getAdminSupabase().from("employees").select("id").eq("company_id", profile.company_id).eq("email", user?.email || "").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("EMPLOYEE_PROFILE_REQUIRED");
  return data.id;
}

async function runTool(name, args, profile) {
  const db = getAdminSupabase();
  const ownOnly = profile.role === "employee";
  const ownId = ownOnly ? await employeeId(profile) : null;
  if (name === "get_headcount") {
    if (ownOnly) throw new Error("You are not authorized to view company headcount.");
    const { count, error } = await db.from("employees").select("id", { count: "exact", head: true }).eq("company_id", profile.company_id).in("employment_status", ["active", "probation"]);
    if (error) throw error;
    return { headcount: count || 0 };
  }
  if (name === "get_attendance_summary") {
    const query = db.from("attendance").select("status").eq("company_id", profile.company_id).eq("work_date", args.date || today());
    const scoped = ownOnly ? query.eq("employee_id", ownId) : query;
    const { data, error } = await scoped;
    if (error) throw error;
    return { date: args.date || today(), total: data.length, by_status: data.reduce((out, row) => ({ ...out, [row.status]: (out[row.status] || 0) + 1 }), {}) };
  }
  if (name === "get_late_comers") {
    if (ownOnly) throw new Error("You are not authorized to view other employees' late attendance.");
    const { data, error } = await db.from("attendance").select("employee_id, employees(full_name, employee_code)").eq("company_id", profile.company_id).eq("work_date", args.date || today()).eq("status", "late");
    if (error) throw error;
    return { date: args.date || today(), late_comers: data };
  }
  if (name === "get_leave_summary") {
    const query = db.from("leave_requests").select("status, working_days").eq("company_id", profile.company_id);
    const scoped = ownOnly ? query.eq("employee_id", ownId) : query;
    const filtered = args.status ? scoped.eq("status", args.status) : scoped;
    const { data, error } = await filtered;
    if (error) throw error;
    return { total: data.length, days: data.reduce((sum, row) => sum + Number(row.working_days || 0), 0), by_status: data.reduce((out, row) => ({ ...out, [row.status]: (out[row.status] || 0) + 1 }), {}) };
  }
  if (name === "get_my_leave_balance") {
    if (!ownOnly) throw new Error("This tool is for employee self-service.");
    const { data: types, error: typeError } = await db.from("leave_types").select("id, name, annual_quota_days").eq("company_id", profile.company_id).eq("active", true);
    if (typeError) throw typeError;
    const { data: used, error } = await db.from("leave_requests").select("leave_type_id, working_days").eq("company_id", profile.company_id).eq("employee_id", ownId).eq("status", "approved");
    if (error) throw error;
    return types.map((type) => ({ type: type.name, quota: type.annual_quota_days, used: used.filter((row) => row.leave_type_id === type.id).reduce((sum, row) => sum + Number(row.working_days || 0), 0), remaining: type.annual_quota_days == null ? null : Number(type.annual_quota_days) - used.filter((row) => row.leave_type_id === type.id).reduce((sum, row) => sum + Number(row.working_days || 0), 0) }));
  }
  if (name === "get_payroll_summary") {
    if (profile.role !== "admin") throw new Error("Payroll summary is available to Admin only.");
    const month = args.month || today().slice(0, 7);
    const { data, error } = await db.from("payroll_runs").select("id, period_month, status, created_at, finalized_at").eq("company_id", profile.company_id).eq("period_month", `${month}-01`).maybeSingle();
    if (error) throw error;
    return data || { month, status: "not_created" };
  }
  if (name === "search_employees") {
    if (ownOnly) throw new Error("You are not authorized to search employees.");
    const q = String(args.query || "").trim();
    if (!q) return [];
    const { data, error } = await db.from("employees").select("employee_code, full_name, employment_status, department_id").eq("company_id", profile.company_id).or(`full_name.ilike.%${q}%,employee_code.ilike.%${q}%`).limit(10);
    if (error) throw error;
    return data;
  }
  throw new Error("Unknown tool.");
}

function parseDraft(text) {
  const match = text.match(/<LEAVE_DRAFT>([\s\S]*?)<\/LEAVE_DRAFT>/i);
  if (!match) return { text, leaveDraft: null };
  try {
    const draft = JSON.parse(match[1]);
    if (!draft || typeof draft !== "object" || !("type" in draft) || !("start" in draft) || !("end" in draft) || !("reason" in draft)) throw new Error("invalid draft");
    return { text: text.replace(match[0], "").trim(), leaveDraft: draft };
  } catch {
    return { text, leaveDraft: null };
  }
}

function looksLikeLeaveRequest(messages) {
  const latest = messages.at(-1)?.content;
  return typeof latest === "string" && /\b(leave|off|holiday|vacation|wedding|day[s]?\s+off)\b/i.test(latest);
}

async function provider(messages, tools, signal) {
  const key = process.env.AI_API_KEY?.trim();
  if (!key) throw new Error("AI assistant is not configured.");
  const model = process.env.AI_MODEL?.trim() || "gpt-4o-mini";
  const endpoint = process.env.AI_API_URL?.trim() || "https://api.openai.com/v1/chat/completions";
  const response = await fetch(endpoint, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, tools, tool_choice: "auto", temperature: 0.2 }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const providerMessage = payload?.error?.message || payload?.message || `HTTP ${response.status}`;
    throw new Error(`AI provider error: ${providerMessage}`);
  }
  if (!payload?.choices?.[0]?.message) throw new Error("AI provider returned an invalid response.");
  return payload;
}

async function writeAiLog(entry) {
  try {
    const { error } = await getAdminSupabase().from("ai_logs").insert(entry);
    if (error) console.error("AI log write failed:", error.message);
  } catch (error) {
    console.error("AI log write failed:", error.message);
  }
}

export async function POST(request) {
  const started = performance.now();
  let profile;
  let user;
  let body;
  try {
    profile = await getCurrentProfile();
    user = await getCurrentUser();
    if (!profile || !profile.active || !user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    body = await request.json();
    const messages = Array.isArray(body.messages)
      ? body.messages
        .filter((message) => ["user", "assistant"].includes(message?.role) && typeof message?.content === "string")
        .slice(-12)
        .map((message) => ({ role: message.role, content: message.content.slice(0, 4000) }))
      : [];
    if (!messages.length) return NextResponse.json({ error: "At least one message is required." }, { status: 400 });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let result;
    try {
      const conversation = [{ role: "system", content: systemPrompt }, ...messages];
      for (let round = 0; round < 4; round += 1) {
        result = await provider(conversation, toolDefinitions, controller.signal);
        const message = result.choices?.[0]?.message;
        if (!message?.tool_calls?.length) break;
        conversation.push(message);
        for (const call of message.tool_calls) {
          let output;
          try { output = await runTool(call.function.name, JSON.parse(call.function.arguments || "{}"), profile); }
          catch (error) { output = { error: error.message || "Tool access denied." }; }
          conversation.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(output) });
        }
      }
    } finally {
      clearTimeout(timeout);
    }
    let rawText = result?.choices?.[0]?.message?.content || "I couldn't complete that request. Please use the manual workspace controls.";
    let parsed = parseDraft(rawText);
    if (looksLikeLeaveRequest(messages) && !parsed.leaveDraft) {
      const retryController = new AbortController();
      const retryTimeout = setTimeout(() => retryController.abort(), 15000);
      try {
        const retry = await provider([
          { role: "system", content: `${systemPrompt}\nThis is a retry. Return the required LEAVE_DRAFT marker with valid JSON even if some fields must be null.` },
          ...messages,
        ], [], retryController.signal);
        rawText = retry.choices?.[0]?.message?.content || rawText;
        parsed = parseDraft(rawText);
      } finally {
        clearTimeout(retryTimeout);
      }
    }
    const responsePayload = { message: parsed.text, leaveDraft: parsed.leaveDraft, tools: result?.choices?.[0]?.message?.tool_calls?.map((call) => call.function.name) || [] };
    await writeAiLog({ company_id: profile.company_id, user_id: user.id, tool_names: responsePayload.tools, status: "success", latency_ms: Math.round(performance.now() - started), safe_metadata: { role: profile.role }, request_json: { message_count: messages.length }, response_json: responsePayload });
    return NextResponse.json(responsePayload);
  } catch (error) {
    if (profile && user) await writeAiLog({ company_id: profile.company_id, user_id: user.id, tool_names: [], status: "fallback", latency_ms: Math.round(performance.now() - started), safe_metadata: { role: profile.role, error: error.message }, request_json: { message_count: Array.isArray(body?.messages) ? body.messages.length : 0 }, response_json: { fallback: true } });
    const message = error?.name === "AbortError" ? "The AI request timed out. Please try again." : error?.message || "The AI assistant is temporarily unavailable.";
    return NextResponse.json({ message, leaveDraft: null, error: message }, { status: 200 });
  }
}
