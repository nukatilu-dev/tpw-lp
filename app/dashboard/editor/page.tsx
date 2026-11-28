import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import "./editor.css"
import BusinessProfileEditor from "@/components/templates/business-profile-editor"
import PersonalCVEditor from "@/components/templates/personal-cv-editor"
import UniversalEditor from "@/components/templates/universal-editor"
import type { TemplateKey } from "@/lib/templates/registry"
import type { ThemeKey } from "@/lib/templates/themes"

export const dynamic = "force-dynamic"
const UNIVERSAL_KEYS: TemplateKey[] = ["business-profile", "personal-cv", "digital-menu", "product-catalog", "creative-portfolio"]

export default async function EditLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect("/login")
  const { data: page, error } = await supabase.from("landing_pages")
    .select("id,title,slug,status,template_key,content").eq("id",id)
    .eq("owner_id",user.id).is("deleted_at",null).single()
  if (error || !page) redirect("/dashboard")
  if (!["draft","rejected"].includes(page.status)) redirect("/dashboard")

  const content = (page.content && typeof page.content === "object" && !Array.isArray(page.content))
    ? page.content as Record<string, unknown> : {}
  const marker = content._tpw as { editor?: string; themeKey?: string } | undefined
  if (marker?.editor === "universal-v1" && UNIVERSAL_KEYS.includes(page.template_key as TemplateKey)) {
    return <UniversalEditor userId={user.id} guide={page.template_key as TemplateKey}
      theme={(marker.themeKey as ThemeKey) || "botanical"}
      initialPage={{id:page.id,title:page.title,slug:page.slug,status:page.status,content}} />
  }
  const initialPage = {id:page.id,title:page.title,slug:page.slug,status:page.status,content}
  if (page.template_key === "personal-cv") return <PersonalCVEditor userId={user.id} initialPage={initialPage} />
  if (page.template_key === "business-profile") return <BusinessProfileEditor userId={user.id} initialPage={initialPage} />
  redirect("/dashboard")
}
