-- ESEGUI QUESTI 2 PASSI IN SUPABASE -> SQL EDITOR
-- per far funzionare correttamente la pagina Admin

-- PASSO 1: CREA LE TABELLE E LE COLONNE NECESSARIE
-- Aggiungi admin role se non c'è
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Crea tabella impostazioni
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value boolean NOT NULL
);

-- Inserisci il setup iniziale (Registrazione APERTA di default)
INSERT INTO app_settings (key, value) VALUES ('registrazione_attiva', true) 
ON CONFLICT (key) DO NOTHING;


-- PASSO 2: GENERA I PERMESSI (RLS) CORRETTI
-- Questo assicura che tu possa leggere il tuo profilo per sapere se sei admin
-- E che gli admin possano modificare le impostazioni

ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Pulisci vecchie policy per evitare conflitti
DROP POLICY IF EXISTS "Enable read access for all users" ON app_settings;
DROP POLICY IF EXISTS "Enable update for admins only" ON app_settings;
DROP POLICY IF EXISTS "Enable insert for admins only" ON app_settings;
DROP POLICY IF EXISTS "Public Read" ON app_settings;
DROP POLICY IF EXISTS "Admin Update" ON app_settings;
DROP POLICY IF EXISTS "Admin Insert" ON app_settings;
DROP POLICY IF EXISTS "Users can see own profile" ON profiles;

-- Policy 1: TUTTI possono leggere se la registrazione e' attiva
CREATE POLICY "Public Read" ON app_settings FOR SELECT USING (true);

-- Policy 2: SOLO chi ha ruolo 'admin' su profiles può modificare
CREATE POLICY "Admin Update" ON app_settings FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admin Insert" ON app_settings FOR INSERT WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Policy 3: Permetti agli utenti di leggere il proprio ruolo (fondamentale)
CREATE POLICY "Users can see own profile" ON profiles FOR SELECT USING (auth.uid() = id);
