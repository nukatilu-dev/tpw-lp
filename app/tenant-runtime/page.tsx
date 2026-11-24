import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getLandingPageDomain } from "@/lib/domain"
import BusinessProfileTemplate from "@/components/templates/business-profile"

export const dynamic = "force-dynamic"

export default async function PublicTenantPage() {
  const headerStore = await headers()
  const hostname =
    headerStore.get("host") ??
    headerStore.get("x-forwarded-host")

  const tenant = getLandingPageDomain(hostname)

  if (!tenant) {
    notFound()
  }

  const supabase = await createClient()

  const { data: page, error } = await supabase
    .from("published_landing_pages")
    .select("id, title, slug, domain_type, template_key, content")
    .eq("slug", tenant.slug)
    .eq("domain_type", tenant.domainType)
    .maybeSingle()

  if (error || !page) {
    notFound()
  }

  if (page.template_key !== "business-profile") {
    notFound()
  }

  if (
    !page.content ||
    typeof page.content !== "object" ||
    Array.isArray(page.content)
  ) {
    notFound()
  }

  return (
    <BusinessProfileTemplate
      content={page.content as Record<string, unknown>}
    />
  )
}
