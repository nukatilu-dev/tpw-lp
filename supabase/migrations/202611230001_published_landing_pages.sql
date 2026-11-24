BEGIN;

DROP VIEW IF EXISTS public.published_landing_pages;

CREATE VIEW public.published_landing_pages
WITH (
  security_barrier = true,
  security_invoker = true
)
AS
SELECT
  id,
  title,
  slug,
  domain_type,
  template_key,
  content
FROM public.landing_pages
WHERE status = 'published'
  AND deleted_at IS NULL;

GRANT SELECT ON public.published_landing_pages
TO anon, authenticated;

GRANT SELECT (
  id,
  title,
  slug,
  domain_type,
  template_key,
  content
)
ON public.landing_pages TO anon;

DROP POLICY IF EXISTS landing_pages_public_published_read
ON public.landing_pages;

CREATE POLICY landing_pages_public_published_read
ON public.landing_pages
FOR SELECT
TO anon
USING (
  status = 'published'
  AND deleted_at IS NULL
);

COMMIT;
