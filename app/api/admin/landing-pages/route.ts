import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getLandingPageHostname } from "@/lib/domain"

export const runtime = "nodejs"

type Action = "publish" | "reject" | "takedown" | "withdraw"

function normalizePhone(value: string) {
  let phone = value.replace(/\D/g, "")

  if (phone.startsWith("0")) {
    phone = `62${phone.slice(1)}`
  } else if (phone.startsWith("8")) {
    phone = `62${phone}`
  }

  if (phone.length < 9 || phone.length > 15) return null

  return phone
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const pageId =
      typeof body.pageId === "string" ? body.pageId : ""

    const action = body.action as Action
    const reason =
      typeof body.reason === "string" ? body.reason.trim() : ""

    if (!pageId || !["publish", "reject", "takedown", "withdraw"].includes(action)) {
      return NextResponse.json(
        { error: "Parameter tindakan tidak valid." },
        { status: 400 }
      )
    }

    if (
      (action === "reject" || action === "takedown") &&
      (!reason || reason.length > 1000)
    ) {
      return NextResponse.json(
        { error: "Alasan wajib diisi dan maksimal 1000 karakter." },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Silakan login kembali." },
        { status: 401 }
      )
    }

    const { data: isAdmin, error: adminError } =
      await supabase.rpc("is_admin")

    if (adminError || !isAdmin) {
      return NextResponse.json(
        { error: "Akses Admin tidak diizinkan." },
        { status: 403 }
      )
    }

    let rpcResult

    if (action === "publish") {
      rpcResult = await supabase.rpc(
        "admin_publish_landing_page",
        { p_page_id: pageId }
      )
    } else if (action === "reject") {
      rpcResult = await supabase.rpc(
        "admin_reject_landing_page",
        {
          p_page_id: pageId,
          p_reason: reason,
        }
      )
    } else if (action === "takedown") {
      rpcResult = await supabase.rpc(
        "admin_takedown_landing_page",
        {
          p_page_id: pageId,
          p_reason: reason,
        }
      )
    } else {
      rpcResult = await supabase.rpc(
        "withdraw_landing_page",
        { p_page_id: pageId }
      )
    }

    if (rpcResult.error) {
      return NextResponse.json(
        { error: rpcResult.error.message },
        { status: 400 }
      )
    }

    const result = rpcResult.data as {
      id?: string
      owner_id?: string
      title?: string
      slug?: string
      status?: string
      reason?: string
    } | null

    let notification: {
      status: string
      detail?: string
    } = { status: "skipped" }

    if (result?.owner_id && result.id) {
      const { data: domainPage } = await supabase
        .from("landing_pages")
        .select("slug, domain_type")
        .eq("id", result.id)
        .maybeSingle()

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, whatsapp_phone, whatsapp_opt_in")
        .eq("id", result.owner_id)
        .maybeSingle()

      if (profile?.whatsapp_opt_in && profile.whatsapp_phone) {
        const baseUrl = process.env.WAHA_BASE_URL?.replace(/\/+$/, "")
        const apiKey = process.env.WAHA_API_KEY
        const session = process.env.WAHA_SESSION || "default"

        if (!baseUrl || !apiKey) {
          notification = {
            status: "not_configured",
            detail: "Konfigurasi WAHA belum lengkap.",
          }
        } else {
          const phone = normalizePhone(profile.whatsapp_phone)

          if (!phone) {
            notification = {
              status: "skipped",
              detail: "Nomor WhatsApp pelanggan tidak valid.",
            }
          } else {
            const pageTitle = result.title || "Landing page Anda"
            const hostname = getLandingPageHostname(
              domainPage?.slug ?? result.slug ?? null,
              domainPage?.domain_type ?? null
            )
            const siteUrl = hostname ? `https://${hostname}` : ""

            const greeting = profile.display_name
              ? `Halo ${profile.display_name},`
              : "Halo,"

            let message = ""

            if (action === "publish") {
              message =
                `${greeting}\n\n` +
                `Landing page "${pageTitle}" sudah diterbitkan di TPW-LP.\n\n` +
                `${siteUrl}\n\n` +
                `Terima kasih telah menggunakan TPW-LP.`
            } else if (action === "reject") {
              message =
                `${greeting}\n\n` +
                `Pengajuan landing page "${pageTitle}" belum dapat disetujui.\n\n` +
                `Catatan Admin: ${reason}\n\n` +
                `Silakan perbaiki konten dan kirim kembali untuk pemeriksaan.`
            } else {
              message =
                `${greeting}\n\n` +
                `Landing page "${pageTitle}" untuk sementara telah dinonaktifkan.\n\n` +
                `Keterangan: ${reason}\n\n` +
                `Silakan hubungi tim TPW-LP apabila membutuhkan penjelasan.`
            }

            let sendStatus: "sent" | "failed" = "failed"
            let providerMessageId: string | null = null
            let errorMessage: string | null = null

            try {
              const response = await fetch(
                `${baseUrl}/api/sendText`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-Api-Key": apiKey,
                  },
                  body: JSON.stringify({
                    session,
                    chatId: `${phone}@c.us`,
                    text: message,
                  }),
                  signal: AbortSignal.timeout(20000),
                }
              )

              const responseText = await response.text()
              let responseData: Record<string, unknown> = {}

              try {
                responseData = JSON.parse(responseText)
              } catch {
                responseData = {}
              }

              if (response.ok) {
                sendStatus = "sent"

                const messageId =
                  responseData.id ||
                  (responseData.key as Record<string, unknown> | undefined)?.id

                providerMessageId =
                  typeof messageId === "string" ? messageId : null
              } else {
                errorMessage =
                  `WAHA HTTP ${response.status}: ${responseText.slice(0, 800)}`
              }
            } catch (error) {
              errorMessage =
                error instanceof Error
                  ? error.message
                  : "WAHA request failed"
            }

            const { error: logError } = await supabase
              .from("notification_logs")
              .insert({
                user_id: result.owner_id,
                landing_page_id: result.id,
                channel: "whatsapp",
                event_type: action,
                recipient: phone,
                status: sendStatus,
                provider_message_id: providerMessageId,
                error_message: errorMessage,
                attempts: 1,
                sent_at:
                  sendStatus === "sent"
                    ? new Date().toISOString()
                    : null,
              })

            notification = {
              status: sendStatus,
              detail: logError
                ? "Status pesan diproses, tetapi pencatatan log gagal."
                : errorMessage || undefined,
            }
          }
        }
      }
    }

    const messages: Record<Action, string> = {
      publish: "Landing page berhasil diterbitkan.",
      reject: "Pengajuan landing page berhasil ditolak.",
      takedown: "Landing page berhasil diturunkan.",
      withdraw: "Pengajuan berhasil ditarik. Website sekarang berstatus Draft.",
    }

    return NextResponse.json({
      success: true,
      message: messages[action],
      result,
      notification,
    })
  } catch (error) {
    console.error("TPW-LP admin action error:", error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan server.",
      },
      { status: 500 }
    )
  }
}
