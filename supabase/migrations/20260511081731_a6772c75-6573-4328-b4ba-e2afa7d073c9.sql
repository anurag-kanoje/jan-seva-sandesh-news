
-- 1. Bootstrap admin: promote anurag (currently writer) to admin
UPDATE public.user_roles SET role = 'admin'
 WHERE user_id = 'c914f3d1-f601-42c8-9407-8c225b1b6454';

-- 2. Writer applications table
CREATE TABLE public.writer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  review_notes text DEFAULT '',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.writer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own application"
  ON public.writer_applications FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own application"
  ON public.writer_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own pending application"
  ON public.writer_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins update any application"
  ON public.writer_applications FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete applications"
  ON public.writer_applications FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_writer_applications_updated_at
  BEFORE UPDATE ON public.writer_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Auto-promote on approval
CREATE OR REPLACE FUNCTION public.handle_writer_application_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'writer')
    ON CONFLICT (user_id, role) DO NOTHING;
    NEW.reviewed_at = now();
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.reviewed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_writer_application_status_change
  BEFORE UPDATE ON public.writer_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_writer_application_approval();
