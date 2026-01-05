-- =================================================================
-- FIX FOR RECEIPT VISIBILITY (404 Error for Admins)
-- =================================================================
--
-- PROBLEM:
-- The Admin sees a 404 error because Supabase Storage policies 
-- currently restrict viewing to the "Owner" of the file.
--
-- SOLUTION:
-- Run this SQL script in your Supabase SQL Editor to allow 
-- ALL authenticated users (Admins & Staff) to VIEW all receipts.
--
-- INSTRUCTIONS:
-- 1. Go to https://supabase.com/dashboard/project/_/sql/new
-- 2. Paste the code below.
-- 3. Click "Run".
-- =================================================================

-- 1. Enable RLS on the bucket (just in case)
alter table storage.objects enable row level security;

-- 2. Create a policy that allows ANY authenticated user to SELECT (View) files.
--    This matches your requirement that Admins need to see Staff receipts.
create policy "Allow All Authenticated View"
on storage.objects for select
to authenticated
using ( bucket_id = 'receipts' );

-- NOTE: If you get an error saying "Policy already exists", 
-- run this command first to delete the old restrictive one:
-- drop policy "Give users access to own folder" on storage.objects;
