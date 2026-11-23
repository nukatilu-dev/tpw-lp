import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import "../editor.css"
import BusinessProfileEditor from "@/components/templates/business-profile-editor"

export const dynamic = "force-dynamic"

export default async function EditBusinessProfilePage({
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

  if (authError || !user) {
    redirect("/login")
  }

  const { data: page, error } = await supabase
    .from("landing_pages")
    .select("id, title, slug, status, template_key, content")
    .eq("id", id)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .single()

  if (error || !page) {
    redirect("/dashboard")
  }

  if (page.template_key !== "business-profile") {
    redirect("/dashboard")
  }

  // Hanya draft dan website yang perlu perbaikan yang bisa diedit.
  if (!["draft", "rejected"].includes(page.status)) {
    redirect("/dashboard")
  }

  return (
    <BusinessProfileEditor
      userId={user.id}
      initialPage={{
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
        content: page.content,
      }}
    />
  )
}