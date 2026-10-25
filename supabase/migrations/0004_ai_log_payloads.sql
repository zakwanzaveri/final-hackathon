alter table public.ai_logs
  add column if not exists request_json jsonb,
  add column if not exists response_json jsonb;
