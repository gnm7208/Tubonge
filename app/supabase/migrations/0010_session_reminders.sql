-- Phase 6: 1-hour-before session reminders, sent by a scheduled call from pg_cron (via pg_net)
-- to the `send-reminders` Edge Function every 15 minutes.

alter table bookings add column if not exists reminder_sent_at timestamptz;

create extension if not exists pg_net;

select cron.schedule(
  'send-session-reminders',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://rtsappypilzgmghcynft.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '107496b3636a5aaae378be57e648687b90d9ca23077e17e8'),
    body := '{}'::jsonb
  );
  $$
);
