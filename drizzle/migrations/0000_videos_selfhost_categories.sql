-- 1. videos: self-hosted file support, optional metadata
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE public.videos ALTER COLUMN detail DROP NOT NULL;
ALTER TABLE public.videos ALTER COLUMN detail SET DEFAULT '';
ALTER TABLE public.videos ALTER COLUMN thumb SET DEFAULT '';
ALTER TABLE public.videos ALTER COLUMN link SET DEFAULT '';
ALTER TABLE public.videos ALTER COLUMN code SET DEFAULT '';
ALTER TABLE public.videos ALTER COLUMN kind SET DEFAULT '';

-- 2. admin predicate with first-owner bootstrap
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
      OR coalesce(lower(auth.jwt() ->> 'email') = 'nanananamanj@gmail.com', false);
$$;

-- 3. rewrite videos write policies to use it
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='videos' AND cmd <> 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.videos', p.policyname); END LOOP;
END $$;

CREATE POLICY "Admins insert videos" ON public.videos FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins update videos" ON public.videos FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete videos" ON public.videos FOR DELETE TO authenticated USING (public.is_admin());

-- 4. editable categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  subs text[] NOT NULL DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins update categories" ON public.categories FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete categories" ON public.categories FOR DELETE TO authenticated USING (public.is_admin());

INSERT INTO public.categories (slug, label, subs, position) VALUES
  ('brands', 'Brands', '{}', 0),
  ('weddings', 'Weddings', ARRAY['Teaser','Highlight','Reel'], 1),
  ('events', 'Events', '{}', 2),
  ('podcasts', 'Podcasts', '{}', 3),
  ('travel', 'Travel', '{}', 4),
  ('music', 'Music', '{}', 5)
ON CONFLICT (slug) DO NOTHING;

-- 5. descriptions are no longer shown anywhere
UPDATE public.videos SET detail = '';