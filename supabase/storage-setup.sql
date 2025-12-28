-- CalebMakes Storage Bucket Setup
-- Run this in Supabase SQL Editor AFTER creating the bucket manually

-- IMPORTANT: First, create the bucket in Supabase Dashboard:
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "New Bucket"
-- 3. Name: "thumbnails"
-- 4. Check "Public bucket" (so images can be viewed without auth)
-- 5. Click "Create bucket"

-- Then run this SQL to set up the storage policies:

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own thumbnails
CREATE POLICY "Users can update own thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own thumbnails
CREATE POLICY "Users can delete own thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to all thumbnails
CREATE POLICY "Public can view thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');
