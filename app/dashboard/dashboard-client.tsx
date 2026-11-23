"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  FileImage,
  Globe2,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Plus,
  Settings2,
  UserRound,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { CustomerLandingPage } from "./page"

type CustomerOrder = {
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

type CustomerPayment = {
  id: string
  order_id: string
  status: string
  rejection_note: string | null
  submitted_at: string
}

type CustomerSubscription = {
  id: string
  landing_page_id: string
  last_order_id: string | null
  plan_code: string
  status: string
  starts_at: string
  expires_at: string
}

type UserInfo = {
  id: string
  name: string
  email: string
  isAdmin: boolean
  hasReferralAccess: boolean
  whatsappPhone: string
  referralCode: string
}

const templates = [
  {
    key: "business-profile",
    name: "Business Profile",
    description: "Profil usaha dan layanan.",
    ready: true,
  },
  {
    key: "digital-menu",
    name: "Digital Menu",
    description: "Menu restoran dan kuliner.",
    ready: true,
  },
  {
    key: "product-catalog",
    name: "Product Catalog",
    description: "Katalog produk dan koleksi.",
    ready: true,
  },
  {
    key: "personal-cv",
    name: "Personal CV",
    description: "Profil dan pengalaman profesional.",
    ready: false,
  },
  {
    key: "creative-portfolio",
    name: "Creative Portfolio",
    description: "Karya dan proyek kreatif.",
    ready: false,
  },
]

const templateNames: Record<string, string> = {
  "business-profile": "Business Profile",
  "digital-menu": "Digital Menu",
  "product-catalog": "Product Catalog",
  "personal-cv": "Personal CV",
  "creative-portfolio": "Creative Portfolio",
}

const statusNames: Record<string, string> = {
  draft: "Draft",
  pending_review: "Menunggu Review",
  published: "Published",
  rejected: "Perlu Perbaikan",
  taken_down: "Diturunkan",
}

const DRAFT_SLOT_STATUSES = ["draft", "pending_review", "rejected"]
const MAX_DRAFT_SLOTS = 3
const TAKEDOWN_CONFIRMATION = "SISA KONTRAK SAYA HANGUS"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function getDomain(page: CustomerLandingPage) {
  if (!page.slug) return null

  const suffix = page.domain_type === "lpf" ? "-lpf" : "-lp"
  return `${page.slug}${suffix}.tpw.my.id`
}

export default function DashboardClient({
  user,
  pages,
  orders,
  payments,
  subscriptions,
}: {
  user: UserInfo
  pages: CustomerLandingPage[]
  orders: CustomerOrder[]
  payments: CustomerPayment[]
  subscriptions: CustomerSubscription[]
}) {
  const [active, setActive] = useState("Overview")
  const [selectedTemplate, setSelectedTemplate] =
    useState("business-profile")
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState("")
  // Website yang sudah ditakedown tidak dapat dibuatkan tagihan baru.
  const regularPages = pages.filter(
    (page) => page.domain_type !== "lpf" && page.status !== "taken_down"
  )
  const [billingPageId, setBillingPageId] = useState(
    regularPages[0]?.id || ""
  )
  const [billingDuration, setBillingDuration] = useState(1)
  const [billingBusy, setBillingBusy] = useState(false)

  const avatar = user.name.trim().charAt(0).toUpperCase() || "U"

  const counts = useMemo(
    () => ({
      total: pages.length,
      published: pages.filter((page) => page.status === "published").length,
      pending: pages.filter((page) => page.status === "pending_review").length,
      drafts: pages.filter((page) =>
        ["draft", "rejected"].includes(page.status)
      ).length,
      draftSlotsUsed: pages.filter((page) =>
        DRAFT_SLOT_STATUSES.includes(page.status)
      ).length,
    }),
    [pages]
  )

  const domains = pages.filter((page) => page.slug)

  const selected = templates.find(
    (template) => template.key === selectedTemplate
  )

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.assign("/login")
  }

  function announce(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(""), 3500)
  }

  function startDraft() {
    if (!selected?.ready) {
      announce("Editor template tersebut sedang disiapkan.")
      return
    }

    if (counts.draftSlotsUsed >= MAX_DRAFT_SLOTS) {
      announce("Batas maksimal 3 draft telah tercapai. Hapus draft atau selesaikan pengajuan yang ada terlebih dahulu.")
      return
    }

    window.location.assign("/dashboard/editor/new")
  }

  async function createBillingOrder() {
    if (!billingPageId) {
      announce("Buat website terlebih dahulu sebelum memilih paket.")
      return
    }

    setBillingBusy(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc(
        "create_subscription_order",
        {
          p_landing_page_id: billingPageId,
          p_duration_months: billingDuration,
        }
      )

      if (error) throw error

      const amount = Number(data?.amount || 0).toLocaleString("id-ID")
      announce(`Tagihan Rp${amount} berhasil dibuat.`)
      window.location.reload()
    } catch (error) {
      announce(
        error instanceof Error
          ? error.message
          : "Gagal membuat tagihan."
      )
    } finally {
      setBillingBusy(false)
    }
  }

  async function uploadPaymentProof(orderId: string, file: File) {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]

    if (!allowed.includes(file.type)) {
      announce("Bukti pembayaran harus JPG, PNG, WebP, atau PDF.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      announce("Ukuran bukti pembayaran maksimal 5 MB.")
      return
    }

    setBillingBusy(true)

    try {
      const supabase = createClient()
      const extension =
        file.type === "application/pdf"
          ? "pdf"
          : file.type === "image/jpeg"
            ? "jpg"
            : file.type === "image/png"
              ? "png"
              : "webp"

      const path =
        `${user.id}/${orderId}/${Date.now()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file, {
          upsert: false,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      const { error: submitError } = await supabase.rpc(
        "submit_subscription_payment",
        {
          p_order_id: orderId,
          p_proof_path: path,
        }
      )

      if (submitError) throw submitError

      announce("Bukti pembayaran terkirim. Menunggu konfirmasi Admin.")
      window.location.reload()
    } catch (error) {
      announce(
        error instanceof Error
          ? error.message
          : "Gagal mengirim bukti pembayaran."
      )
    } finally {
      setBillingBusy(false)
    }
  }

  async function withdrawSubmission(page: CustomerLandingPage) {
    const confirmed = window.confirm(
      `Tarik pengajuan "${page.title}" dan lanjutkan pengeditan?`
    )

    if (!confirmed) return

    const supabase = createClient()
    const { error } = await supabase.rpc("withdraw_landing_page", {
      p_page_id: page.id,
    })

    if (error) {
      announce(`Gagal menarik pengajuan: ${error.message}`)
      return
    }

    window.location.assign(`/dashboard/editor/${page.id}`)
  }

  async function deleteDraft(page: CustomerLandingPage) {
    const confirmed = window.confirm(
      `Hapus draft "${page.title}"? Draft akan dihapus dari daftar website Anda dan tindakan ini tidak dapat dibatalkan dari Dashboard.`
    )

    if (!confirmed) return

    const supabase = createClient()
    const { error } = await supabase.rpc("delete_own_draft_landing_page", {
      p_page_id: page.id,
    })

    if (error) {
      announce(`Gagal menghapus draft: ${error.message}`)
      return
    }

    announce("Draft berhasil dihapus.")
    window.location.reload()
  }

  async function takedownWebsite(page: CustomerLandingPage) {
    const confirmed = window.confirm(
      `Takedown website "${page.title}"? Website akan dinonaktifkan dan seluruh sisa masa kontrak yang belum digunakan akan hangus. Tindakan ini tidak dapat dibatalkan.`
    )

    if (!confirmed) return

    const typedConfirmation = window.prompt(
      `Untuk melanjutkan, ketik persis:\n${TAKEDOWN_CONFIRMATION}`
    )

    if (typedConfirmation !== TAKEDOWN_CONFIRMATION) {
      if (typedConfirmation !== null) {
        announce("Konfirmasi tidak cocok. Takedown dibatalkan.")
      }
      return
    }

    const supabase = createClient()
    const { error } = await supabase.rpc("owner_takedown_landing_page", {
      p_page_id: page.id,
      p_confirmation: TAKEDOWN_CONFIRMATION,
    })

    if (error) {
      announce(`Gagal melakukan takedown: ${error.message}`)
      return
    }

    announce("Website berhasil ditakedown. Sisa kontrak telah dinyatakan hangus.")
    window.location.reload()
  }

  const navItems = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "My Landing Pages", icon: Globe2 },
    { label: "My Orders", icon: FileImage },
    { label: "Profile", icon: UserRound },
  ]

  return (
    <main className="dashboard-shell">
      <aside
        className={`dashboard-sidebar ${mobileNav ? "sidebar-open" : ""}`}
      >
        <Link href="/" className="brand dashboard-brand">
          <Image
            src="/tpw_new_0.png"
            alt=""
            width={32}
            height={32}
            className="brand-mark-image"
          />
          <span className="brand-name">
            TPW<span>—LP</span>
          </span>
        </Link>

        <button className="workspace-switch">
          <span className="workspace-avatar">{avatar}</span>
          <span>
            <strong>{user.name}&apos;s workspace</strong>
            <small>Personal workspace</small>
          </span>
          <ChevronDown size={15} />
        </button>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="dash-nav" aria-label="Dashboard navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={active === label ? "active" : ""}
              onClick={() => {
                setActive(label)
                setMobileNav(false)
              }}
            >
              <Icon size={18} />
              {label}
              {label === "My Landing Pages" && (
                <span className="nav-count">{pages.length}</span>
              )}
            </button>
          ))}

          {user.isAdmin && (
            <button
              onClick={() => window.location.assign("/admin")}
            >
              <Settings2 size={18} />
              Admin Console
            </button>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">
              <CircleHelp size={17} />
            </span>
            <strong>Butuh bantuan?</strong>
            <p>Tim kami siap membantu perjalanan digitalmu.</p>
            <a href="mailto:hello@tpw.id">
              Hubungi kami <ArrowUpRight size={13} />
            </a>
          </div>

          <button className="sidebar-logout" onClick={logout}>
            <LogOut size={17} />
            Keluar
          </button>

          <div className="sidebar-user">
            <div className="user-avatar">{avatar}</div>
            <div>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
            <Settings2 size={17} />
          </div>
        </div>
      </aside>

      {mobileNav && (
        <button
          className="mobile-overlay"
          aria-label="Tutup navigasi"
          onClick={() => setMobileNav(false)}
        />
      )}

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            className="mobile-menu"
            aria-label="Buka navigasi"
            onClick={() => setMobileNav(!mobileNav)}
          >
            {mobileNav ? <X /> : <Menu />}
          </button>

          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{active}</strong>
          </div>

          <div className="topbar-actions">
            <button
              className="icon-button"
              aria-label="Notifikasi"
              onClick={() => announce("Belum ada notifikasi baru.")}
            >
              <Bell size={18} />
            </button>
            <div className="topbar-avatar">{avatar}</div>
          </div>
        </header>

        <div className="dashboard-content">
          {active === "Overview" || active === "My Landing Pages" ? (
            <>
              <div className="dashboard-greeting">
                <div>
                  <div className="section-tag">YOUR DIGITAL WORKSPACE</div>
                  <h1>
                    {active === "Overview" ? (
                      <>
                        Welcome back, <span>{user.name}.</span>
                      </>
                    ) : (
                      <>
                        My Landing <span>Pages.</span>
                      </>
                    )}
                  </h1>
                  <p>Kelola website dan identitas digitalmu.</p>
                </div>
              </div>

              <div className="dashboard-stats">
                <div className="stat-card">
                  <span>TOTAL LANDING PAGE</span>
                  <strong>{String(counts.total).padStart(2, "0")}</strong>
                  <small>
                    <Globe2 size={13} /> Data akunmu
                  </small>
                </div>

                <div className="stat-card">
                  <span>SUDAH DIPUBLIKASIKAN</span>
                  <strong>{String(counts.published).padStart(2, "0")}</strong>
                  <small>
                    <span className="status-dot" />
                    Website aktif
                  </small>
                </div>

                <div className="stat-card stat-highlight">
                  <span>DRAFT & PERLU PERBAIKAN</span>
                  <strong>{String(counts.drafts).padStart(2, "0")}</strong>
                  <small>Draft yang bisa dilanjutkan</small>
                </div>
              </div>

              <section className="pages-section">
                <div className="pages-heading">
                  <div>
                    <h2>My Landing Pages</h2>
                    <p>
                      {pages.length} website tersimpan di akunmu.
                    </p>
                  </div>
                  <span className="dashboard-review-count">
                    {counts.pending} menunggu review
                  </span>
                </div>

                {pages.length === 0 ? (
                  <div className="dashboard-empty">
                    <Globe2 size={26} />
                    <strong>Belum ada landing page.</strong>
                    <p>Pilih template untuk memulai website pertamamu.</p>
                  </div>
                ) : (
                  <div className="pages-list">
                    {pages.map((page) => {
                      const editable = ["draft", "rejected"].includes(
                        page.status
                      )

                      const domain = getDomain(page)

                      return (
                        <article className="page-row" key={page.id}>
                          <div
                            className={`page-thumbnail ${
                              page.template_key === "digital-menu"
                                ? "page-thumb-two"
                                : page.template_key === "business-profile"
                                  ? "page-thumb-three"
                                  : "page-thumb-one"
                            }`}
                          >
                            <span>TPW—LP</span>
                            <b>
                              {templateNames[page.template_key] ||
                                page.template_key}
                            </b>
                          </div>

                          <div className="page-detail">
                            <span className="page-category">
                              {templateNames[page.template_key] ||
                                page.template_key}
                            </span>
                            <h3>{page.title}</h3>
                            <span className="page-date">
                              Dibuat {formatDate(page.created_at)}
                            </span>
                            {domain && (
                              <span className="page-date">
                                {domain}
                              </span>
                            )}
                          </div>

                          <span
                            className={`page-status status-${page.status}`}
                          >
                            <i />
                            {statusNames[page.status] || page.status}
                          </span>

                          <div
                            className="page-row-actions"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              flexWrap: "wrap",
                              gap: 8,
                            }}
                          >
                            {editable && (
                              <>
                                <Link
                                  href={`/dashboard/editor/${page.id}`}
                                  className="page-open page-edit-link"
                                  aria-label={`Edit ${page.title}`}
                                  title="Edit Draft"
                                >
                                  <span>Edit Draft</span>
                                  <ArrowUpRight size={17} />
                                </Link>
                                <button
                                  type="button"
                                  className="page-open page-edit-link page-delete-action"
                                  onClick={() => deleteDraft(page)}
                                  title="Hapus draft ini"
                                >
                                  <span>Hapus Draft</span>
                                </button>
                              </>
                            )}

                            {page.status === "pending_review" && (
                              <button
                                type="button"
                                className="page-open page-edit-link"
                                onClick={() => withdrawSubmission(page)}
                                title="Tarik pengajuan dan lanjutkan pengeditan"
                              >
                                <span>Tarik & Edit</span>
                                <ArrowUpRight size={17} />
                              </button>
                            )}

                            {page.status === "published" && (
                              <button
                                type="button"
                                className="page-open page-edit-link page-takedown-action"
                                onClick={() => takedownWebsite(page)}
                                title="Nonaktifkan website dan hanguskan sisa kontrak"
                              >
                                <span>Takedown Website</span>
                              </button>
                            )}

                            {page.status === "taken_down" && (
                              <span
                                className="page-open page-status-marker"
                                title="Website sudah diturunkan dan kontrak dihentikan"
                              >
                                <span>Tidak Aktif</span>
                              </span>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}

                <div className="template-picker">
                  <div className="template-picker-heading">
                    <div>
                      <span className="section-tag">
                        START A NEW WEBSITE
                      </span>
                      <h2>Pilih Template.</h2>
                      <p>Pilih model website untuk membuat draft baru. Maksimal 3 slot draft per akun.</p>
                    </div>
                  </div>

                  <div className="template-picker-grid">
                    {templates.map((template, index) => (
                      <button
                        key={template.key}
                        type="button"
                        className={`template-choice ${
                          selectedTemplate === template.key
                            ? "selected"
                            : ""
                        } ${!template.ready ? "not-ready" : ""}`}
                        onClick={() => setSelectedTemplate(template.key)}
                      >
                        <span className="template-choice-number">
                          0{index + 1}
                        </span>
                        <strong>{template.name}</strong>
                        <small>{template.description}</small>
                        <span
                          className={`template-choice-state ${
                            template.ready ? "ready" : ""
                          }`}
                        >
                          {template.ready ? "SIAP DIGUNAKAN" : "DALAM PENGERJAAN"}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="template-picker-action">
                    <span>
                      <span>Dipilih: <strong>{selected?.name}</strong></span>
                      <br />
                      <small>
                        Slot draft: {counts.draftSlotsUsed}/{MAX_DRAFT_SLOTS} terpakai · {Math.max(0, MAX_DRAFT_SLOTS - counts.draftSlotsUsed)} tersisa
                      </small>
                    </span>
                    <button
                      className="button"
                      disabled={!selected?.ready || counts.draftSlotsUsed >= MAX_DRAFT_SLOTS}
                      onClick={startDraft}
                    >
                      <Plus size={16} />
                      Buat Draft
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </section>

              <section className="dashboard-bottom dashboard-billing-domain">
                <div className="billing-panel">
                  <div className="billing-panel-heading">
                    <div>
                      <span className="section-tag">PAKET & PEMBAYARAN</span>
                      <h2>Langganan Website</h2>
                    </div>
                  </div>

                  {subscriptions.length > 0 && (
                    <div className="billing-active-list">
                      {subscriptions.map((subscription) => {
                        const page = pages.find(
                          (item) => item.id === subscription.landing_page_id
                        )

                        return (
                          <div className="billing-active-row" key={subscription.id}>
                            <div>
                              <strong>{page?.title || "Website Anda"}</strong>
                              <small>
                                Aktif sampai {formatDate(subscription.expires_at)}
                              </small>
                            </div>
                            <span className={
                              subscription.status === "active"
                                ? "billing-paid"
                                : "billing-pending"
                            }>
                              {subscription.status === "active"
                                ? "Aktif"
                                : subscription.status}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="billing-order-form">
                    <label htmlFor="billing-page">Pilih website</label>
                    <select
                      id="billing-page"
                      value={billingPageId}
                      onChange={(event) => setBillingPageId(event.target.value)}
                      disabled={regularPages.length === 0 || billingBusy}
                    >
                      {regularPages.length === 0 ? (
                        <option value="">Belum ada website reguler</option>
                      ) : (
                        regularPages.map((page) => (
                          <option key={page.id} value={page.id}>
                            {page.title}
                          </option>
                        ))
                      )}
                    </select>

                    <label htmlFor="billing-duration">Pilih masa berlangganan</label>
                    <select
                      id="billing-duration"
                      value={billingDuration}
                      onChange={(event) =>
                        setBillingDuration(Number(event.target.value))
                      }
                      disabled={billingBusy}
                    >
                      <option value={1}>1 bulan — Rp50.000</option>
                      <option value={3}>3 bulan — Rp125.000</option>
                      <option value={6}>6 bulan — Rp250.000</option>
                    </select>

                    <button
                      type="button"
                      className="billing-create-button"
                      onClick={createBillingOrder}
                      disabled={billingBusy || regularPages.length === 0}
                    >
                      {billingBusy ? "Memproses..." : "Buat Tagihan"}
                      <ArrowRight size={15}/>
                    </button>
                  </div>

                  {orders.some((order) =>
                    ["pending_payment", "rejected"].includes(order.status)
                  ) ? (
                    <div className="billing-qris-panel">
                      <div className="billing-qris-heading">
                        <strong>Pembayaran DANA QRIS</strong>
                        <span>TPW STORE</span>
                      </div>

                      <p>
                        Silakan membayar sesuai dengan pilihan paket Anda.
                      </p>

                      <img
                        src="/tpw-store-qris.jpeg"
                        alt="QRIS resmi DANA TPW Store"
                        className="billing-qris-image"
                      />

                      <p className="billing-qris-note">
                        Pindai QRIS menggunakan aplikasi pembayaran Anda.
                        Pastikan nominal sesuai tagihan, lalu unggah bukti
                        pembayaran di bawah rincian tagihan.
                      </p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="billing-instruction">
                      Silakan pilih website dan paket berlangganan.
                      QRIS pembayaran akan ditampilkan setelah tagihan dibuat.
                    </div>
                  ) : (
                    <div className="billing-instruction">
                      Bukti pembayaran telah dikirim atau seluruh tagihan
                      telah lunas. Periksa status transaksi pada riwayat
                      pembayaran Anda.
                    </div>
                  )}

                  <div className="billing-history">
                    <div className="billing-history-heading">
                      <strong>Tagihan dan Pembayaran</strong>
                      <span>{orders.length} tagihan</span>
                    </div>

                    {orders.length === 0 ? (
                      <p className="billing-empty">
                        Belum ada tagihan. Pilih website dan paket untuk memulai.
                      </p>
                    ) : (
                      orders.map((order) => {
                        const payment = payments.find(
                          (item) => item.order_id === order.id
                        )
                        const page = pages.find(
                          (item) => item.id === order.landing_page_id
                        )

                        const amount = new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                        }).format(order.amount)

                        return (
                          <article className="billing-order-row" key={order.id}>
                            <div className="billing-order-top">
                              <div>
                                <strong>{page?.title || "Website"}</strong>
                                <small>
                                  {order.duration_months} bulan · {formatDate(order.created_at)}
                                </small>
                              </div>
                              <strong className="billing-amount">{amount}</strong>
                            </div>

                            <div className="billing-order-bottom">
                              {order.status === "paid" ? (
                                <span className="billing-paid">
                                  Lunas
                                  {order.period_end
                                    ? ` · Aktif sampai ${formatDate(order.period_end)}`
                                    : ""}
                                </span>
                              ) : order.status === "payment_submitted" ? (
                                <span className="billing-pending">
                                  Menunggu konfirmasi Admin
                                </span>
                              ) : order.status === "rejected" ? (
                                <span className="billing-rejected">
                                  Pembayaran perlu diperbaiki
                                </span>
                              ) : (
                                <span className="billing-pending">
                                  Belum lunas
                                </span>
                              )}
                            </div>

                            {payment?.rejection_note && (
                              <p className="billing-rejection-note">
                                Catatan Admin: {payment.rejection_note}
                              </p>
                            )}

                            {(order.status === "pending_payment" ||
                              order.status === "rejected") && (
                              <label className="billing-proof-button">
                                <FileImage size={14}/>
                                {payment?.status === "rejected"
                                  ? "Kirim ulang bukti pembayaran"
                                  : "Unggah bukti transfer"}
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,application/pdf"
                                  disabled={billingBusy}
                                  onChange={(event) => {
                                    const file = event.currentTarget.files?.[0]
                                    if (file) {
                                      void uploadPaymentProof(order.id, file)
                                    }
                                    event.currentTarget.value = ""
                                  }}
                                />
                              </label>
                            )}
                          </article>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="domain-panel">
                  <div className="domain-panel-heading">
                    <div>
                      <span className="section-tag">YOUR WEBSITE ADDRESS</span>
                      <h2>Domain Anda</h2>
                    </div>
                    <Link2 size={18}/>
                  </div>

                  {domains.length === 0 ? (
                    <p className="domain-empty">
                      Alamat website akan muncul setelah Anda membuat website.
                    </p>
                  ) : (
                    <div className="domain-scroll">
                      {domains.map((page) => {
                        const address = getDomain(page)

                        return (
                          <div className="domain-row" key={page.id}>
                            <div>
                              <strong>{address}</strong>
                              <small>{page.title}</small>
                            </div>
                            <span
                              className={
                                page.status === "published"
                                  ? "domain-active"
                                  : "domain-pending"
                              }
                            >
                              {page.status === "published"
                                ? "Published"
                                : page.status === "pending_review"
                                  ? "Menunggu review"
                                  : page.status === "taken_down"
                                    ? "Diturunkan"
                                    : "Belum tayang"}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <p className="domain-footnote">
                    Reguler: -lp.tpw.my.id · LPF: -lpf.tpw.my.id
                  </p>
                </div>
              </section>
            </>
          ) : active === "My Orders" ? (
            <div className="simple-section">
              <div className="section-tag">YOUR SUBSCRIPTION</div>
              <h1>My <span>Orders.</span></h1>
              <p className="page-lead">
                Riwayat paket, pembayaran, dan masa aktif.
              </p>
              <div className="dashboard-empty">
                <FileImage size={26} />
                <strong>Data transaksi belum tersedia.</strong>
                <p>
                  Informasi paket dan tombol pembayaran akan muncul
                  setelah modul langganan diaktifkan.
                </p>
              </div>
            </div>
          ) : (
            <div className="simple-section">
              <div className="section-tag">ACCOUNT SETTINGS</div>
              <h1>Your <span>Profile.</span></h1>
              <p className="page-lead">Identitas akun TPW-LP.</p>
              <div className="profile-card">
                <div className="profile-avatar">{avatar}</div>
                <div>
                  <span>FULL NAME</span>
                  <strong>{user.name}</strong>
                </div>
                <div>
                  <span>EMAIL ADDRESS</span>
                  <strong>{user.email}</strong>
                </div>
                <div>
                  <span>WHATSAPP</span>
                  <strong>{user.whatsappPhone || "Belum diisi"}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {toast && (
        <div className="toast-message" role="status">
          {toast}
        </div>
      )}
    </main>
  )
}
