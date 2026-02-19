
-- Rename columns in articles table
ALTER TABLE public.articles RENAME COLUMN user_id TO author_id;
ALTER TABLE public.articles RENAME COLUMN views_count TO views;

-- Add slug column
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_unique ON public.articles(slug) WHERE slug IS NOT NULL;

-- Create RPC to increment views safely
CREATE OR REPLACE FUNCTION public.increment_article_views(article_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.articles SET views = views + 1 WHERE id = article_id;
$$;

-- Update RLS policies to use author_id
DROP POLICY IF EXISTS "Anyone can view approved articles" ON public.articles;
CREATE POLICY "Anyone can view approved articles" ON public.articles
  FOR SELECT USING (
    (status = 'approved') OR (auth.uid() = author_id) OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Writers and admins can create articles" ON public.articles;
CREATE POLICY "Writers and admins can create articles" ON public.articles
  FOR INSERT WITH CHECK (
    (auth.uid() = author_id) AND (has_role(auth.uid(), 'writer'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  );

DROP POLICY IF EXISTS "Writers can delete own articles, admins can delete any" ON public.articles;
CREATE POLICY "Writers can delete own articles, admins can delete any" ON public.articles
  FOR DELETE USING (
    ((auth.uid() = author_id) AND has_role(auth.uid(), 'writer'::app_role)) OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Writers can update own articles, admins can update any" ON public.articles;
CREATE POLICY "Writers can update own articles, admins can update any" ON public.articles
  FOR UPDATE USING (
    ((auth.uid() = author_id) AND has_role(auth.uid(), 'writer'::app_role)) OR has_role(auth.uid(), 'admin'::app_role)
  );
