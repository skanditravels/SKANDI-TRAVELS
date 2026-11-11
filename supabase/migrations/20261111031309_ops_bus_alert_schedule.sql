-- Requires the preceding transport registry and staffing migrations.
-- One-minute sampling can raise a warning up to one minute after a threshold;
-- the OPS screen must expose a stale-worker warning if this job stops.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('skandi-ops-transport-alerts','* * * * *',
  'select public.ops_transport_scan_alerts_v2(now());');
-- Retain only this job's execution history for seven days.
select cron.schedule('skandi-ops-transport-alert-history-cleanup','17 3 * * *',
  $$delete from cron.job_run_details where jobid in (select jobid from cron.job where jobname in ('skandi-ops-transport-alerts','skandi-ops-transport-alert-history-cleanup')) and end_time < now() - interval '7 days'$$);
