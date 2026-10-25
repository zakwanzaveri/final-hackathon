# HCM Lite — Solo Developer Specification

> Main project specification for the Saylani HCM Lite hackathon. Use this file as the primary requirements source.

HCM LITE
Solo Developer Product & Technical Specification

AI-assisted Human Capital Management for Admin, HR and Employees

Prepared from the Saylani Hackathon HCM Lite Challenge Brief
24 October 2026 | Version 1.0


## How to use this document

This is the implementation blueprint for building the hackathon web app alone. Use the fixed requirements as acceptance criteria. Items marked RECOMMENDED are implementation choices added to make the brief buildable and secure; they are not extra requirements stated verbatim by the challenge.

Source of truth: Saylani_Hackathon_HCM_Lite_Brief.pdf, especially its role matrix, business rules, AI guardrails, metrics, 25-functionality checklist, judging rubric and 5-minute demo.

| Label | Meaning |
| --- | --- |
| BRIEF REQUIREMENT | Explicitly required or specified in the challenge PDF. |
| RECOMMENDED DESIGN | A practical implementation decision for this solo Next.js + Supabase build. |
| OPEN QUESTION | A product ambiguity. The document gives a safe default so work can continue unless you choose otherwise. |


## 1. Product definition

Product name: HCM Lite. Build a responsive web-based Human Capital Management app for one company, with three roles: Admin, HR and Employee. The app starts empty. Admin completes first-run setup, HR registers real employee records, employees use attendance/leave features, and dashboards plus AI answers are calculated from the records created in the app.

### Primary objective

Deliver end-to-end core HR flows, correct role/data boundaries, useful analytics, and an AI assistant that uses backend tools rather than inventing or directly querying data.

### Non-goals for the hackathon

- Do not build a separate mobile app before the required web app is complete.
- Do not seed fake employees, attendance, leave, payroll, dashboard figures, or AI answers.
- Do not build a full enterprise HR suite (recruiting, performance reviews, benefits, complex accounting).
- Do not let the AI make approvals, save leave requests, edit salary, or finalize payroll.
- Do not treat the illustrative tax formula as current legal or tax advice.
## 2. Fixed requirements from the challenge

| Area | Must deliver |
| --- | --- |
| Platform | Browser-based web app; responsive from about 375 px wide. |
| Roles | Admin, HR, Employee; each has its own dashboard, menu, permissions and data scope. |
| Data | Fresh install starts empty; records originate from user actions. |
| Core workflows | Employee registration, web check-in/out, leave request and approval, monthly payroll draft/finalization, payslip PDF. |
| Analytics | Server-calculated metrics from app records; date and department filters. |
| AI | Tool-based chat, dashboard summary, smart leave form, policy Q&A; same authorization as the user. |
| Audit/security | Server-side access checks, password hashing/auth provider, audit log, AI logs, secrets kept server-side. |
| Delivery | Repository, README, live hosted link, 5-minute demo. Submit both repo and live link on Saylani LMS. |
| Optional bonus (+10 points) | Camera + geolocation attendance, Roman Urdu AI, absence anomaly/attrition, late penalty, dark mode/PWA. Only attempt after core flows. |


## 3. Recommended solo-developer technology stack

| Layer | Choice | Why |
| --- | --- | --- |
| Full-stack web | Next.js App Router + TypeScript | One repository for UI and server-side handlers; less setup than separate frontend/backend. |
| UI styling | Tailwind CSS + a small reusable component set | Fast consistent layout; avoid spending hackathon time on custom CSS systems. |
| Database | Supabase PostgreSQL | Relational data fits employees, leave, attendance, payroll and reporting. |
| Authentication | Supabase Auth, if it satisfies the brief's signed-session/JWT and secure password-hashing outcomes | Avoid writing password storage and session infrastructure from scratch; verify the challenge outcomes explicitly. |
| Authorization | Server-side role/scope checks + PostgreSQL RLS | Defense in depth; hiding UI controls is not security. |
| Charts | Recharts or simple CSS charts | Use only charts that make required metrics understandable. |
| Validation | Zod schemas | Validate API payloads, imports and AI-produced JSON. |
| Forms | React Hook Form + Zod (optional) | Reduces repetitive form state and validation code. |
| AI | Hosted LLM provider with tool/function calling | Provider can vary; keep provider key in server environment only. |
| Hosting | Vercel for Next.js + Supabase hosted project | Straightforward deploy path; verify current free-tier limits before submission. |
| PDF | A server-side PDF library or browser print-to-PDF fallback | Payslip must be downloadable/printable; pick one simple approach. |


Architecture: Browser UI → Next.js Server Actions/Route Handlers → domain services and validation → Supabase database/Auth. The AI route calls the same domain services with the signed-in user's scope. Do not add Express/standalone Node API unless a real need appears; Next.js already runs server-side on Node-compatible hosting.

## 4. User roles and authorization matrix

| Capability | Admin | HR | Employee |
| --- | --- | --- | --- |
| First-run company setup / create first Admin | Manage | No | No |
| Login/logout/change password | Own account | Own account | Own account |
| Company rules, office location, weekends, grace time | Manage | View | No |
| Departments, designations, leave types, holidays | Manage | View | No |
| Create/deactivate/reset HR and employee accounts | Manage | No | No |
| Register/edit employee job details | View all | Manage | Own phone/address only |
| Directory and Employee 360 | All employees | All employees | Own profile only |
| CSV import/export | No per brief | Manage | No |
| Check-in/out | No per checklist | Own attendance actions | Own attendance actions |
| Attendance calendar/board | All | All | Own |
| Attendance correction | View | Approve/reject | Request with reason |
| Leave apply/cancel/history/balance | View | Own HR data / manage people operations | Own |
| Approve/reject leave with comment | View | Approve/reject | No |
| Salary structures | View | Manage | No |
| Create/review monthly payroll draft | View | Manage | No |
| Finalize/lock payroll | Yes | No | No |
| Payslips | All | All | Own only |
| Dashboards | Company | HR operations | Personal |
| AI chat | Company scope | HR scope | Own data + policy |
| AI dashboard summary | Yes | Yes | No |
| Smart leave | No | Own if desired | Own |
| Policy Q&A | Yes | Yes | Yes |
| Announcements | Post/read | Post/read | Read |
| Notifications | Own notifications | Own notifications | Own notifications |
| Audit log | View, never edit/delete | No | No |


Important: The challenge's checklist says HR and Employee may use their own check-in/out actions. Keep the check-in button available to a signed-in employee; HR's ability to record their own attendance can be supported if HR is also represented by an employee profile. Decide how HR's own employee profile is created during setup.

## 5. First-run setup and account lifecycle

1. If no company/admin exists, show a setup screen—not a seeded dashboard.
1. Admin enters company name, admin name/email/password, timezone, office hours, grace period, weekend, office coordinates/radius, and default leave policies.
1. Create the company and initial Admin identity safely. Use a server-only setup action that is disabled after first successful setup.
1. Admin creates departments/designations, leave types/quotas, holidays and HR login(s).
1. HR registers an employee with required profile, job, department, designation, joining date and basic salary.
1. Create the employee's Auth account with a temporary credential or secure invite/reset equivalent. Require password change at first login. If invite/reset replaces the brief's temporary-password flow, document and test it as an implementation equivalent.
1. Deactivation blocks new sign-ins but preserves historical attendance, leave and payroll records.
RECOMMENDED: Use Supabase Auth for password/session management rather than manually storing password hashes in your own table, but verify that the resulting sessions and password handling satisfy the brief's JWT and bcrypt requirements. The application must still enforce roles and row scope on every server request.

## 6. Functional specifications: all 9 modules / 25 features

### M1 — Auth & Access

01 First-run setup — Create company and first Admin only when the database has no initialized company. After setup, prevent public re-entry.

02 Login/logout/password and role dashboards — Authenticated session; redirect by role; password change/reset; show only allowed navigation. API authorization must still run server-side.

### M2 — Organization Setup

03 Company settings — Admin edits office start, grace, weekend, location/radius and related rules. HR may view; Employee cannot change. Settings changes apply to new records only.

04 Organization lists — Admin manages departments, designations, leave types/quotas and public holidays. Prevent deleting records referenced by existing employees or historical records; prefer archive/deactivate.

### M3 — Employees

05 Account administration — Admin creates HR users and deactivates/resets HR or employee accounts; never expose privileged service credentials to the browser.

06 Employee registration/edit — HR enters identity/contact, employee code, job, department, designation, joining date, status and salary. Create linked login/invite.

07 Directory + Employee 360 — Search/filter/page on the server; profile combines job, attendance, leave and payroll history only for authorized roles.

08 CSV import/export — HR can dry-run CSV first. Return row number, field and reason for every error. Validate required fields, unique employee code/email, email format, known department, ISO date and salary > 0. Export only permitted columns.

### M4 — Attendance

09 Web check-in/out — Server supplies timestamps. One attendance record per employee per work date. Reject duplicate check-in with HTTP 409. Checkout must match an open attendance record.

10 Attendance board/calendar — Admin/HR see company records; employee sees own. Filters by date, department and status.

11 Attendance corrections — Employee submits requested time/status plus reason; HR approves/rejects with comment; preserve original values and audit the decision.

### M5 — Leave

12 Apply/cancel/balance/history — Employee requests type, date range and reason; sees balances and status. Cancellation allowed only before approval or according to a clearly defined rule.

13 Approve/reject — HR approval inbox; decision must include comment on rejection. Prevent self-approval where applicable.

### M6 — Payroll Lite

14 Salary structure — HR sets basic and allowances for each employee; keep history/effective dates so prior payroll remains reproducible.

15 Monthly payroll draft — HR selects month and runs calculation. Show gross, work days, attendance deductions, tax and net pay per employee; allow review before finalization.

16 Finalize/lock — Admin finalizes HR draft. Finalized run and items are immutable through normal app routes; corrections require an explicit adjustment/reversal strategy, not editing locked values.

17 Payslips — Generate PDF for each employee; Admin/HR can access company records; employee only their own. Download link must be protected.

### M7 — Dashboards & Analytics

18 KPIs/trends/insights — Server-calculated company/HR/personal metrics with date and department filters; handle empty datasets and zero denominators safely.

### M8 — AI Assistant

19 Chat with live data — AI calls allowlisted backend tools. Tool output is permission-scoped and comes from the same services as dashboard/API.

20 AI dashboard summary — Admin/HR send current-filter KPI JSON; AI returns 3–5 concise observations only from those numbers.

21 Smart leave — Turn a sentence into validated {type, start, end, reason}; show prefilled form; user must review and submit.

22 Policy Q&A — Use challenge policy constants/settings. If policy/data is unavailable, say so rather than inventing.

### M9 — Comms & Audit

23 Announcements — Admin/HR post; all authorized users read; optionally support active dates and audience scope.

24 Notifications — Create in-app notifications for leave decisions, payroll/payslip availability and other key events.

25 Audit log — Log actor, action, entity/table, entity id, timestamp, before/after JSON and request context for important create/update/approve/finalize events. Admin can view but no role can edit/delete logs.

## 7. Exact business rules and calculation notes

### 7.1 Organization defaults

| Setting | Brief default | Implementation notes |
| --- | --- | --- |
| Office start | 09:00 | Store timezone with company settings; compare local office time. |
| Grace period | 15 minutes | Late if check-in is after 09:15; define whether exactly 09:15 is late (recommended: not late until > 09:15). |
| Half day | Under 5 hours worked | Compute from server check-in/out. If checkout is missing, use missing_checkout rather than guessing hours. |
| Weekend | Saturday and Sunday | Use configured weekend when calculating expected workdays. |
| Office geofence | Example radius 150 m | Only needed for optional camera/location feature; validate on server. |
| Settings effect | New records only | Snapshot relevant policy values on attendance/payroll records if needed to preserve historical results. |


### 7.2 Attendance state logic

- Use one unique attendance row per employee + local work date. Enforce with a database unique constraint, not only a UI check.
- Check-in timestamp is created by server; never trust a browser-provided timestamp.
- A second check-in for the same employee/date returns HTTP 409.
- Late: check-in later than configured start + grace.
- Half day: total worked time below 5 hours, where checkout exists.
- Missing checkout: check-in exists but checkout does not exist.
- Absent: no attendance record on an expected working day and no approved leave covering that day.
- Approved leave takes precedence over absence for that date.
- Attendance correction must not overwrite history silently; record requested values, decision, approver and timestamps.
### 7.3 Leave rules

| Leave type | Default annual quota |
| --- | --- |
| Annual | 14 days |
| Sick | 8 days |
| Casual | 10 days |
| Unpaid | Unlimited / no quota cap |


- Count working days only; exclude configured weekends and public holidays.
- Reject overlapping requests for the same employee; return HTTP 422 with a human-readable reason.
- Reject requests exceeding available balance; return HTTP 422. Unpaid leave has no quota cap but still must pass overlap/date validation.
- Suggested statuses: pending, approved, rejected, cancelled. Only approved requests affect balance and attendance classification.
- Define a consistent cancellation rule. Recommended: employee may cancel pending requests; approved leave cancellation requires HR action.
### 7.4 Payroll formula (challenge's illustrative rules)

The tax brackets below are copied from the challenge brief and are illustrative challenge rules, not a statement of current Pakistani tax law. Keep the formulas in one tested payroll service.

| Item | Formula / rule |
| --- | --- |
| Basic salary | Monthly basic salary stored for the employee and effective for the payroll month. |
| HRA | 40% of basic. |
| Medical allowance | 10% of basic. |
| Gross monthly salary | 1.5 × basic (basic + HRA + medical = 150% of basic). |
| Annualized gross for tax slab | Gross monthly × 12, adjusted for the applicable joiner/leaver proration policy if required. |
| Daily rate | Gross monthly ÷ working days in the payroll month. |
| Attendance deductions | Daily rate × (absent days + unpaid leave days + 0.5 × half-day count). |
| Proration | Prorate for employees joining/leaving during the month based on eligible working days. |
| Tax brackets | Annual taxable basis 0–600,000: 0%; up to 1,200,000: 5%; up to 2,400,000: 30,000 + 15% over 1,200,000; up to 3,600,000: 210,000 + 25% over 2,400,000; above 3,600,000: 510,000 + 35% over 3,600,000. |
| Net pay | Gross − attendance/unpaid deductions − monthly tax withholding − any explicitly configured deductions. |


OPEN QUESTION: The brief does not fully define tax withholding cadence, whether tax is applied to gross before/after attendance deductions, or exact proration rounding. Recommended hackathon default: compute annual tax from annualized gross, divide annual tax by 12 for monthly withholding, calculate attendance deductions separately, and document this assumption in README and payslip. Keep currency/rounding at two decimals.

### 7.5 Payroll locking and reproducibility

- One payroll run per company + month; prevent duplicate draft runs or require explicit regeneration.
- Store calculation inputs and output line items at draft time so later profile/settings edits do not silently change historical payroll.
- Only Admin can finalize. Finalization should be a single server-side transaction that changes run status and writes audit event.
- Finalized run status is immutable. Do not allow HR to edit salary inputs within a finalized period.
- A payslip must show month, employee, basic, allowances, gross, deduction breakdown, tax, net and finalized status.
## 8. Analytics definitions

Every dashboard number must be computed on the server from persisted data. The same service or query logic must be used by dashboards and AI tools. Never display example numbers as if they were live data.

| Metric | Brief formula / interpretation | Guardrail |
| --- | --- | --- |
| Headcount | Active + probation employees as of selected end date. | Define whether suspended/on-leave employees remain active; recommended yes if employment status remains active. |
| Attrition % | Exits during period ÷ average headcount × 100. | If average headcount is zero, return null / ‘Not enough data’, not Infinity. |
| Attendance rate | (present + late + missing_checkout + 0.5 × half_day) ÷ (working-day records − on_leave). | Clarify denominator from actual expected employee-workdays, excluding approved leave. |
| Late % | late ÷ (present + late). | Zero denominator => 0 or unavailable; document which. |
| Absenteeism | absent days ÷ expected working days. | Use only eligible workdays for active employees. |
| Leave utilization | Approved leave days ÷ quota, by leave type/department. | Unpaid leave has no quota percentage; show days used instead. |
| Payroll cost | Sum gross and net by month/department. | Label gross cost and net payout separately. |
| Average salary | Mean gross by department/designation. | Only Admin/HR; never expose to Employee AI tools. |


### Dashboard content

| Role | Required widgets |
| --- | --- |
| Admin | Headcount, attrition YTD, payroll cost, average salary, headcount by department, payroll cost by department, gender/tenure breakdown, audit feed, AI summary. If the selected profile model cannot support gender or tenure, record that as an explicit implementation gap rather than silently omitting the widgets. |
| HR | Headcount, present, on leave, late today, pending approvals, attendance trend, absenteeism by department, leave by type, top 5 late-comers, AI summary. |
| Employee | Check-in/out widget, hours this week vs 40 hours, late count, leave balance, latest payslip, announcements, personal AI assistant. |


## 9. AI assistant design

### 9.1 Required tools

| Tool | Allowed purpose / scope |
| --- | --- |
| get_headcount | Counts active/probation employees; Admin company scope, HR permitted company/department scope; Employee must not get company-level HR data. |
| get_attendance_summary | Aggregated attendance metrics within caller's scope. |
| get_late_comers | Late employee list/count within Admin/HR scope; Employee only their own late history. |
| get_leave_summary | Leave totals/status/type within caller scope; employee own data only. |
| get_my_leave_balance | Current user's own leave balance only. |
| get_payroll_summary | Admin/HR aggregate payroll data; Employee must not get other people's salary or company salary statistics. |
| search_employees | Admin/HR directory search; employee identity data must be limited to what is allowed by policy. Never return colleague salary to an Employee. |


### 9.2 Guardrails

- AI provider API key exists only in a server environment variable such as AI_API_KEY. Never use NEXT_PUBLIC_ for secret keys.
- The model never receives database credentials and never executes SQL. It may request only named allowlisted tools.
- Each tool calls the same domain service used by the UI/API and re-checks the current user role and scope.
- Never let AI directly write/approve leave, edit salary, create payroll, or finalize payroll. Smart leave only fills a form; the user confirms.
- Validate tool arguments and model JSON with Zod. On invalid smart-leave JSON, retry once, then fall back to the ordinary form.
- Use a 15-second timeout, friendly failure message, and a target rate limit of about 20 requests per user per hour.
- Log user, tool names, timestamps, latency, status and safe metadata in ai_logs. Avoid storing unnecessary sensitive prompts or salary details in logs.
- Show an ‘AI-generated’ label. For unavailable data or policy, say it is unknown instead of inventing an answer.
- Employee asks ‘What is my colleague's salary?’ → refuse briefly and explain salary is private.
### 9.3 Smart leave flow

1. Employee types a natural-language request.
1. Server supplies current date, timezone and permitted leave types/policy to the model.
1. Model returns only a structured object: { type, start, end, reason }.
1. Validate date format, valid leave type, start <= end, future/past policy, and length; calculate balance/working days on the server.
1. Show a prefilled editable form with dates/type/reason; user confirms by submitting the normal leave request endpoint.
1. Normal leave validation still runs. AI output is never trusted as authorization or as proof of balance.

### 9.4 Optional camera and geolocation bonus (+10 points)

This is optional and must not delay the required web application. If implemented, the attendance check must open the front camera, require exactly one detected face, obtain GPS coordinates and accuracy, and send the evidence to the server. The server supplies the timestamp, calculates distance with the Haversine formula, and accepts only when the location is within the Admin-configured radius and GPS accuracy is 100 metres or better. The server rejects no-face, multiple-face, out-of-radius, and inaccurate-location attempts.

Store the attendance result and source rather than a full photo by default. Request consent, explain what is collected, and provide HR correction fallback for failed checks. Optional face matching and liveness checks are extra bonus enhancements, not mandatory requirements.

## 10. Database model (recommended Supabase/Postgres schema)

Use UUID primary keys, created_at/updated_at timestamps, foreign keys, check constraints and indexes. Most tenant-owned tables should include company_id even if the hackathon starts with one company; it prevents accidental cross-company access and leaves room for future extension.

| Table | Important fields / relationships |
| --- | --- |
| companies | id, name, timezone, office_start, grace_minutes, weekend_days, office_lat/lng, geofence_radius_m, setup_completed_at. |
| profiles | id = auth.users.id, company_id, role (admin/hr/employee), full_name, active, must_change_password, linked employee_id where applicable. |
| departments | id, company_id, name, code, active. |
| designations | id, company_id, department_id nullable, name, active. |
| employees | id, company_id, profile_id, employee_code, legal/display name, email, phone, address, department_id, designation_id, employment_status, join_date, exit_date, gender optional, created_by. |
| salary_structures | id, company_id, employee_id, basic_salary, effective_from, effective_to, created_by; retain history. |
| leave_types | id, company_id, name, annual_quota_days, is_paid, active. |
| leave_balances | id, company_id, employee_id, leave_type_id, year, entitled_days, adjustment_days; calculate or snapshot used days consistently. |
| holidays | id, company_id, date, name, active. |
| leave_requests | id, company_id, employee_id, leave_type_id, start_date, end_date, working_days, reason, status, reviewer_id, reviewer_comment, decided_at, cancelled_at. |
| attendance | id, company_id, employee_id, work_date, check_in_at, check_out_at, status, minutes_worked, source, policy_snapshot; unique(employee_id, work_date). |
| attendance_corrections | id, company_id, employee_id, attendance_id, requested values, reason, status, reviewer_id/comment, decision timestamps. |
| payroll_runs | id, company_id, period_month, status (draft/finalized), created_by, finalized_by, finalized_at, calculation_version; unique(company_id, period_month). |
| payroll_items | id, payroll_run_id, employee_id, basic, hra, medical, gross, work_days, absent_days, unpaid_days, half_days, deductions, annual_tax, monthly_tax, net_pay, calculation_inputs JSON. |
| payslips | id, company_id, payroll_run_id, payroll_item_id, storage_path or generated-on-demand metadata. |
| announcements | id, company_id, title, body, audience, starts_at, ends_at, created_by, active. |
| notifications | id, company_id, user_id, type, title, body, read_at, created_at. |
| audit_logs | id, company_id, actor_user_id, action, entity_type, entity_id, before_json, after_json, created_at, request_id. |
| ai_logs | id, company_id, user_id, tool_names, status, latency_ms, created_at, safe_metadata. |


RECOMMENDED constraints/indexes: unique company + employee_code; unique normalized email where applicable; unique company + employee + work_date for attendance; unique company + payroll month; indexes for employee company/dept/status, leave employee/status/date, attendance work_date/dept/status, payroll period/status, notifications user/read_at, audit created_at.

Supabase RLS note: use policies to restrict rows and avoid exposing privileged writes. Do not rely on RLS alone if a server route uses a service-role key; any service-role operation must perform explicit authorization first. Prefer user-scoped Supabase clients where possible. Keep service-role key on server only.

## 11. Application routes and screens

| Route / screen | Purpose / role |
| --- | --- |
| /setup | First-run setup only before initialization. |
| /login | Sign-in and password reset. |
| /change-password | Force temporary-password change before access to other screens. |
| /admin/dashboard | Company KPIs, trends, audit feed, AI summary. |
| /admin/settings | Company policy, office location/radius, weekend/office hours. |
| /admin/users | Create/deactivate/reset HR and employee logins. |
| /admin/audit | Read-only audit log. |
| /employees | Directory/search/filter/page; Admin/HR only. |
| /employees/[id] | Employee 360; employee can only open own profile. |
| /organization | Departments, designations, leave types, holidays. |
| /attendance | Daily board and filters for Admin/HR. |
| /my/attendance | Employee attendance calendar, check-in/out, correction request. |
| /leave | Employee requests/history/balance; HR approval inbox. |
| /payroll | HR draft/review; Admin view/finalize. |
| /payslips | Protected payslip list/download; employee own only. |
| /announcements | Admin/HR post; everyone reads. |
| /notifications | User's own notifications. |
| /assistant | Role-scoped AI chat, policy Q&A, smart leave. |
| /hr/dashboard | HR KPIs, late-comers, approvals, leave and attendance analytics. |
| /my/dashboard | Personal attendance, balance, payslip and announcements. |


## 12. API/Server Action contracts

You can use Next.js Route Handlers or Server Actions. Pick one consistent pattern. For endpoints that change data, validate the body, authenticate, authorize role/scope, call a domain service, persist in a transaction when needed, write audit logs, and return a consistent JSON shape.

| Operation | Method / suggested path | Notes |
| --- | --- | --- |
| Login/session | Supabase Auth client flow | Server validates session for protected requests. |
| Setup company | POST /api/setup | Allowed only if not initialized; one-time guard. |
| Employee list/create | GET/POST /api/employees | Admin read; HR manage; employee own-only data. |
| Employee detail | GET/PATCH /api/employees/:id | Scope-check employee ID; Employee can patch phone/address only. |
| CSV dry-run/import/export | POST /api/employees/import/preview; POST /api/employees/import; GET /api/employees/export | Preview returns row errors; import only validated rows. |
| Check in/out | POST /api/attendance/check-in; POST /api/attendance/check-out | Server timestamps; duplicate check-in 409. |
| Correction | POST /api/attendance/corrections; PATCH /api/attendance/corrections/:id | Employee request; HR decision. |
| Leave request | POST /api/leave-requests | Overlap/balance validation; invalid request 422. |
| Leave decision | PATCH /api/leave-requests/:id/decision | HR only; decision/comment; audit + notification. |
| Payroll draft | POST /api/payroll/runs | HR only; one run per month; calculate on server. |
| Payroll finalize | POST /api/payroll/runs/:id/finalize | Admin only; atomic lock + audit. |
| Payslip | GET /api/payslips/:id/pdf | Protected; employee own only. |
| Analytics | GET /api/analytics?from=&to=&departmentId= | Server aggregations; enforce role scope. |
| AI chat | POST /api/ai/chat | Allowlisted tool calls; timeout/rate limit/logging. |
| AI summary | POST /api/ai/summary | Admin/HR; current-filter KPI payload only. |
| Smart leave | POST /api/ai/smart-leave | Return validated prefill only; no database write. |
| Announcements | GET/POST /api/announcements | Admin/HR post; all read. |
| Notifications | GET/PATCH /api/notifications | Current user's notifications only. |
| Audit | GET /api/audit | Admin read-only. |


### Consistent response shape

Success: { data: ..., error: null }. Failure: { data: null, error: { code: 'VALIDATION_ERROR', message: '...', details?: ... } }. Use meaningful HTTP statuses: 400 malformed request, 401 unauthenticated, 403 forbidden, 404 not found, 409 duplicate/conflict, 422 business-rule validation, 429 rate limit, 500 unexpected error. Never return stack traces or secrets to browser.

## 13. UI/UX acceptance criteria

- Use a consistent app shell: left sidebar on desktop, collapsible navigation on small screens, top bar with company/name, notifications and profile menu.
- Each role sees only its permitted menu items. Still enforce every permission on the server.
- Every list has loading, empty, error and success states; empty screens explain the next action (e.g., ‘No employees yet — register the first employee’).
- Every form shows field-level validation and a clear success/error message; disable duplicate submissions while saving.
- Use tables for employee/attendance/payroll data with search, filters, pagination and responsive overflow.
- Use clear status badges for pending/approved/rejected, present/late/absent, draft/finalized.
- Confirm destructive or irreversible actions. Payroll finalization must show period, employee count and an explicit confirmation.
- Do not put fake KPIs on a fresh install. Show zero/empty states and explain that data will appear after setup.
- Meet 375 px minimum width; test login, dashboard, leave and attendance on mobile-sized browser.
- Accessibility basics: labels for all fields, keyboard navigation, visible focus, adequate contrast, semantic headings.
## 14. Security and privacy checklist

- Never commit .env.local, provider keys, Supabase service-role key or database password. Commit only .env.example with blank placeholders.
- Use Supabase Auth and verify the session on every server-side mutation/read that needs authorization.
- Centralize requireUser(), requireRole(), and employee/company scope checks; do not copy ad-hoc permission logic into every page.
- Enforce row-level policies for tenant-owned tables; test cross-user and cross-company access attempts.
- Employee must never read another employee's attendance, leave, payslip, salary, or private profile fields by changing a URL/ID.
- HR cannot change company policy, create Admin, finalize payroll, or view audit log.
- Only Admin finalizes payroll; finalized records cannot be changed by HR or client-side manipulation.
- Audit important create/update/approve/reject/finalize/deactivate actions. Audit records are append-only in application policy.
- Rate-limit login-sensitive and AI endpoints; validate and normalize user inputs; protect against mass assignment.
- Use server-side timestamps and server-side distance calculation for optional geofence checks.
- If adding camera/location, ask consent, explain what is collected, store the result rather than photos by default, and offer an HR correction path.
- Avoid logging passwords, tokens, AI keys, full salary details or unnecessary sensitive prompt content.
## 15. Testing plan / acceptance tests

| ID | Test | Expected result |
| --- | --- | --- |
| AUTH-01 | Fresh database opened | Setup wizard shown; no seeded employees/KPIs. |
| AUTH-02 | Second setup attempt after initialization | Rejected; cannot create another initial Admin. |
| RBAC-01 | Employee requests another employee profile by changing ID | 403/404; no private data leaks. |
| RBAC-02 | HR tries to finalize payroll | 403. |
| RBAC-03 | HR tries to view audit log | 403. |
| RBAC-04 | Employee asks AI for colleague salary | AI refuses; no salary tool output exposed. |
| EMP-01 | Duplicate employee code/email | Validation error; no duplicate row. |
| CSV-01 | CSV dry run with invalid email, unknown department and negative salary | Row/field/reason report; no writes during preview. |
| ATT-01 | Second check-in same day | 409 conflict. |
| ATT-02 | No attendance on working day and no approved leave | Absent classification. |
| ATT-03 | Approved leave on working day | On-leave classification, not absent. |
| ATT-04 | Check-in at 09:16 with 09:00 start/15-minute grace | Late. |
| LEAVE-01 | Request includes weekend/public holiday | Working-day count excludes those dates. |
| LEAVE-02 | Overlapping request | 422 with clear message. |
| LEAVE-03 | Request exceeds remaining paid leave balance | 422; no request saved as valid. |
| PAY-01 | Basic salary 100,000 | HRA 40,000; medical 10,000; gross 150,000 before deductions. |
| PAY-02 | HR finalizes payroll | 403; run remains draft. |
| PAY-03 | Admin finalizes payroll | Run locked; audit event written. |
| PAY-04 | Edit finalized payroll via API | Rejected. |
| DATA-01 | Dashboard metrics vs stored attendance/leave | Counts and rates match the agreed formulas. |
| AI-01 | AI tool request under each role | Tool scope follows same permission rules as UI. |
| AI-02 | AI provider timeout | Friendly fallback; app remains usable; error logged. |
| AI-03 | Invalid smart leave JSON | Retry once, then ordinary form fallback. |
| UI-01 | Fresh empty-state screens | No fake data; clear next steps. |
| DEPLOY-01 | Live hosted project opened in private/incognito window | First-run setup works and judges can create their own company. |


Add unit tests for payroll, workday counting, leave overlap, attendance status and metric denominators. These are high-risk rules and should not live only in UI code.

## 16. Solo build order and time protection

| Priority | Build order | Definition of done |
| --- | --- | --- |
| P0 | Create Next.js + Supabase project, env setup, deploy a blank page | App starts locally and has a working hosted URL. |
| P1 | Schema + first-run setup + Supabase Auth + role profiles | Can create company/Admin from empty database; no fake data. |
| P2 | Departments, employees, employee login/invite, directory/profile | HR can register an employee and that employee can log in. |
| P3 | Attendance check-in/out + calendar/board + corrections | Server timestamps, unique per day, status rules pass tests. |
| P4 | Leave balances + request + overlap/holiday checks + HR decision | Employee submits; HR approves/rejects; balance and notifications update. |
| P5 | Payroll draft + calculation + Admin finalization + PDF payslip | End-to-end payroll works and finalized run is locked. |
| P6 | Role dashboards + filters + empty/error states | All metrics are server-derived and match stored records. |
| P7 | AI tools + smart leave + policy Q&A + dashboard summary | Answers use live authorized services; unauthorized questions are refused. |
| P8 | Announcements + notifications + audit + README + demo rehearsal | Submission checklist complete. |
| P9 bonus | Camera/location, Roman Urdu, anomaly score, dark mode/PWA | Only after P0–P8 are stable. |


Solo-developer rule: do not begin the optional camera/mobile app until the required web app can complete the full demo. Build one thin vertical slice at a time (database → service → screen → test), not all UI first.

## 17. 5-minute judge demo script

| Time | Action | Proof to show |
| --- | --- | --- |
| 0:00–0:35 | Open clean first-run setup; create company/Admin; configure office hours, location, department and leave types. | Fresh empty install; setup is real, not seeded. |
| 0:35–1:15 | Admin creates HR login; HR registers 2–3 employees. | Role-specific menus and employee creation. |
| 1:15–1:45 | Employee signs in, changes temporary password, checks in. | Own attendance record and server timestamp. |
| 1:45–2:25 | Employee asks for leave in plain language, reviews prefilled form and submits; HR approves. | Smart leave, normal validation, approval and notification. |
| 2:25–3:20 | HR opens dashboard, summarizes KPIs, asks ‘Who is on leave today?’, creates monthly payroll draft. | Dashboard and AI values match actual records. |
| 3:20–4:10 | Admin finalizes payroll; employee downloads payslip. | Admin-only lock and protected PDF. |
| 4:10–4:40 | Employee asks for colleague's salary. | AI refuses without leaking salary. |
| 4:40–5:00 | Admin opens audit log; briefly show README/repo/live URL. | Traceability and submission readiness. |


Prepare two browsers or private windows for different roles. Test the demo flow end-to-end before presenting; never depend on a live AI response without a fallback.

## 18. Submission and deployment checklist

- Public repository or repository explicitly shared with judges.
- Live hosted project opens in a browser and begins at first-run setup.
- README contains stack, prerequisites, local run steps, Supabase setup/migrations, first Admin creation, AI key setup, feature status (done/not done), known assumptions and demo steps.
- .env.example committed; real .env.local and secrets ignored by Git.
- Database schema/migrations are committed so a fresh environment can be recreated.
- No dummy/seed data in the judging environment.
- Every student submits both Git repository and hosted project links on https://lms.saylaniit.com/.
- If optional mobile app is built, include APK/Expo link in README; do not delay web requirements for it.
## 19. Environment variables and repository layout

Example .env.example (fill real values only in local ignored .env.local and host settings):

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_API_KEY=
ADMIN_EMAIL=
ADMIN_PASSWORD=

Do not commit actual values. ADMIN_EMAIL/ADMIN_PASSWORD are optional if first Admin is created through the one-time setup wizard. If used, they must be server-only and handled safely.

### Recommended folder layout

src/
  app/
    (auth)/login/page.tsx
    setup/page.tsx
    (app)/admin/dashboard/page.tsx
    (app)/hr/dashboard/page.tsx
    (app)/my/dashboard/page.tsx
    api/
      employees/route.ts
      attendance/check-in/route.ts
      attendance/check-out/route.ts
      leave-requests/route.ts
      payroll/runs/route.ts
      payroll/runs/[id]/finalize/route.ts
      ai/chat/route.ts
      ai/summary/route.ts
  components/
    app-shell/
    forms/
    tables/
    charts/
    assistant/
  lib/
    supabase/
    auth/
    permissions/
    validation/
    services/
      attendance.ts
      leave.ts
      payroll.ts
      analytics.ts
      employees.ts
      ai-tools.ts
    audit.ts
  types/
supabase/
  migrations/
  seed.sql   # keep absent/empty for judge deployment; no fake records
tests/
README.md
.env.example

## 20. Open questions to confirm (recommended defaults included)

These are the questions that can affect implementation. Since hackathon time is short, the default answers below are reasonable unless your challenge organizer gives a different instruction.

| Question | Recommended default | Why it matters |
| --- | --- | --- |
| Q1. Single company or multi-company? | Single company for the UI, company_id on records for safe scoping. | Avoids overbuilding while preventing data leakage. |
| Q2. What timezone/currency? | Company timezone set during setup; show PKR as currency if no instruction says otherwise. | Date boundaries affect attendance, leave and payroll. |
| Q3. Tax formula interpretation? | Use the brief's illustrative brackets exactly; annual tax divided by 12 as monthly withholding; document this assumption. | The PDF does not fully specify withholding mechanics. |
| Q4. Is 09:15 late? | Late only after 09:15, not exactly at 09:15. | The brief says late after 09:15; boundary should be deterministic. |
| Q5. How should HR's own attendance work? | HR has an employee profile if they need to check in/out; otherwise do not add a separate HR attendance identity. | Role and employee record are different concepts. |
| Q6. How are employee accounts provisioned? | Use Supabase invite/reset flow; enforce change-password/first-login step where supported. | Avoid displaying reusable temporary passwords. |
| Q7. Can approved leave be cancelled? | Pending can be cancelled by employee; approved leave cancellation requires HR. | Avoid retroactively changing payroll unexpectedly. |
| Q8. Payroll rounding/proration? | Round displayed and stored money to 2 decimals; prorate by eligible working days in month. | Must be reproducible in tests. |
| Q9. Does tax apply before attendance deductions? | Compute monthly tax from annualized gross, then subtract monthly tax and attendance deductions from gross. | Challenge gives slabs on gross × 12 but not full accounting treatment. |
| Q10. Camera/location bonus? | Skip until all required flows and demo work. | Core categories account for 100 points; bonus is optional. |
| Q11. Roman Urdu support? | Treat as bonus only; ensure English policy answers and smart leave work first. | Avoid adding prompt complexity too early. |
| Q12. Should employee see colleagues in directory? | No broad employee directory unless organizer requires it; employee sees own data and public announcements only. | Privacy-first default. |


## 21. Definition of done

- All 25 listed functionalities are implemented or explicitly listed as not done in README; core flow is complete.
- The app starts from an empty database and no fabricated KPI/data is visible.
- Admin, HR and Employee can sign in and are restricted to their permitted screens/data.
- Employee registration → login → check-in → leave request → HR decision → payroll draft → Admin finalization → employee payslip works end to end.
- Dashboard metrics reconcile with stored records; AI answers reconcile with the same services and cannot leak private data.
- Attendance, leave and payroll business rules have automated tests.
- The hosted link works in a fresh browser session; secrets are not committed.
- 5-minute demo has been rehearsed and README can guide a judge through a fresh setup.
## 22. Important implementation notes

- The challenge brief says ‘25 functionalities across 9 modules’. Use its numbering in this document and in your own checklist to track progress.
- Do not silently change the challenge formulas. If you must choose an interpretation where the brief is incomplete, document the assumption and keep it in one service.
- Treat employee salary, payroll and personal leave as private data. Never expose them through broad AI tools or client-side filtering alone.
- The AI assistant is a read/assist layer. Actual writes must use the same validated forms and service endpoints as non-AI actions.
- Build a working, secure, modest UI instead of an impressive UI with fake data. Judges are explicitly asked to create their own data and compare dashboard/AI results.
- The challenge's example ‘5 employees on leave’ and dashboard values are illustrative visuals, not values to seed into your app.
