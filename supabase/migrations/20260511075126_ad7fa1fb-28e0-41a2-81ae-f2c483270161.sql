
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = CASE
      WHEN COALESCE(EXCLUDED.full_name, '') <> '' THEN EXCLUDED.full_name
      ELSE public.profiles.full_name
    END,
    updated_at = now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (user_id, full_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'articles_author_id_fkey'
  ) THEN
    ALTER TABLE public.articles
      ADD CONSTRAINT articles_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_articles_status_created ON public.articles (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles (category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author ON public.articles (author_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles (slug);
