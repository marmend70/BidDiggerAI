-- Abilita le estensioni necessarie
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedula il job per eseguire la pulizia ogni notte alle 03:00 (UTC)
select
  cron.schedule(
    'delete-old-data-30days', -- Nome univoco del job
    '0 3 * * *',              -- Cron expression: Alle 03:00 ogni giorno
    $$
    select
      net.http_post(
          -- URL della tua funzione (PROJECT_REF recuperato dal deploy precedente)
          url:='https://eoyhdumkeyptohumiizj.supabase.co/functions/v1/cleanup-old-tenders',
          
          -- Headers: Qui devi inserire la tua SERVICE_ROLE_KEY
          -- ATTENZIONE: Sostituisci <INSERISCI_QUI_LA_TUA_SERVICE_ROLE_KEY> con la chiave reale
          -- La trovi in: Project Settings -> API -> service_role (secret)
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer <INSERISCI_QUI_LA_TUA_SERVICE_ROLE_KEY>"}'::jsonb
      ) as request_id;
    $$
  );

-- Per verificare se il job è stato creato:
-- select * from cron.job;
