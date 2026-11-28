import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getLandingPageDomain } from "@/lib/domain"
import BusinessProfileTemplate from "@/components/templates/business-profile"
import PersonalCVTemplate from "@/components/templates/personal-cv"
import UniversalRenderer from "@/components/templates/universal-renderer"
import { toUniversalDocument } from "@/lib/templates/universal"
import type { TemplateKey } from "@/lib/templates/registry"

export const dynamic = "force-dynamic"
const UNIVERSAL_KEYS: TemplateKey[] = ["business-profile","personal-cv","digital-menu","product-catalog","creative-portfolio"]

export default async function PublicTenantPage() {
  const headerStore = await headers()
  const hostname = headerStore.get("host") ?? headerStore.get("x-forwarded-host")
  const tenant = getLandingPageDomain(hostname)
  if (!tenant) notFound()
  const supabase = await createClient()
  const { data: page, error } = await supabase.from("published_landing_pages")
    .select("id,title,slug,domain_type,template_key,content")
    .eq("slug",tenant.slug).eq("domain_type",tenant.domainType).maybeSingle()
  if (error || !page || !page.content || typeof page.content !== "object" || Array.isArray(page.content)) notFound()

  const content = page.content as Record<string, unknown>
  const marker = content._tpw as {editor?:string}|undefined
  if (marker?.editor === "universal-v1" && UNIVERSAL_KEYS.includes(page.template_key as TemplateKey)) {
    const document = toUniversalDocument(page.template_key as TemplateKey,content)
    // UniversalRenderer owns Business Profile tokens per selected template.
    // Old Theme Style metadata is retained in stored JSON for compatibility,
    // but is deliberately not applied to the public result.
    return <UniversalRenderer document={document} />
  }
  if (page.template_key === "personal-cv") return <PersonalCVTemplate content={content} />
  if (page.template_key === "business-profile") return <BusinessProfileTemplate content={content} />
  notFound()
}
