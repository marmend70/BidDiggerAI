-- CORREZIONE CONFLITTO RUOLI:
-- Usiamo una colonna dedicata 'app_role' invece di 'role' (che è usata per il lavoro dell'utente).

-- 1. Aggiungi la NUOVA colonna 'app_role'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS app_role text DEFAULT 'user';

-- 2. Impostati come ADMIN (Admin System Role)
-- IMPORTANTE: Inserisci la tua email qui sotto al posto di 'TU@EMAIL.COM' se vuoi usare l'email, 
-- oppure (metodo consigliato) vai nella tabella su Supabase e scrivi 'admin' nella colonna 'app_role' alla tua riga.
-- UPDATE profiles SET app_role = 'admin' WHERE user_id = '...(il tuo id)...';

-- 3. Aggiorna le Policy di sicurezza per usare 'app_role' invece di 'role'

-- Policy di aggiornamento (Solo Admin può cambiare settings)
DROP POLICY IF EXISTS "Admin Update" ON app_settings;
CREATE POLICY "Admin Update" ON app_settings FOR UPDATE USING (
  (SELECT app_role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Policy di inserimento (Solo Admin può aggiungere settings)
DROP POLICY IF EXISTS "Admin Insert" ON app_settings;
CREATE POLICY "Admin Insert" ON app_settings FOR INSERT WITH CHECK (
  (SELECT app_role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Policy di lettura (Stessa di prima, tutti leggono)
-- Non serve cambiare nulla qui se era "USING (true)"

