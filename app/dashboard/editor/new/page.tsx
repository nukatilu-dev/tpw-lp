import { randomUUID } from "crypto"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import BusinessProfileEditor from "@/components/templates/business-profile-editor"
import PersonalCVEditor from "@/components/templates/personal-cv-editor"
import UniversalEditor from "@/components/templates/universal-editor"
import type { TemplateKey } from "@/lib/templates/registry"
import type { ThemeKey } from "@/lib/templates/themes"
import "../editor.css"

export const dynamic = "force-dynamic"

const LEGACY_TEMPLATES = ["business-profile", "personal-cv"]
const GUIDE_KEYS: TemplateKey[] = ["business-profile", "personal-cv", "digital-menu", "product-catalog", "creative-portfolio"]
const THEME_KEYS: ThemeKey[] = ["botanical", "editorial", "coffeehouse", "showcase", "expedition"]

export default async function NewWebsitePage({ searchParams }: {
  searchParams: Promise<{ template?: string; guide?: string; theme?: string }>
}) {
  const { template, guide, theme } = await searchParams
  if (template && !LEGACY_TEMPLATES.includes(template)) redirect("/dashboard")
  if (guide && !GUIDE_KEYS.includes(guide as TemplateKey)) redirect("/dashboard")
  if (theme && !THEME_KEYS.includes(theme as ThemeKey)) redirect("/dashboard")

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const { count, error: countError } = await supabase.from("landing_pages")
    .select("id", { count: "exact", head: true }).eq("owner_id", user.id)
    .is("deleted_at", null).in("status", ["draft", "pending_review", "rejected"])
  if (countError) throw new Error("Gagal memeriksa batas maksimal draft.")
  if ((count ?? 0) >= 3) redirect("/dashboard?limit=drafts")

  if (template === "personal-cv") return <PersonalCVEditor userId={user.id} />
  if (template === "business-profile") return <BusinessProfileEditor userId={user.id} />
  const initialGuide = (guide as TemplateKey) || "business-profile"
  const defaultThemes: Record<TemplateKey, ThemeKey> = {
    "business-profile": "botanical",
    "personal-cv": "expedition",
    "digital-menu": "coffeehouse",
    "product-catalog": "showcase",
    "creative-portfolio": "editorial",
  }
  const id = randomUUID()
  return <UniversalEditor
    userId={user.id}
    guide={initialGuide}
    theme={(theme as ThemeKey) || defaultThemes[initialGuide]}
    newPageId={id}
    newPageSlug={id}
  />
}
