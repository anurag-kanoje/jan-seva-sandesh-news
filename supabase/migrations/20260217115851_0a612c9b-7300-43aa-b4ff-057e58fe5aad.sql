
-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true);

-- Storage policies for article-images bucket
CREATE POLICY "Anyone can view article images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

CREATE POLICY "Authenticated users can upload article images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'article-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own article images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'article-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own article images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'article-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add INSERT policy for profiles (needed for signup flow)
CREATE POLICY "System can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);
