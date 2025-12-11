-- 1. Verifica e Abilita RLS su Tabelle Database
alter table public.profiles enable row level security;
alter table public.tenders enable row level security;
alter table public.tender_documents enable row level security;
alter table public.analyses enable row level security;

-- (Le policy di SELECT/INSERT/DELETE per le tabelle sembrano già presenti nelle migrazioni, 
-- ma per sicurezza le ricreiamo in modo idempotente o lasciamo che l'utente verifichi)

-- 2. SICUREZZA STORAGE (Bucket 'tenders')
-- Assicurati che il bucket sia privato
update storage.buckets set public = false where id = 'tenders';

-- Policy: INSERT (Caricamento)
-- Consente l'upload solo se l'utente è autenticato e il proprietario del file corrisponde al suo ID
drop policy if exists "Authenticated users can upload tenders" on storage.objects;
create policy "Authenticated users can upload tenders"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'tenders' and auth.uid() = owner );

-- Policy: SELECT (Visualizzazione/Download)
-- Consente il download solo se l'utente è il proprietario
drop policy if exists "Users can view their own tenders" on storage.objects;
create policy "Users can view their own tenders"
on storage.objects for select
to authenticated
using ( bucket_id = 'tenders' and auth.uid() = owner );

-- Policy: DELETE (Cancellazione) - MANCAVA!
-- Fondamentale per la funzione "Elimina" che abbiamo aggiunto
drop policy if exists "Users can delete their own files" on storage.objects;
create policy "Users can delete their own files"
on storage.objects for delete
to authenticated
using ( bucket_id = 'tenders' and auth.uid() = owner );

-- Policy: UPDATE (Modifica) - Opzionale ma consigliata
drop policy if exists "Users can update their own files" on storage.objects;
create policy "Users can update their own files"
on storage.objects for update
to authenticated
using ( bucket_id = 'tenders' and auth.uid() = owner );
