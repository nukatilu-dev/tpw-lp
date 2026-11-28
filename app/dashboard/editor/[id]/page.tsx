import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import "../editor.css"
import UniversalEditor from "@/components/templates/universal-editor"
import type { TemplateKey } from "@/lib/templates/registry"
import type { ThemeKey } from "@/lib/templates/themes"

export const dynamic = "force-dynamic"

const UNIVERSAL_KEYS: TemplateKey[] = [
  "business-profile",
  "personal-cv",
  "digital-menu",
  "product-catalog",
  "creative-portfolio",
]

const DEFAULT_THEMES: Record<TemplateKey, ThemeKey> = {
  "business-profile": "botanical",
  "personal-cv": "expedition",
  "digital-menu": "coffeehouse",
  "product-catalog": "showcase",
  "creative-portfolio": "editorial",
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export default async function EditLandingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) redirect("/login")

  const { data: page, error } = await supabase
    .from("landing_pages")
    .select("id,title,slug,status,template_key,content")
    .eq("id", id)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .single()

  if (error || !page) redirect("/dashboard")

  if (!["draft", "rejected"].includes(page.status)) {
    redirect("/dashboard")
  }

  const templateKey = page.template_key as TemplateKey
  if (!UNIVERSAL_KEYS.includes(templateKey)) redirect("/dashboard")

  const content = asRecord(page.content)
  const meta = asRecord(content._tpw)
  const theme = (typeof meta.themeKey === "string" && meta.themeKey
    ? meta.themeKey
    : DEFAULT_THEMES[templateKey]) as ThemeKey

  // Semua website lama dan baru masuk ke satu Universal WYSIWYG Editor.
  // Konten lama tetap dipertahankan; UniversalEditor dan mapper menangani
  // konversi tampilan berdasarkan template_key.
  return (
    <UniversalEditor
      userId={user.id}
      guide={templateKey}
      theme={theme}
      initialPage={{
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
        content,
      }}
    />
  )
}
