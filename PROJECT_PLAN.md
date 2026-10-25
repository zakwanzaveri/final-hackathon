# HCM Lite Project Plan

This plan is the implementation baseline after auditing `HCM_Lite_Specification.md` against `Saylani_Hackathon_HCM_Lite_Brief.pdf` (six pages, 24 October 2026). It separates challenge requirements from recommended implementation choices. Current status is `Not started`: the repository currently contains only the Create Next App shell and no HCM implementation.

## 1. Source and decisions

| Decision | Classification | Status |
| --- | --- | --- |
| Browser web app, 375 px minimum, three roles, empty first run | Brief requirement, PDF p1 | Required |
| JWT-compatible signed sessions and secure password hashing (brief says JWT/bcrypt) | Brief outcome | Required; Supabase Auth is acceptable only after verifying these outcomes |
| Temporary employee credential with first-login password change | Brief requirement, PDF p2 | Required; invite/reset may be used only as a documented equivalent |
| Company timezone, currency, tax cadence, proration rounding, exact cancellation behavior, HR employee identity | Open decisions | Must be recorded in README and tests before implementation |
| Next.js App Router, TypeScript, Supabase/Postgres, server actions/route handlers, RLS, Zod, hosted tool-calling LLM, Vercel | Recommended technical choices | Not challenge requirements |
| No fake or seeded employees, activity, KPIs, payroll, or AI answers | Brief requirement, PDF p1/p4/p6 | Required |
| Camera/geolocation, Roman Urdu, anomaly/attrition, late penalty, dark mode/PWA | Optional bonus, +10 points, PDF p3/p5 | Defer until core is stable |

## 2. Current repository status

| Area | Current status | Needed |
| --- | --- | --- |
| Application | Not started; default `src/app` shell only | Build routes, screens, services, validation, and tests |
| Database/auth | Not started; no migrations or provider setup | Add migrations, auth integration, RLS, and empty-install setup |
| Documentation | Specification audited and corrected; README is still starter text | Update README only after implementation decisions are fixed |
| Secrets | No secrets added | Add blank `.env.example`; keep real values out of Git |
| Deployment/demo | Not started | Deploy fresh setup and rehearse five-minute flow |

## 3. Permission matrix

`Manage` means create/change, `All` means every permitted record, `Own` means the caller's records, and `-` means no access.

| # | Capability | Admin | HR | Employee | Source |
| ---: | --- | --- | --- | --- | --- |
| 1 | First-run company setup and first Admin | Manage | - | - | p2 |
| 2 | Login, logout, password change, role menus/dashboard | Own | Own | Own | p2 |
| 3 | Company rules, office location, weekends, grace | Manage | View | - | p2 |
| 4 | Departments, designations, leave types/quotas, holidays | Manage | View | - | p2 |
| 5 | Create/deactivate/reset HR and employee logins | Manage | - | - | p2 |
| 6 | Register/edit employee job details | View all | Manage | Own phone/address | p2 |
| 7 | Employee directory and Employee 360 | All | All | Own | p2 |
| 8 | CSV import/export | - | Manage | - | p2 |
| 9 | Web check-in/out | - per checklist | Own | Own | p2 |
| 10 | Attendance calendar/board | All | All | Own | p2 |
| 11 | Attendance correction | View | Approve/reject | Request | p2 |
| 12 | Leave apply/cancel/history/balance | - | Own | Own | p2 |
| 13 | Leave approval/rejection with comment | View | Approve/reject | - | p2 |
| 14 | Salary structures | View | Manage | - | p2 |
| 15 | Monthly payroll draft/review | View | Manage | - | p2 |
| 16 | Finalize/lock payroll | Manage | - | - | p2 |
| 17 | Payslips/PDF download | All | All | Own | p2 |
| 18 | Dashboards/KPIs/trends/insights | Company | HR | Personal | p2, p5 |
| 19 | AI chat | All data | HR data | Own data/policy | p2-p3 |
| 20 | AI dashboard summary | Yes | Yes | - | p3 |
| 21 | Smart leave | - | Own if enabled | Own | p3 |
| 22 | Policy Q&A | Yes | Yes | Yes | p3 |
| 23 | Announcements | Post | Post | Read | p2, p5 |
| 24 | Notifications | Own | Own | Own | p2 |
| 25 | Audit log | View | - | - | p2, p5 |

Every server read and mutation must repeat role and row-scope checks; UI hiding is not authorization.

## 4. Functional requirement register

| # | Requirement and source | Status | Files/modules needed | Acceptance test |
| ---: | --- | --- | --- | --- |
| 01 | First-run company profile and Admin account (p2) | Not started; mandatory | `src/app/setup`, `src/lib/services/setup`, auth, `supabase/migrations` | Empty database shows setup; setup creates one company/Admin; second setup is rejected; no seeded data. |
| 02 | Login/logout/change password, role menus/dashboards (p2) | Not started; mandatory | `src/app/(auth)`, auth service, middleware, permissions | Each role signs in, changes temporary password, sees only its menu, and cannot access another role route. |
| 03 | Company settings: office hours, grace, weekend, location/radius (p2) | Not started; mandatory | `/admin/settings`, organization service/schema | Admin changes settings; HR can view; Employee cannot; new records use settings and old records remain reproducible. |
| 04 | Departments, designations, leave types/quotas, holidays (p2) | Not started; mandatory | `/organization`, organization service/migrations | Admin manages all; HR views; referenced records cannot be destructive-deleted. |
| 05 | Create/deactivate/reset HR and employee logins (p2) | Not started; mandatory | `/admin/users`, auth admin service | Admin creates/deactivates/resets; deactivated login cannot sign in; history remains. |
| 06 | HR registers employee and creates login; edit details (p2) | Not started; mandatory | `/employees`, employee service, profile/auth service | HR creates required job/salary record and temporary/invite login; first login requires password change; duplicate code/email fails. |
| 07 | Directory/search/filters and Employee 360 (p2) | Not started; mandatory | `/employees`, employee detail, server query services | Admin/HR search and page authorized records; Employee opens only self; private fields never leak by changing ID. |
| 08 | CSV dry-run import and export (p2) | Not started; optional in source wording but tracked as feature 08 | employee CSV service/UI | Dry run writes nothing and returns row/field/reason for invalid email, unknown department, duplicate code, bad ISO date, or salary <= 0; export is scoped. |
| 09 | Web check-in/out (p2-p3) | Not started; mandatory | `/my/attendance`, attendance service/routes | Server timestamps; one row per employee/work date; duplicate check-in is 409; checkout requires open record. |
| 10 | Attendance calendar and daily board (p2) | Not started; mandatory | `/attendance`, attendance queries/components | Admin/HR see authorized company records; Employee sees own; date/department/status filters work. |
| 11 | Attendance correction request/approval (p2-p3) | Not started; mandatory | correction service/UI, audit | Employee submits reason and requested values; HR approves/rejects with comment; original and decision history remain. |
| 12 | Leave apply/cancel/balance/history (p2-p3) | Not started; mandatory | `/leave`, leave service/validators | Employee sees balance/history, submits valid request, and cancellation follows the selected documented policy. |
| 13 | Leave approve/reject with comment (p2-p3) | Not started; mandatory | HR leave inbox, leave service, notifications | HR decides; rejection requires comment; self-approval is prevented; approved leave affects balance/status. |
| 14 | Salary structure per employee (p2-p3) | Not started; mandatory | salary service, employee/payroll screens | HR manages effective-dated basic/allowances; Admin views; Employee cannot edit or view unauthorized salaries. |
| 15 | Monthly payroll draft/review (p2-p3) | Not started; mandatory | `/payroll`, payroll service/formulas | HR creates one month draft; each line shows inputs, gross, workdays, deductions, tax, net; HR reviews before finalization. |
| 16 | Admin finalizes and locks payroll (p2-p3) | Not started; mandatory | finalize transaction, audit | HR receives 403; Admin confirmation finalizes atomically; later normal edits are rejected and audit event exists. |
| 17 | Protected payslip PDF download (p2-p3) | Not started; mandatory | `/payslips`, PDF service/storage | Finalized item generates readable PDF with required breakdown; Admin/HR company access and Employee own-only access are enforced. |
| 18 | Role dashboards, KPIs, trends, insight lists, filters (p2,p5) | Not started; mandatory | dashboard routes, analytics service/charts | Server metrics match persisted records for date/department filters; empty and zero-denominator states are safe; required role widgets render. |
| 19 | AI chat answering from real data with tools (p3) | Not started; mandatory | `/assistant`, `/api/ai/chat`, tool registry, AI service/logging | Each role receives only allowed tool output; dashboard/API and AI values match; model cannot execute SQL or write data. |
| 20 | AI dashboard summary from current KPI JSON (p3) | Not started; mandatory | summary route/component | Admin/HR receive 3-5 observations using only current filtered KPI JSON; Employee has no access; output is labeled AI-generated. |
| 21 | Smart leave sentence to validated prefilled form (p3) | Not started; mandatory | smart-leave route/schema/form | Sentence produces validated `{type,start,end,reason}`; user reviews and submits normal endpoint; invalid JSON retries once then falls back. |
| 22 | Policy Q&A from configured rules (p3) | Not started; mandatory | policy constants/service, AI prompt | All roles get answers only from configured rules or an explicit unknown; no invented policy or tax advice. |
| 23 | Announcements (p2,p5) | Not started; mandatory | `/announcements`, service/components | Admin/HR post; authorized users read; audience/active dates do not expose restricted posts. |
| 24 | In-app notifications for decisions/payslips (p2,p5) | Not started; mandatory | notification service, `/notifications` | Leave decision and payslip availability create notifications; each user reads/marks only own notifications. |
| 25 | Append-only audit log (p2,p5) | Not started; mandatory | audit service/table, `/admin/audit` | Important create/update/approve/reject/finalize/deactivate events record actor, action, entity, before/after, timestamp, and request context; Admin views; nobody edits/deletes. |

## 5. Business rules and formulas

All rules belong in tested server/domain services, not UI code. Settings used for historical calculations must be snapshotted.

| Rule/formula | Source | Acceptance test |
| --- | --- | --- |
| Office start 09:00, grace 15 minutes, weekend Saturday/Sunday, half day under 5 hours | p2-p3 | 09:16 is late; 09:15 is not late under the selected boundary; under 5 hours with checkout is half-day. |
| One attendance row per employee/local work date; server timestamp; duplicate check-in 409 | p3 | Concurrent duplicate check-in leaves one row and returns conflict. |
| Missing checkout is `missing_checkout`, not guessed hours | p3 | Open attendance is shown as missing checkout. |
| No record on expected workday and no approved leave is absent; approved leave takes precedence | p3 | Same date is on-leave, not absent, when approved leave exists. |
| Leave counts working days only; excludes configured weekends/public holidays | p3 | Date range containing weekend/holiday counts only eligible days. |
| Annual quotas: annual 14, sick 8, casual 10; unpaid unlimited | p3 | Over-quota paid request is 422; unpaid has no quota cap. |
| Leave overlap and invalid balance are 422; rejection requires comment | p3 | Overlap and over-balance save no approved-valid request; rejection without comment fails. |
| HRA = 40% basic; medical = 10% basic; gross = 1.5 x basic | p3 | Basic 100,000 yields HRA 40,000, medical 10,000, gross 150,000. |
| Daily rate = gross / payroll-month working days; deductions = daily rate x (absent + unpaid + 0.5 x half-days) | p3 | Payroll fixture reconciles each deduction component. |
| Joiner/leaver proration; illustrative annual tax slabs on gross x 12; finalized runs locked | p3 | Boundary fixtures, proration, and locked edit tests pass; assumptions are documented. |
| Metrics: headcount/attrition, attendance rate, late %, absenteeism, leave utilization, payroll cost, average salary | p5 | Dashboard fixtures match formulas and safely handle zero denominators. |

Selected assumptions must be finalized before coding: timezone/currency, tax withholding cadence/order, rounding, exact 09:15 boundary, approved-leave cancellation, and HR's linked employee identity.

## 6. Dashboard, AI, and privacy acceptance

Admin must show headcount, YTD attrition, payroll cost, average salary, department headcount/payroll cost, gender/tenure breakdown, audit feed, and AI summary. HR must show headcount, present, on-leave, late today, pending approvals, attendance trend, absenteeism by department, leave by type, top five late-comers, and AI summary. Employee must show check-in/out, hours this week versus 40, late count, leave balance, latest payslip, announcements, and personal assistant.

The seven required read tools are `get_headcount`, `get_attendance_summary`, `get_late_comers`, `get_leave_summary`, `get_my_leave_balance`, `get_payroll_summary`, and `search_employees`. Tools reuse domain services and re-check scope. The AI key is server-only; no database credentials or direct SQL reach the model; no AI approval/write/finalization is allowed; calls have validation, one smart-leave retry, 15-second timeout, approximately 20/user/hour rate limit, safe logs, and an AI-generated label. Salary and colleague private data must be refused to Employees.

## 7. Optional bonus backlog

The source awards up to +10 points. Only start after the core demo passes.

| Bonus | Source | Acceptance test |
| --- | --- | --- |
| Camera + geolocation attendance | p3,p5 | Exactly one face; GPS accuracy <=100 m; server Haversine/radius check; reject no/multiple face, out-of-radius, inaccurate GPS; store result/source, consent, and HR fallback. |
| Attrition risk or absence anomaly flags | p5 | Clearly labeled assistive indicators derived from persisted records; no fabricated scores. |
| Late penalty: three lates = half-day | p5 | Rule is configurable/documented, tested, and visibly separated from mandatory payroll formula. |
| Roman Urdu AI | p5 | Policy/data safety and role scope remain identical in Roman Urdu responses. |
| Dark mode/PWA | p5 | Responsive app remains usable and installable/themeable without weakening core flows. |

## 8. Delivery, judging, and five-minute demo

The 100-point rubric is: core HR flows 25, data/analytics 20, AI 15, code quality 15, UI/UX 10, security/RBAC 10, demo/docs 5; optional bonus is +10. The demo starts from fresh setup: Admin configures company/rules and HR login; HR registers 2-3 employees; an Employee changes password/checks in; Employee uses smart leave; HR approves, views dashboard, summarizes, asks who is on leave, and runs payroll; Admin finalizes; Employee downloads payslip and asks for a colleague salary; Admin shows audit log.

Submission acceptance: public or judge-shared repository, live hosted browser project starting at first-run setup, README with stack/run/setup/AI key/status/assumptions/demo, committed migrations, blank `.env.example`, no real secrets, and both repository and live links submitted on `https://lms.saylaniit.com/`. Optional mobile APK/Expo link goes in README only if built.

## 9. Implementation sequence

1. Add migrations, environment placeholders, auth/session/scope helpers, and empty setup.
2. Implement organization, users, employee registration, first-login credential change, directory, and CSV.
3. Implement attendance and correction workflow with unit tests.
4. Implement leave, workday/balance rules, approvals, notifications, and tests.
5. Implement salary history, payroll formulas, draft/review/finalization, protected PDF, and tests.
6. Implement analytics and all role dashboards with empty/error/loading states.
7. Implement AI tools, summary, smart leave, policy Q&A, guardrails, logs, and refusal/timeout tests.
8. Implement announcements, audit UI, README, deployment, and five-minute rehearsal.
9. Consider optional bonus work only after the required flow is stable.

## 10. Required file/module targets

`src/app/setup`, auth routes, role dashboards, `src/app/employees`, `attendance`, `leave`, `payroll`, `payslips`, `announcements`, `notifications`, `assistant`, and API/server actions; `src/lib/auth`, `permissions`, `validation`, `services/{setup,organization,employees,attendance,leave,payroll,analytics,ai-tools,notifications}`, `src/lib/audit`; `src/components/{app-shell,forms,tables,charts,assistant}`; `src/types`; `supabase/migrations`; and focused tests for payroll, workdays, leave overlap, attendance states, authorization, metrics, and AI guardrails.
