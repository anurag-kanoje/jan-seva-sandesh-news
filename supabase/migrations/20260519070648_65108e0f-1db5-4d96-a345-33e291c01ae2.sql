
CREATE TABLE public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL,
  slot text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('impression','click')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ad_events_ad_id ON public.ad_events(ad_id);
CREATE INDEX idx_ad_events_created_at ON public.ad_events(created_at DESC);

ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log ad events"
ON public.ad_events FOR INSERT
WITH CHECK (event_type IN ('impression','click'));

CREATE POLICY "Admins view ad events"
ON public.ad_events FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.get_ad_stats()
RETURNS TABLE (ad_id uuid, impressions bigint, clicks bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ad_id,
    COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
    COUNT(*) FILTER (WHERE event_type = 'click') AS clicks
  FROM public.ad_events
  WHERE has_role(auth.uid(), 'admin'::app_role)
  GROUP BY ad_id;
$$;
