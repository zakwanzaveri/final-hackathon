create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'hr', 'employee');
create type public.employment_status as enum ('active', 'probation', 'suspended', 'exited');
create type public.leave_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.attendance_status as enum ('present', 'late', 'half_day', 'absent', 'missing_checkout', 'on_leave');
create type public.payroll_status as enum ('draft', 'finalized');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Karachi',
  currency text not null default 'PKR',
  office_start time not null default '09:00',
  grace_minutes integer not null default 15 check (grace_minutes >= 0),
  weekend_days smallint[] not null default '{0,6}',
  office_latitude numeric(9,6),
  office_longitude numeric(9,6),
  geofence_radius_m integer check (geofence_radius_m > 0),
  setup_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  role public.app_role not null,
  full_name text not null,
  active boolean not null default true,
  must_change_password boolean not null default false,
  employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name text not null,
  code text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);

create table public.designations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  department_id uuid references public.departments(id),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name text not null,
  annual_quota_days numeric(6,2),
  is_paid boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  holiday_date date not null,
  name text not null,
  active boolean not null default true,
  unique (company_id, holiday_date)
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  profile_id uuid references public.profiles(id),
  employee_code text not null,
  full_name text not null,
  email text not null,
  phone text,
  address text,
  gender text,
  department_id uuid references public.departments(id),
  designation_id uuid references public.designations(id),
  join_date date not null,
  exit_date date,
  employment_status public.employment_status not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, employee_code),
  unique (company_id, email)
);

alter table public.profiles
  add constraint profiles_employee_fk foreign key (employee_id) references public.employees(id);

create table public.salary_structures (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  employee_id uuid not null references public.employees(id),
  basic_salary numeric(12,2) not null check (basic_salary > 0),
  effective_from date not null,
  effective_to date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  employee_id uuid not null references public.employees(id),
  leave_type_id uuid not null references public.leave_types(id),
  start_date date not null,
  end_date date not null,
  working_days numeric(6,2) not null check (working_days > 0),
  reason text not null,
  status public.leave_status not null default 'pending',
  reviewer_id uuid references auth.users(id),
  reviewer_comment text,
  decided_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  employee_id uuid not null references public.employees(id),
  work_date date not null,
  check_in_at timestamptz not null,
  check_out_at timestamptz,
  status public.attendance_status not null default 'present',
  minutes_worked integer check (minutes_worked >= 0),
  source text not null default 'web',
  policy_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (company_id, employee_id, work_date)
);

create table public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  period_month date not null,
  status public.payroll_status not null default 'draft',
  created_by uuid not null references auth.users(id),
  finalized_by uuid references auth.users(id),
  finalized_at timestamptz,
  calculation_version text not null default 'v1',
  created_at timestamptz not null default now(),
  unique (company_id, period_month)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

create table public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  user_id uuid not null references auth.users(id),
  tool_names text[] not null default '{}',
  status text not null,
  latency_ms integer,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index employees_company_department_idx on public.employees(company_id, department_id);
create index attendance_company_date_idx on public.attendance(company_id, work_date);
create index leave_requests_company_status_idx on public.leave_requests(company_id, status);
create index audit_logs_company_created_idx on public.audit_logs(company_id, created_at desc);

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.designations enable row level security;
alter table public.leave_types enable row level security;
alter table public.holidays enable row level security;
alter table public.employees enable row level security;
alter table public.salary_structures enable row level security;
alter table public.leave_requests enable row level security;
alter table public.attendance enable row level security;
alter table public.payroll_runs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.ai_logs enable row level security;

create or replace function public.current_company_id()
returns uuid language sql stable security definer set search_path = public
as $$ select company_id from public.profiles where id = auth.uid() and active = true limit 1 $$;

create or replace function public.current_role()
returns public.app_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() and active = true limit 1 $$;

create policy "company members read company" on public.companies for select using (id = public.current_company_id());
create policy "users read scoped profiles" on public.profiles for select using (
  id = auth.uid()
  or (company_id = public.current_company_id() and public.current_role() in ('admin', 'hr'))
);
create policy "users update own password state" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "company members read departments" on public.departments for select using (company_id = public.current_company_id());
create policy "admins manage departments" on public.departments for all using (company_id = public.current_company_id() and public.current_role() = 'admin') with check (company_id = public.current_company_id());
create policy "company members read designations" on public.designations for select using (company_id = public.current_company_id());
create policy "admins manage designations" on public.designations for all using (company_id = public.current_company_id() and public.current_role() = 'admin') with check (company_id = public.current_company_id());
create policy "company members read leave types" on public.leave_types for select using (company_id = public.current_company_id());
create policy "admins manage leave types" on public.leave_types for all using (company_id = public.current_company_id() and public.current_role() = 'admin') with check (company_id = public.current_company_id());
create policy "company members read holidays" on public.holidays for select using (company_id = public.current_company_id());
create policy "admins manage holidays" on public.holidays for all using (company_id = public.current_company_id() and public.current_role() = 'admin') with check (company_id = public.current_company_id());
create policy "company members read employees" on public.employees for select using (company_id = public.current_company_id());
create policy "admins and hr manage employees" on public.employees for insert with check (company_id = public.current_company_id() and public.current_role() in ('admin', 'hr'));
create policy "admins and hr update employees" on public.employees for update using (company_id = public.current_company_id() and public.current_role() in ('admin', 'hr')) with check (company_id = public.current_company_id());
create policy "employees read own salary" on public.salary_structures for select using (
  company_id = public.current_company_id()
  and (
    employee_id in (select employee_id from public.profiles where id = auth.uid())
    or public.current_role() in ('admin', 'hr')
  )
);
create policy "admins and hr manage salary" on public.salary_structures for insert with check (company_id = public.current_company_id() and public.current_role() in ('admin', 'hr'));
create policy "company members read attendance" on public.attendance for select using (company_id = public.current_company_id());
create policy "company members read leave requests" on public.leave_requests for select using (company_id = public.current_company_id());
create policy "employees create own leave requests" on public.leave_requests for insert with check (
  company_id = public.current_company_id()
  and employee_id in (select employee_id from public.profiles where id = auth.uid())
);
create policy "hr manage leave requests" on public.leave_requests for update using (
  company_id = public.current_company_id() and public.current_role() in ('admin', 'hr')
) with check (company_id = public.current_company_id());
create policy "company members read payroll runs" on public.payroll_runs for select using (company_id = public.current_company_id());
create policy "admins read audit logs" on public.audit_logs for select using (company_id = public.current_company_id() and public.current_role() = 'admin');
create policy "users read own ai logs" on public.ai_logs for select using (user_id = auth.uid());
