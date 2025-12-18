-- Allineamento Tabella PROFILES per STAGING
-- Aggiunge le colonne mancanti se non esistono

-- 1. Aggiungi colonna 'role' (Ruolo professionale, es. Bid Manager)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text;

-- 2. Aggiungi colonna 'app_role' (Ruolo di sistema, es. admin)
-- Utile per il pannello di controllo
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS app_role text DEFAULT 'user';

-- 3. Aggiungi colonna 'credits' (Crediti residui)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits integer DEFAULT 0;

-- 4. Aggiungi colonna 'tender_volume' (Volume gare) - nel form di registrazione c'è
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tender_volume text;

-- 5. Aggiungi colonna 'sector' (Settore) - nel form di registrazione c'è
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sector text;

-- AGGIORNAMENTO PERMESSI (Sicurezza)
-- Assicura che l'utente possa leggere il proprio app_role
CREATE POLICY "Users can read own app_role"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Verifica finale (Opzionale, stampa i ruoli attuali)
-- SELECT id, email, app_role FROM public.profiles;
