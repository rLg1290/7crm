-- Create a new storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Set up security policies for the documents bucket
-- Policy for viewing documents (Select)
create policy "Authenticated users can view documents"
  on storage.objects for select
  using ( bucket_id = 'documents' and auth.role() = 'authenticated' );

-- Policy for uploading documents (Insert)
create policy "Authenticated users can upload documents"
  on storage.objects for insert
  with check ( bucket_id = 'documents' and auth.role() = 'authenticated' );

-- Policy for updating documents (Update)
create policy "Authenticated users can update documents"
  on storage.objects for update
  with check ( bucket_id = 'documents' and auth.role() = 'authenticated' );

-- Policy for deleting documents (Delete)
create policy "Authenticated users can delete documents"
  on storage.objects for delete
  using ( bucket_id = 'documents' and auth.role() = 'authenticated' );
