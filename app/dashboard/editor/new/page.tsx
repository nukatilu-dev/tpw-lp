import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import BusinessProfileEditor from "@/components/templates/business-profile-editor"
import "../editor.css"

export const dynamic = "force-dynamic"

export default async function NewBusinessProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Hitung slot draft milik pengguna.
  // Maksimal 3 website dalam status draft, pending_review, atau rejected.
  const { count, error: countError } = await supabase
    .from("landing_pages")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .in("status", ["draft", "pending_review", "rejected"])

  if (countError) {
    console.error("Draft slot check:", countError.message)
    throw new Error("Gagal memeriksa batas maksimal draft.")
  }

  // Jika seluruh slot terpakai, kembali ke Dashboard.
  if ((count ?? 0) >= 3) {
    redirect("/dashboard?limit=drafts")
  }

  return <BusinessProfileEditor userId={user.id} />
}