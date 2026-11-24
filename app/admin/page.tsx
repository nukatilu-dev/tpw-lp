import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminClient from "./admin-client"
import "./admin.css"

export const dynamic = "force-dynamic"

type LandingPage = {
  id: string
  owner_id: string
  title: string
  template_key: string
  slug: string | null
  domain_type: "lp" | "lpf"
  status: string
  review_note: string | null
  content: Record<string, unknown>
  created_at: string
  published_at: string | null
}

type AuditLog = {
  id: string
  actor_id: string | null
  landing_page_id: string | null
  action: string
  reason: string | null
  metadata: Record<string, unknown>
  created_at: string
}

type ProfileInfo = {
  display_name: string | null
  whatsapp_phone: string | null
  whatsapp_opt_in: boolean
}

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) redirect("/login")

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_admin")

  if (adminError || !isAdmin) redirect("/dashboard")

  const { data: pageRows, error: pageError } = await supabase
    .from("landing_pages")
    .select(
      "id, owner_id, title, template_key, slug, domain_type, status, review_note, content, created_at, published_at"
    )
    .order("created_at", { ascending: false })

  if (pageError) {
    throw new Error(`Gagal memuat landing pages: ${pageError.message}`)
  }

  const { data: logRows, error: logError } = await supabase
    .from("admin_audit_logs")
    .select("id, actor_id, landing_page_id, action, reason, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  if (logError) {
    throw new Error(`Gagal memuat audit log: ${logError.message}`)
  }

  const pages = (pageRows ?? []) as LandingPage[]
  const logs = (logRows ?? []) as AuditLog[]

  const userIds = [
    ...new Set([
      ...pages.map((page) => page.owner_id),
      ...logs.map((log) => log.actor_id).filter((id): id is string => Boolean(id)),
    ]),
  ]

  const profiles: Record<string, ProfileInfo> = {}

  if (userIds.length > 0) {
    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, whatsapp_phone, whatsapp_opt_in")
      .in("id", userIds)

    if (profileError) {
      throw new Error(`Gagal memuat profil pelanggan: ${profileError.message}`)
    }

    for (const profile of profileRows ?? []) {
      profiles[profile.id] = {
        display_name: profile.display_name,
        whatsapp_phone: profile.whatsapp_phone,
        whatsapp_opt_in: profile.whatsapp_opt_in,
      }
    }
  }

  return (
    <AdminClient
      adminName={
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Owner"
      }
      adminEmail={user.email || ""}
      pages={pages}
      logs={logs}
      profiles={profiles}
    />
  )
}
