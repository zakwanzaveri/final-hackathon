drop policy if exists "company members read leave requests" on public.leave_requests;
drop policy if exists "employees create own leave requests" on public.leave_requests;

create policy "users read own leave requests" on public.leave_requests
  for select using (
    employee_id in (
      select employee_id
      from public.profiles
      where id = auth.uid()
        and active = true
        and employee_id is not null
    )
  );

create policy "admins and hr read company leave requests" on public.leave_requests
  for select using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin', 'hr')
  );

create policy "employees create own leave requests" on public.leave_requests
  for insert with check (
    company_id = public.current_company_id()
    and employee_id in (
      select employee_id
      from public.profiles
      where id = auth.uid()
        and active = true
        and employee_id is not null
    )
  );
