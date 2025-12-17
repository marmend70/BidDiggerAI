-- Esegui questo comando nel SQL Editor di Supabase.
-- Serve a forzare l'aggiornamento della Cache delle API (PostgREST).
-- E' l'equivalente via codice del tasto "Reload Schema Cache".

NOTIFY pgrst, 'reload schema';
