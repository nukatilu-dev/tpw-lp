"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { getLandingPageHostname } from "@/lib/domain"

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

type Filter =
  | "pending_review"
  | "published"
  | "draft"
  | "rejected"
  | "taken_down"
  | "all"

type Action = "publish" | "reject" | "takedown" | "withdraw"

const templateLabels: Record<string, string> = {
  "business-profile": "Business Profile",
  "digital-menu": "Digital Menu",
  "product-catalog": "Product Catalog",
  "personal-cv": "Personal CV",
  "creative-portfolio": "Creative Portfolio",
}

const statusNames: Record<string, string> = {
  draft: "Draft",
  pending_review: "Menunggu review",
  published: "Published",
  rejected: "Ditolak",
  taken_down: "Takedown",
}

const actionNames: Record<string, string> = {
  submitted: "Mengajukan review",
  published: "Menerbitkan landing page",
  rejected: "Menolak pengajuan",
  taken_down: "Melakukan takedown",
}

export default function AdminClient({
  adminName,
  adminEmail,
  pages,
  logs,
  profiles,
}: {
  adminName: string
  adminEmail: string
  pages: LandingPage[]
  logs: AuditLog[]
  profiles: Record<string, ProfileInfo>
}) {
  const router = useRouter()
  const [tab, setTab] = useState<"pages" | "guides" | "logs">("pages")
  const [filter, setFilter] = useState<Filter>("pending_review")
  const [search, setSearch] = useState("")
  const [templateFilter, setTemplateFilter] = useState("all")
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState("")

  const counts = useMemo(
    () => ({
      all: pages.length,
      pending_review: pages.filter((p) => p.status === "pending_review").length,
      published: pages.filter((p) => p.status === "published").length,
      draft: pages.filter((p) => p.status === "draft").length,
      rejected: pages.filter((p) => p.status === "rejected").length,
      taken_down: pages.filter((p) => p.status === "taken_down").length,
    }),
    [pages]
  )

  const pageById = useMemo(
    () => Object.fromEntries(pages.map((page) => [page.id, page])),
    [pages]
  )

  const normalizedSearch = search.trim().toLowerCase()

  const filteredPages = pages.filter((page) => {
    const profile = profiles[page.owner_id]
    const template = templateLabels[page.template_key] || page.template_key

    const matchesStatus =
      filter === "all" || page.status === filter

    const matchesTemplate =
      templateFilter === "all" || page.template_key === templateFilter

    const searchText = [
      page.title,
      page.slug || "",
      page.owner_id,
      template,
      profile?.display_name || "",
      profile?.whatsapp_phone || "",
      page.status,
    ].join(" ").toLowerCase()

    return (
      matchesStatus &&
      matchesTemplate &&
      (!normalizedSearch || searchText.includes(normalizedSearch))
    )
  })

  const filteredLogs = logs.filter((log) => {
    const actor = log.actor_id ? profiles[log.actor_id] : null
    const page = log.landing_page_id ? pageById[log.landing_page_id] : null

    const searchText = [
      actor?.display_name || "",
      log.action,
      actionNames[log.action] || "",
      log.reason || "",
      page?.title || "",
      log.landing_page_id || "",
    ].join(" ").toLowerCase()

    return !normalizedSearch || searchText.includes(normalizedSearch)
  })

  async function runAction(page: LandingPage, action: Action) {
    const reason = (reasons[page.id] || "").trim()

    if ((action === "reject" || action === "takedown") && !reason) {
      setNotice("Isi alasan terlebih dahulu.")
      return
    }

    const labels: Record<Action, string> = {
      publish: "menerbitkan",
      reject: "menolak",
      takedown: "menurunkan",
      withdraw: "mengembalikan ke Draft untuk diedit",
    }

    if (!window.confirm(`Yakin ingin ${labels[action]} "${page.title}"?`)) {
      return
    }

    setBusyId(page.id)
    setNotice("Memproses tindakan admin...")

    try {
      const response = await fetch("/api/admin/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: page.id,
          action,
          reason,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Tindakan gagal.")
      }

      const notification = result.notification?.status
      const notificationText =
        notification === "sent"
          ? " WhatsApp berhasil dikirim."
          : notification === "failed"
            ? " Status berubah, tetapi WhatsApp gagal dikirim."
            : notification === "not_configured"
              ? " WAHA belum dikonfigurasi."
              : notification === "skipped"
                ? " WhatsApp dilewati karena nomor atau persetujuan belum tersedia."
                : ""

      setNotice(`${result.message || "Tindakan berhasil."}${notificationText}`)
      router.refresh()
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Terjadi kesalahan."
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <div className="admin-eyebrow">TPW—LP / CONTROL CENTER</div>
          <h1>Admin <span>Console.</span></h1>
          <p>Validasi, publikasi, dan pengelolaan landing page pelanggan.</p>
        </div>
        <div className="admin-account">
          <strong>{adminName}</strong>
          <small>{adminEmail}</small>
          <a href="/dashboard">Kembali ke Dashboard ↗</a>
        </div>
      </header>

      <section className="admin-stats">
        <div><span>MENUNGGU REVIEW</span><strong>{counts.pending_review}</strong></div>
        <div><span>SUDAH PUBLISH</span><strong>{counts.published}</strong></div>
        <div><span>DRAFT</span><strong>{counts.draft}</strong></div>
        <div><span>TOTAL HALAMAN</span><strong>{counts.all}</strong></div>
      </section>

      {notice && (
        <div className="admin-notice" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Tutup pesan">×</button>
        </div>
      )}

      <nav className="admin-tabs" aria-label="Menu Admin">
        <button
          className={tab === "pages" ? "active" : ""}
          onClick={() => setTab("pages")}
        >
          Landing Pages <span>{pages.length}</span>
        </button>
        <button
          className={tab === "guides" ? "active" : ""}
          onClick={() => setTab("guides")}
        >
          Template Guide
        </button>
        <button
          className={tab === "logs" ? "active" : ""}
          onClick={() => setTab("logs")}
        >
          Log Aktivitas <span>{logs.length}</span>
        </button>
      </nav>

      {tab === "pages" ? (
        <section className="admin-workspace">
          <div className="admin-section-heading">
            <div>
              <div className="admin-eyebrow">CONTENT MODERATION</div>
              <h2>Landing Page Queue</h2>
            </div>
            <button className="admin-refresh" onClick={() => router.refresh()}>
              ↻ Refresh
            </button>
          </div>

          <div className="admin-controls">
            <input
              className="admin-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama pelanggan, judul, nomor WA, slug..."
            />
            <select
              className="admin-template-select"
              value={templateFilter}
              onChange={(event) => setTemplateFilter(event.target.value)}
              aria-label="Filter template"
            >
              <option value="all">Semua template</option>
              {Object.entries(templateLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <nav className="admin-filters" aria-label="Filter status">
            {(
              [
                ["pending_review", "Menunggu", counts.pending_review],
                ["published", "Published", counts.published],
                ["draft", "Draft", counts.draft],
                ["rejected", "Ditolak", counts.rejected],
                ["taken_down", "Takedown", counts.taken_down],
                ["all", "Semua", counts.all],
              ] as [Filter, string, number][]
            ).map(([key, label, count]) => (
              <button
                key={key}
                className={filter === key ? "active" : ""}
                onClick={() => setFilter(key)}
              >
                {label} <span>{count}</span>
              </button>
            ))}
          </nav>

          {filteredPages.length === 0 ? (
            <div className="admin-empty">
              <span>✳</span>
              <h3>Tidak ada landing page yang cocok.</h3>
              <p>Coba ubah pencarian atau filter.</p>
            </div>
          ) : (
            <div className="admin-page-list">
              {filteredPages.map((page) => {
                const profile = profiles[page.owner_id]
                const isBusy = busyId === page.id

                return (
                  <article className="admin-page-card" key={page.id}>
                    <div className="admin-page-top">
                      <div>
                        <span className={`admin-status status-${page.status}`}>
                          {statusNames[page.status] || page.status}
                        </span>
                        <h3>{page.title}</h3>
                        <p>{templateLabels[page.template_key] || page.template_key}</p>
                      </div>
                      <time>
                        {new Date(page.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </div>

                    <div className="admin-owner">
                      <div>
                        <small>PEMILIK</small>
                        <strong>{profile?.display_name || "Pengguna TPW-LP"}</strong>
                      </div>
                      <div>
                        <small>WHATSAPP</small>
                        <strong>{profile?.whatsapp_phone || "Belum diisi"}</strong>
                      </div>
                      <div>
                        <small>IZIN NOTIFIKASI</small>
                        <strong>{profile?.whatsapp_opt_in ? "Disetujui" : "Belum disetujui"}</strong>
                      </div>
                    </div>

                    <div className="admin-page-meta">
                      <span>Slug: {page.slug || "Belum ditentukan"}</span>
                      {page.status === "published" && page.slug && (
                        <a href={`https://${getLandingPageHostname(page.slug, page.domain_type)}`} target="_blank" rel="noreferrer">
                          Buka website ↗
                        </a>
                      )}
                    </div>

                    <details className="admin-content-preview">
                      <summary>Lihat data konten / preview struktur</summary>
                      <pre>{JSON.stringify(page.content || {}, null, 2)}</pre>
                    </details>

                    {page.review_note && (
                      <div className="admin-review-note">
                        Catatan terakhir: {page.review_note}
                      </div>
                    )}

                    {(page.status === "pending_review" || page.status === "published") && (
                      <div className="admin-actions">
                        <input
                          value={reasons[page.id] || ""}
                          onChange={(event) =>
                            setReasons((current) => ({
                              ...current,
                              [page.id]: event.target.value,
                            }))
                          }
                          placeholder={
                            page.status === "pending_review"
                              ? "Alasan penolakan (bila diperlukan)"
                              : "Alasan takedown"
                          }
                          aria-label="Alasan tindakan admin"
                        />

                        {page.status === "pending_review" && (
                          <>
                            <button
                              className="admin-button admin-publish"
                              disabled={isBusy || !page.slug}
                              onClick={() => runAction(page, "publish")}
                            >
                              {isBusy ? "Memproses..." : "Publish"}
                            </button>
                            <button
                              className="admin-button admin-reject"
                              disabled={isBusy}
                              onClick={() => runAction(page, "reject")}
                            >
                              Reject
                            </button>
                            <button
                              className="admin-button admin-withdraw"
                              disabled={isBusy}
                              onClick={() => runAction(page, "withdraw")}
                            >
                              Tarik & Edit
                            </button>
                          </>
                        )}

                        {page.status === "published" && (
                          <button
                            className="admin-button admin-takedown"
                            disabled={isBusy}
                            onClick={() => runAction(page, "takedown")}
                          >
                            Takedown
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      ) : tab === "guides" ? (
        <section className="admin-workspace">
          <div className="admin-section-heading">
            <div>
              <div className="admin-eyebrow">TEMPLATE MANAGEMENT</div>
              <h2>Template Guide</h2>
              <p className="admin-log-description">
                Lihat dan uji lima contoh Content Guide TPW sebelum digunakan pelanggan.
              </p>
            </div>
            <a className="admin-refresh" href="/admin/template-guides">
              Buka Template Guide ↗
            </a>
          </div>
          <div className="admin-empty">
            <span>✳</span>
            <h3>Template Guide TPW</h3>
            <p>
              Kelola pemeriksaan tampilan Tahu Hejo, Leeloo, Kedai Kopi,
              Katalog Produk, dan Kreatif Sendiri melalui halaman preview.
            </p>
            <a className="admin-refresh" href="/admin/template-guides">
              Lihat dan uji Template Guide ↗
            </a>
          </div>
        </section>
      ) : (
        <section className="admin-workspace">
          <div className="admin-section-heading">
            <div>
              <div className="admin-eyebrow">SYSTEM TRACE</div>
              <h2>Log Aktivitas</h2>
              <p className="admin-log-description">
                Catatan pengajuan, publikasi, penolakan, dan takedown.
              </p>
            </div>
            <button className="admin-refresh" onClick={() => router.refresh()}>
              ↻ Refresh
            </button>
          </div>

          <input
            className="admin-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari aktivitas, nama pelanggan, judul halaman..."
          />

          {filteredLogs.length === 0 ? (
            <div className="admin-empty">
              <span>✳</span>
              <h3>Belum ada aktivitas yang cocok.</h3>
              <p>Log akan tercatat saat pelanggan mengajukan review atau admin mengambil tindakan.</p>
            </div>
          ) : (
            <div className="admin-logs">
              {filteredLogs.map((log) => {
                const actor = log.actor_id ? profiles[log.actor_id] : null
                const page = log.landing_page_id ? pageById[log.landing_page_id] : null

                return (
                  <article className="admin-log-row" key={log.id}>
                    <div className="admin-log-marker" />
                    <div className="admin-log-main">
                      <strong>{actionNames[log.action] || log.action}</strong>
                      <span>{page?.title || "Landing page tidak tersedia"}</span>
                      <small>
                        Oleh: {actor?.display_name || "Akun tidak ditemukan"}
                        {" · "}
                        {new Date(log.created_at).toLocaleString("id-ID")}
                      </small>
                      {log.reason && <p>{log.reason}</p>}
                    </div>
                    <span className="admin-log-action">{log.action}</span>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      <footer className="admin-footer">
        TPW—LP ADMIN · Owner access · {adminEmail}
      </footer>
    </main>
  )
}
