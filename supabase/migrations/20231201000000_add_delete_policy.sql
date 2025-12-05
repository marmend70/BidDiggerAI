-- Add DELETE policy for tenders
create policy "Users can delete their own tenders" on public.tenders
  for delete using (auth.uid() = user_id);

-- Add DELETE policy for tender_documents (optional, as cascade should handle it, but good for completeness)
create policy "Users can delete their own tender documents" on public.tender_documents
  for delete using (exists (
    select 1 from public.tenders
    where public.tenders.id = tender_documents.tender_id
    and public.tenders.user_id = auth.uid()
  ));

-- Add DELETE policy for analyses (optional, as cascade should handle it, but good for completeness)
create policy "Users can delete their own analyses" on public.analyses
  for delete using (exists (
    select 1 from public.tenders
    where public.tenders.id = analyses.tender_id
    and public.tenders.user_id = auth.uid()
  ));
