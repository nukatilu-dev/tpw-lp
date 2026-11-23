import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardClient from "./dashboard-client"

export const dynamic = "force-dynamic"

export type CustomerLandingPage = {
  id: string
  title: string
  template_key: string
  slug: string | null
  domain_type: "lp" | "lpf"
  status: string
  review_note: string | null
  created_at: string
  published_at: string | null
  revision_of: string | null
}

export type CustomerOrder = {
  id: string
  landing_page_id: string
  duration_months: number
  amount: number
  status: string
  created_at: string
  paid_at: string | null
  period_start: string | null
  period_end: string | null
}

export type CustomerPayment = {
  id: string
  order_id: string
  status: string
  rejection_note: string | null
  submitted_at: string
}

export type CustomerSubscription = {
  id: string
  landing_page_id: string
  last_order_id: string | null
  plan_code: string
  status: string
  starts_at: string
  expires_at: string
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) redirect("/login")

  const [
    adminResult,
    referralResult,
    profileResult,
    pagesResult,
    ordersResult,
    paymentsResult,
    subscriptionsResult,
  ] = await Promise.all([
    supabase.rpc("is_admin"),

    supabase.rpc("has_referral_center_access"),

    supabase
      .from("profiles")
      .select("display_name, whatsapp_phone, referral_code")
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("landing_pages")
      .select(
        "id, title, template_key, slug, domain_type, status, review_note, created_at, published_at, revision_of"
      )
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),

    supabase
      .from("subscription_orders")
      .select(
        "id, landing_page_id, duration_months, amount, status, created_at, paid_at, period_start, period_end"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),

    supabase
      .from("subscription_payments")
      .select("id, order_id, status, rejection_note, submitted_at")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(30),

    supabase
      .from("subscriptions")
      .select(
        "id, landing_page_id, last_order_id, plan_code, status, starts_at, expires_at"
      )
      .eq("user_id", user.id)
      .order("expires_at", { ascending: false }),
  ])

  if (pagesResult.error) {
    console.error("Dashboard pages:", pagesResult.error.message)
    throw new Error("Gagal memuat website Anda.")
  }

  if (ordersResult.error) {
    console.error("Dashboard orders:", ordersResult.error.message)
    throw new Error("Gagal memuat tagihan Anda.")
  }

  if (paymentsResult.error) {
    console.error("Dashboard payments:", paymentsResult.error.message)
    throw new Error("Gagal memuat pembayaran Anda.")
  }

  if (subscriptionsResult.error) {
    console.error(
      "Dashboard subscriptions:",
      subscriptionsResult.error.message
    )
    throw new Error("Gagal memuat langganan Anda.")
  }

  const name =
    profileResult.data?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Pengguna"

  return (
    <DashboardClient
      user={{
        id: user.id,
        name,
        email: user.email || "",
        isAdmin: Boolean(adminResult.data),
        hasReferralAccess: Boolean(referralResult.data),
        whatsappPhone: profileResult.data?.whatsapp_phone || "",
        referralCode: profileResult.data?.referral_code || "",
      }}
      pages={(pagesResult.data || []) as CustomerLandingPage[]}
      orders={(ordersResult.data || []) as CustomerOrder[]}
      payments={(paymentsResult.data || []) as CustomerPayment[]}
      subscriptions={
        (subscriptionsResult.data || []) as CustomerSubscription[]
      }
    />
  )
}