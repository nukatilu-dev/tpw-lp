BEGIN;
CREATE TABLE IF NOT EXISTS public.template_guides (
 template_key text PRIMARY KEY CHECK (template_key IN ('business-profile','personal-cv','digital-menu','product-catalog','creative-portfolio')),
 content jsonb NOT NULL DEFAULT '{}'::jsonb,
 theme_key text NOT NULL DEFAULT 'botanical' CHECK (theme_key IN ('botanical','editorial','coffeehouse','showcase','expedition')),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.template_guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS template_guides_admin_access ON public.template_guides;
CREATE POLICY template_guides_admin_access ON public.template_guides
 FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_guides TO authenticated;
COMMIT;
