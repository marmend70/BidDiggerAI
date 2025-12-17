-- FUNZIONE CHE GESTISCE I NUOVI UTENTI (TRIGGER)
-- Copia i dati da auth.users metadata a public.profiles

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, sector, tender_volume, credits, app_role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'role',         -- Ruolo professionale
    NEW.raw_user_meta_data->>'sector',
    NEW.raw_user_meta_data->>'tender_volume',
    2,                                       -- 2 Crediti omaggio default
    'user'                                   -- Ruolo app default
  );
  RETURN NEW;
END;
$$;

-- CREAZIONE DEL TRIGGER SU AUTH.USERS
-- Prima lo cancello per sicurezza se esiste e lo ricreo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Aggiungo anche la colonna email che forse mancava
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
