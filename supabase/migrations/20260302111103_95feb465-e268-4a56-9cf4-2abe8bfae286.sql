-- 1. Harden increment_article_views to only increment approved articles
CREATE OR REPLACE FUNCTION public.increment_article_views(article_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  UPDATE public.articles SET views = views + 1 WHERE id = article_id AND status = 'approved';
$$;

-- 2. Tighten profile SELECT policy to only show active writers/admins
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Public can view active writer and admin profiles"
ON public.profiles
FOR SELECT
USING (
  is_active = true AND (
    auth.uid() = user_id
    OR user_id IN (SELECT ur.user_id FROM public.user_roles ur)
  )
);