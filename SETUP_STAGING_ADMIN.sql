-- SCRIPT COMPLETO PER SETUP ADMIN SU STAGING (o Produzione)
-- Esegui questo script per allineare il database (Staging) con le nuove funzionalità.

-- 1. CREA LA TABELLA IMPOSTAZIONI (se non esiste)
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value boolean NOT NULL
);

-- 2. INIZIALIZZA IL VALORE (Registrazione Aperta di default)
INSERT INTO app_settings (key, value) VALUES ('registrazione_attiva', true) 
ON CONFLICT (key) DO NOTHING;

-- 3. AGGIUNGI LA COLONNA RUOLO DI SISTEMA 'app_role' (se non esiste)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS app_role text DEFAULT 'user';

-- 4. CONFIGURA I PERMESSI DI SICUREZZA (RLS)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Pulisci vecchie policy per evitare conflitti o errori
DROP POLICY IF EXISTS "Enable read access for all users" ON app_settings;
DROP POLICY IF EXISTS "Public Read" ON app_settings;
DROP POLICY IF EXISTS "Admin Update" ON app_settings;
DROP POLICY IF EXISTS "Admin Insert" ON app_settings;
DROP POLICY IF EXISTS "Users can see own profile" ON profiles;

-- Policy 1: TUTTI possono leggere le impostazioni (es. per sapere se registrarsi)
CREATE POLICY "Public Read" ON app_settings FOR SELECT USING (true);

-- Policy 2: SOLO chi ha app_role='admin' può modificare le impostazioni
CREATE POLICY "Admin Update" ON app_settings FOR UPDATE USING (
  (SELECT app_role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Policy 3: SOLO chi ha app_role='admin' può inserire nuove impostazioni
CREATE POLICY "Admin Insert" ON app_settings FOR INSERT WITH CHECK (
  (SELECT app_role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Policy 4: I profili devono poter leggere se stessi per controllare il proprio ruolo
CREATE POLICY "Users can see own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- 5. FORZA AGGIORNAMENTO CACHE (per far vedere subito le modifiche all'App)
NOTIFY pgrst, 'reload schema';

-- NOTA BENE:
-- Dopo aver eseguito questo script, ricorda di andare nella tabella 'profiles' 
-- e impostare manualmente 'admin' nella colonna 'app_role' per il tuo utente!
