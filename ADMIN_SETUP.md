# Istruzioni per Configurazione Admin

Per completare la configurazione della pagina di amministrazione, esegui i seguenti passaggi nel tuo progetto Supabase.

## 1. Aggiorna il Database (SQL)
Vai nell'editor SQL di Supabase e incolla/esegui i seguenti comandi:

```sql
-- 1. Aggiungi la colonna 'role' alla tabella profiles (se non esiste già)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 2. Crea la tabella per le impostazioni globali dell'app
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value boolean NOT NULL
);

-- 3. Inserisci l'impostazione predefinita per la registrazione (Default: ATTIVA)
INSERT INTO app_settings (key, value) VALUES ('registrazione_attiva', true) 
ON CONFLICT (key) DO NOTHING;

-- 4. Abilita la sicurezza (Row Level Security)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 5. Policy: Tutti possono LEGGERE le impostazioni (per sapere se la registrazione è attiva)
CREATE POLICY "Enable read access for all users" ON app_settings 
FOR SELECT USING (true);

-- 6. Policy: Solo gli Admin possono MODIFICARE le impostazioni
CREATE POLICY "Enable update for admins only" ON app_settings 
FOR UPDATE USING (
  exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);
CREATE POLICY "Enable insert for admins only" ON app_settings 
FOR INSERT WITH CHECK (
  exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);
```

## 2. Diventa Admin
Per vedere la pagina `/admin`, devi assegnare manualmente il ruolo "admin" al tuo utente.
1. Vai su Supabase > **Table Editor** > **profiles**.
2. Trova la riga corrispondente alla tua email.
3. Modifica la colonna `role` da "user" a `admin`.
4. Salva.

## 3. Accedi
Ora puoi navigare su:
`http://localhost:5173/admin` (o il tuo URL di produzione)

Se sei loggato come Admin, vedrai il pannello di controllo. Se sei un utente normale o non loggato, verrai reindirizzato alla Home.
