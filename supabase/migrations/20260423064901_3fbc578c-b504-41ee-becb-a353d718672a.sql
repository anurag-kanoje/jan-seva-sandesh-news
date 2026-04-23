DROP POLICY IF EXISTS "Writers can update own articles, admins can update any" ON public.articles;
CREATE POLICY "Writers can update own articles, admins can update any"
ON public.articles
FOR UPDATE
USING (
  ((auth.uid() = author_id) AND has_role(auth.uid(), 'writer'::app_role))
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    auth.uid() = author_id
    AND has_role(auth.uid(), 'writer'::app_role)
    AND status IN ('pending', 'rejected')
  )
);

DROP POLICY IF EXISTS "Public can view active writer and admin profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active writer and admin profiles"
ON public.profiles
FOR SELECT
USING (
  is_active = true
  AND (
    has_role(user_id, 'writer'::app_role)
    OR has_role(user_id, 'admin'::app_role)
  )
);

DROP POLICY IF EXISTS "Authenticated users can upload article images" ON storage.objects;
CREATE POLICY "Writers and admins can upload article images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'article-images'
  AND auth.role() = 'authenticated'
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND (
    public.has_role(auth.uid(), 'writer'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);