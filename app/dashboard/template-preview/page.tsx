import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import TemplatePreviewGallery from "@/components/templates/template-preview-gallery"

export const dynamic = "force-dynamic"

export default async function TemplatePreviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) redirect("/login")

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_admin")

  if (adminError || !isAdmin) redirect("/dashboard")

  return <TemplatePreviewGallery />
}
