-- Create a new storage bucket for tenders
insert into storage.buckets (id, name, public)
values ('tenders', 'tenders', false);

-- Policy to allow authenticated users to upload files
create policy "Authenticated users can upload tenders"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'tenders' and auth.uid() = owner );

-- Policy to allow users to view their own files
create policy "Users can view their own tenders"
on storage.objects for select
to authenticated
using ( bucket_id = 'tenders' and auth.uid() = owner );
