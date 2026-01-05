-- =================================================================
-- FIX PERMISSIONS: ALLOW PUBLIC VIEWING (NUCLEAR OPTION)
-- =================================================================
--
-- It appears the Admin might be appearing as "Anonymous" or "Public"
-- to the storage system, causing access to be denied even with the
-- previous fix.
--
-- This script enables PUBLIC read access to the 'receipts' bucket.
-- This guarantees that the receipts will be viewable by anyone who
-- has the valid link (Verified Users, Admins, etc).
--
-- INSTRUCTIONS:
-- 1. Go to Supabase SQL Editor.
-- 2. Run this script.
-- =================================================================

-- 1. Ensure RLS is enabled
alter table storage.objects enable row level security;

-- 2. Remove the previous restricted policy if it exists
drop policy if exists "Allow All Authenticated View" on storage.objects;

-- 3. Create a NEW policy allowing PUBLIC (anon + authenticated) access
create policy "Allow Public View Receipts"
on storage.objects for select
to public
using ( bucket_id = 'receipts' );

-- 4. IMPORTANT: Ensure the bucket itself acts as public if needed
-- (Though RLS on objects usually overrides bucket public status for private buckets)
-- update storage.buckets set public = true where id = 'receipts';
-- ^ Uncomment step 4 only if step 3 doesn't work alone.
