-- Scheduled notification sweep: timed reminders + read-notification retention.
-- Runs hourly; event_key uniqueness makes repeated sweeps idempotent.
select cron.unschedule(jobid) from cron.job where jobname = 'notification-sweep';
select cron.schedule(
  'notification-sweep',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://sbaahapi-production.up.railway.app/v1/internal/notifications/sweep',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'X-Internal-Cron-Secret',(select decrypted_secret from vault.decrypted_secrets where name='internal_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
