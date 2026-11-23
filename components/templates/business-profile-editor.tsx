"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { createTemplateContent } from "@/lib/templates/registry"
import BusinessProfileTemplate from "./business-profile"

type Service = {
  title: string
  description: string
}

type ImageKind = "logo" | "product" | "background"
type LocationMode = "pin" | "area"
type BusinessLocation = {
  enabled: boolean
  mode: LocationMode
  googleMapsUrl: string
  areaName: string
}

type BusinessContent = {
  businessName: string
  tagline: string
  headline: string
  introduction: string
  aboutTitle: string
  about: string
  services: Service[]
  contact: {
    phone: string
    whatsapp: string
    email: string
    address: string
  }
  social: {
    facebook: string
    instagram: string
    youtube: string
    tiktok: string
  }
  location: BusinessLocation
  images: {
    logo: string
    product: string
    background: string
  }
  theme: {
    primary: string
    accent: string
  }
}

type ExistingPage = {
  id: string
  title: string
  slug: string | null
  status: string
  content: Record<string, unknown>
}

type SlugCheckState = "idle" | "invalid" | "checking" | "available" | "taken" | "error"

type SlugAvailabilityResult = {
  is_available: boolean
  suggestions: string[]
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
]

const imageLabels: Record<ImageKind, string> = {
  logo: "Logo Bisnis",
  product: "Foto Produk",
  background: "Foto Latar Belakang",
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const value = error as {
      message?: unknown
      code?: unknown
      details?: unknown
      hint?: unknown
    }

    const message = typeof value.message === "string" ? value.message : ""
    const code = typeof value.code === "string" ? value.code : ""
    const details = typeof value.details === "string" ? value.details : ""
    const hint = typeof value.hint === "string" ? value.hint : ""

    const diagnostic = [
      message || fallback,
      code ? `Kode: ${code}` : "",
      details ? `Detail: ${details}` : "",
      hint ? `Petunjuk: ${hint}` : "",
    ].filter(Boolean)

    return diagnostic.join(" · ")
  }

  return error instanceof Error ? error.message : fallback
}

export default function BusinessProfileEditor({
  userId,
  initialPage = null,
  newPageId = "",
  newPageSlug = "",
}: {
  userId: string
  initialPage?: ExistingPage | null
  newPageId?: string
  newPageSlug?: string
}) {
  const router = useRouter()

  const defaults = createTemplateContent(
    "business-profile"
  ) as unknown as BusinessContent

  const saved = initialPage?.content as Partial<BusinessContent> | undefined

  const [content, setContent] = useState<BusinessContent>(() => ({
    ...defaults,
    ...saved,
    contact: {
      ...defaults.contact,
      ...saved?.contact,
    },
    social: {
      facebook: "",
      instagram: "",
      youtube: "",
      tiktok: "",
      ...saved?.social,
    },
    location: {
      enabled: saved?.location?.enabled === true,
      mode: saved?.location?.mode === "area" ? "area" : "pin",
      googleMapsUrl:
        typeof saved?.location?.googleMapsUrl === "string"
          ? saved.location.googleMapsUrl
          : "",
      areaName:
        typeof saved?.location?.areaName === "string"
          ? saved.location.areaName
          : "",
    },
    images: {
      ...defaults.images,
      ...saved?.images,
    },
    theme: {
      ...defaults.theme,
      ...saved?.theme,
    },
    services:
      Array.isArray(saved?.services) && saved.services.length > 0
        ? saved.services.slice(0, 3)
        : defaults.services,
  }))

  const [title, setTitle] = useState(
    initialPage?.title || defaults.businessName
  )
  // Domain berdiri sendiri dari judul website dan nama bisnis.
  // Website baru memakai kode subdomain 4 huruf yang dialokasikan database.
  const [slug, setSlug] = useState(
    initialPage?.slug ||
    newPageSlug ||
    initialPage?.id ||
    newPageId ||
    slugify(defaults.businessName)
  )
  const [pageId, setPageId] = useState(
    initialPage?.id || newPageId || ""
  )
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState<ImageKind | null>(null)
  const [slugCheckState, setSlugCheckState] = useState<SlugCheckState>("idle")
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([])
  const [slugCheckRefresh, setSlugCheckRefresh] = useState(0)

  // Draft sudah dibuat oleh server saat /new dibuka.
  // Ganti URL ke ID draft agar refresh tidak membuat draft baru.
  useEffect(() => {
    if (
      pageId &&
      window.location.pathname === "/dashboard/editor/new"
    ) {
      window.history.replaceState(
        null,
        "",
        `/dashboard/editor/${pageId}`
      )
    }
  }, [pageId])

  // Pemeriksaan dilakukan melalui RPC SECURITY DEFINER agar melihat seluruh
  // slug global, bukan hanya baris yang terlihat oleh RLS milik pengguna.
  useEffect(() => {
    let cancelled = false
    const candidate = slugify(slug)

    if (!/^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/.test(candidate)) {
      setSlugCheckState("invalid")
      setSlugSuggestions([])
      return
    }

    setSlugCheckState("checking")
    const timer = window.setTimeout(async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.rpc(
          "check_landing_page_slug_availability",
          {
            p_slug: candidate,
            p_exclude_page_id: pageId || null,
          }
        )

        if (error) throw error
        const result = (Array.isArray(data) ? data[0] : data) as
          | SlugAvailabilityResult
          | null

        if (!result || typeof result.is_available !== "boolean") {
          throw new Error("Respons pemeriksaan alamat website tidak valid.")
        }

        if (cancelled) return
        setSlugCheckState(result.is_available ? "available" : "taken")
        setSlugSuggestions(result.suggestions || [])
      } catch (error) {
        if (cancelled) return
        console.error("Business Profile slug check failed:", error)
        setSlugCheckState("error")
        setSlugSuggestions([])
      }
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [slug, pageId, slugCheckRefresh])

  function update<K extends keyof BusinessContent>(
    key: K,
    value: BusinessContent[K]
  ) {
    setContent((current) => ({ ...current, [key]: value }))
  }

  function updateBusinessName(value: string) {
    setContent((current) => ({ ...current, businessName: value }))
  }

  function updateContact(
    key: keyof BusinessContent["contact"],
    value: string
  ) {
    setContent((current) => ({
      ...current,
      contact: { ...current.contact, [key]: value },
    }))
  }

  function updateSocial(
    key: keyof BusinessContent["social"],
    value: string
  ) {
    setContent((current) => ({
      ...current,
      social: { ...current.social, [key]: value },
    }))
  }

  function setLocationEnabled(enabled: boolean) {
    setContent((current) => ({
      ...current,
      location: enabled
        ? { ...current.location, enabled: true }
        : {
            enabled: false,
            mode: current.location.mode,
            googleMapsUrl: "",
            areaName: "",
          },
    }))
  }

  function setLocationMode(mode: LocationMode) {
    setContent((current) => ({
      ...current,
      location: mode === "area"
        ? { ...current.location, mode, googleMapsUrl: "" }
        : { ...current.location, mode, areaName: "" },
    }))
  }

  function updateLocationField(
    key: "googleMapsUrl" | "areaName",
    value: string
  ) {
    setContent((current) => ({
      ...current,
      location: { ...current.location, [key]: value },
    }))
  }

  function updateTheme(
    key: keyof BusinessContent["theme"],
    value: string
  ) {
    setContent((current) => ({
      ...current,
      theme: { ...current.theme, [key]: value },
    }))
  }

  function updateService(
    index: number,
    key: keyof Service,
    value: string
  ) {
    setContent((current) => ({
      ...current,
      services: current.services.map((service, i) =>
        i === index ? { ...service, [key]: value } : service
      ),
    }))
  }

  function addService() {
    if (content.services.length >= 3) return

    update("services", [
      ...content.services,
      { title: "", description: "" },
    ])
  }

  function removeService(index: number) {
    if (content.services.length <= 1) return

    update(
      "services",
      content.services.filter((_, i) => i !== index)
    )
  }

  async function saveDraft(): Promise<string | null> {
    if (!title.trim()) {
      setNotice("Judul website wajib diisi.")
      return null
    }

    const requestedSlug = slugify(slug)
    if (!/^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/.test(requestedSlug)) {
      setSlugCheckState("invalid")
      setNotice("Alamat website harus 2–40 karakter: huruf kecil, angka, atau tanda hubung.")
      return null
    }

    setBusy(true)
    setNotice("Memeriksa ketersediaan alamat website...")

    try {
      const supabase = createClient()

      // Validasi ulang tepat sebelum simpan. UNIQUE constraint database tetap
      // menjadi pengaman terakhir jika pengguna lain mengambil slug bersamaan.
      const { data: checkData, error: checkError } = await supabase.rpc(
        "check_landing_page_slug_availability",
        {
          p_slug: requestedSlug,
          p_exclude_page_id: pageId || null,
        }
      )

      if (checkError) throw checkError
      const availability = (Array.isArray(checkData) ? checkData[0] : checkData) as
        | SlugAvailabilityResult
        | null

      if (!availability || typeof availability.is_available !== "boolean") {
        throw new Error("Gagal membaca status ketersediaan alamat website.")
      }

      setSlugSuggestions(availability.suggestions || [])
      if (!availability.is_available) {
        setSlugCheckState("taken")
        setNotice("Alamat website sudah digunakan. Pilih salah satu saran alamat yang tersedia.")
        return null
      }

      setSlugCheckState("available")
      setNotice("Menyimpan draft...")

      const safeLocation: BusinessLocation = !content.location.enabled
        ? {
            enabled: false,
            mode: content.location.mode,
            googleMapsUrl: "",
            areaName: "",
          }
        : content.location.mode === "area"
          ? { ...content.location, googleMapsUrl: "" }
          : { ...content.location, areaName: "" }

      const contentToSave: BusinessContent = {
        ...content,
        location: safeLocation,
      }

      const payload = {
        title: title.trim(),
        slug: requestedSlug,
        content: contentToSave,
      }

      if (pageId) {
        const { data: updatedPage, error } = await supabase
          .from("landing_pages")
          .update(payload)
          .eq("id", pageId)
          .eq("owner_id", userId)
          .is("deleted_at", null)
          .select("id")
          .maybeSingle()

        if (error) throw error
        if (!updatedPage) {
          throw new Error("Website tidak ditemukan atau sudah tidak dapat diedit.")
        }

        window.history.replaceState(
          null,
          "",
          `/dashboard/editor/${pageId}`
        )
        setNotice("Draft berhasil disimpan.")
        return pageId
      }

      const { data, error } = await supabase
        .from("landing_pages")
        .insert({
          ...payload,
          ...(newPageId ? { id: newPageId } : {}),
          owner_id: userId,
          template_key: "business-profile",
          status: "draft",
          domain_type: "lp",
        })
        .select("id")
        .single()

      if (error) throw error
      if (!data?.id) {
        throw new Error("Database tidak mengembalikan ID website setelah penyimpanan.")
      }

      setPageId(data.id)
      window.history.replaceState(null, "", `/dashboard/editor/${data.id}`)
      setNotice("Draft berhasil disimpan.")
      return data.id
    } catch (error) {
      console.error("Business Profile save failed:", error)

      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: unknown }).code || "")
          : ""

      if (code === "23505") {
        setSlugCheckState("taken")
        setSlugCheckRefresh((value) => value + 1)
        setNotice("Alamat website baru saja digunakan oleh pengguna lain. Silakan pilih saran alamat yang tersedia.")
      } else {
        setNotice(getErrorMessage(error, "Gagal menyimpan draft."))
      }
      return null
    } finally {
      setBusy(false)
    }
  }

  async function uploadImage(
    kind: ImageKind,
    file: File | undefined
  ) {
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setNotice("Format gambar harus JPG, PNG, atau WebP.")
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setNotice("Ukuran gambar maksimal 5 MB.")
      return
    }

    const id = await saveDraft()
    if (!id) return

    setUploading(kind)
    setNotice(`Mengunggah ${imageLabels[kind]}...`)

    const extension =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : "webp"

    const path =
      `${userId}/${id}/${kind}-${Date.now()}.${extension}`

    try {
      const supabase = createClient()

      const { error: uploadError } = await supabase.storage
        .from("website-assets")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from("website-assets")
        .getPublicUrl(path)

      const nextContent: BusinessContent = {
        ...content,
        images: {
          ...content.images,
          [kind]: data.publicUrl,
        },
      }

      const { error: updateError } = await supabase
        .from("landing_pages")
        .update({ content: nextContent })
        .eq("id", id)
        .eq("owner_id", userId)

      if (updateError) throw updateError

      setContent(nextContent)
      setNotice(`${imageLabels[kind]} berhasil diunggah.`)
    } catch (error) {
      console.error("Business Profile image upload failed:", error)
      setNotice(getErrorMessage(error, "Gagal mengunggah gambar."))
    } finally {
      setUploading(null)
    }
  }

  async function submitForReview() {
    if (!slug.trim()) {
      setNotice("Alamat subdomain wajib diisi.")
      return
    }

    if (!/^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/.test(slug)) {
      setNotice("Slug harus 2–40 karakter, huruf kecil, angka, atau tanda hubung.")
      return
    }

    const id = await saveDraft()
    if (!id) return

    setBusy(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.rpc("submit_landing_page", {
        p_page_id: id,
      })

      if (error) throw error

      setNotice("Website berhasil diajukan untuk pemeriksaan Admin.")
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Business Profile submission failed:", error)
      setNotice(getErrorMessage(error, "Gagal mengajukan website."))
    } finally {
      setBusy(false)
    }
  }

  function imageUploadField(kind: ImageKind) {
    const imageUrl = content.images[kind]

    return (
      <div className="bp-upload-card" key={kind}>
        <div className="bp-upload-heading">
          <div>
            <strong>{imageLabels[kind]}</strong>
            <small>JPG, PNG, WebP · Maksimal 5 MB</small>
          </div>
          {imageUrl && <span className="bp-upload-done">Tersimpan</span>}
        </div>

        {imageUrl && (
          <div className={`bp-upload-preview bp-image-${kind}`}>
            <img src={imageUrl} alt={`Preview ${imageLabels[kind]}`} />
          </div>
        )}

        <label className="bp-file-button">
          {uploading === kind ? "Mengunggah..." : imageUrl ? "Ganti Gambar" : "Pilih Gambar"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy || uploading !== null}
            onChange={(event) => {
              const file = event.target.files?.[0]
              void uploadImage(kind, file)
              event.target.value = ""
            }}
          />
        </label>
      </div>
    )
  }

  return (
    <main className="bp-editor">
      <header className="bp-editor-header">
        <div>
          <a href="/dashboard" className="bp-back">← Kembali ke Dashboard</a>
          <span className="bp-editor-kicker">TPW-LP / WEBSITE EDITOR</span>
          <h1>Business <em>Profile.</em></h1>
          <p>Edit informasi bisnis Anda dan lihat hasilnya secara langsung.</p>
        </div>

        <div className="bp-editor-actions">
          <button disabled={busy || uploading !== null} onClick={saveDraft}>
            Simpan Draft
          </button>
          <button
            disabled={busy || uploading !== null}
            className="bp-submit"
            onClick={submitForReview}
          >
            Ajukan Pemeriksaan →
          </button>
        </div>
      </header>

      {notice && <div className="bp-notice" role="status">{notice}</div>}

      <div className="bp-editor-layout">
        <section className="bp-form">
          <section
            aria-labelledby="bp-domain-title"
            style={{
              border: "1px solid #f36f45",
              background: "linear-gradient(135deg, #241d19 0%, #171614 100%)",
              padding: "18px 18px 16px",
              marginBottom: 24,
              display: "grid",
              gap: 11,
              boxShadow: "0 8px 24px #00000024",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <span style={{ color: "#ff8058", fontSize: 10, letterSpacing: "0.16em", fontWeight: 700 }}>
                  DOMAIN WEBSITE
                </span>
                <h2 id="bp-domain-title" style={{ margin: "5px 0 0", color: "#f4eee5", fontSize: 20, fontWeight: 600 }}>
                  Pilih alamat website Anda
                </h2>
              </div>
              <span style={{ color: "#c9b8a9", fontSize: 10, border: "1px solid #ffffff28", padding: "5px 8px" }}>
                IDENTITAS UNIK
              </span>
            </div>

            <p style={{ color: "#bdb4aa", fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              Domain terpisah dari judul website dan nama bisnis. Gunakan kode subdomain otomatis 4 huruf atau pilih nama domain yang mudah diingat.
            </p>

            <div className="bp-slug-field" style={{ minHeight: 48 }}>
              <input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                aria-label="Subdomain website"
                aria-describedby="bp-slug-status"
                placeholder="contoh: nama-bisnis"
                style={{ fontSize: 15, fontWeight: 600, minHeight: 46 }}
              />
              <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>-lp.tpw.my.id</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <span style={{ color: "#a9a198", fontSize: 11 }}>Alamat lengkap</span>
              <strong style={{ color: "#f4eee5", fontSize: 12, overflowWrap: "anywhere" }}>
                {slug ? `${slug}-lp.tpw.my.id` : "Belum dipilih"}
              </strong>
            </div>

            <div
              id="bp-slug-status"
              aria-live="polite"
              style={{ display: "grid", gap: 8 }}
            >
              {slugCheckState === "checking" && (
                <small style={{ color: "#c9bfae" }}>Memeriksa ketersediaan domain...</small>
              )}
              {slugCheckState === "available" && (
                <small style={{ color: "#8fc392" }}>✓ Domain tersedia dan dapat digunakan.</small>
              )}
              {slugCheckState === "taken" && (
                <small style={{ color: "#ff9879" }}>Domain sudah digunakan. Pilih saran lain atau masukkan nama berbeda.</small>
              )}
              {slugCheckState === "invalid" && (
                <small style={{ color: "#e1bd79" }}>Gunakan 2–40 karakter: huruf kecil, angka, atau tanda hubung.</small>
              )}
              {slugCheckState === "error" && (
                <small style={{ color: "#e1bd79" }}>Status domain belum dapat diperiksa. Coba lagi sebentar.</small>
              )}

              {slugCheckState === "taken" && slugSuggestions.length > 0 && (
                <div
                  aria-label="Saran domain alternatif"
                  style={{ display: "grid", gap: 8 }}
                >
                  <div style={{ display: "grid", gap: 3 }}>
                    <strong style={{ color: "#f0d5c8", fontSize: 12 }}>
                      Saran domain alternatif
                    </strong>
                    <small style={{ color: "#9d958b", fontSize: 10 }}>
                      Ketuk salah satu alamat di bawah untuk menggunakannya.
                    </small>
                  </div>
                  <div style={{ display: "grid", gap: 7 }}>
                    {slugSuggestions.slice(0, 3).map((suggestion) => {
                      const selected = slug === suggestion
                      return (
                        <button
                          key={suggestion}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            setSlug(suggestion)
                            setNotice("")
                          }}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            width: "100%",
                            minHeight: 48,
                            padding: "11px 12px",
                            textAlign: "left",
                            background: selected ? "#30221b" : "#1d1d1a",
                            border: selected ? "1px solid #f36f45" : "1px solid #ffffff24",
                            color: "#eee9e1",
                            cursor: "pointer",
                            fontSize: 12,
                            touchAction: "manipulation",
                          }}
                        >
                          <span style={{ overflowWrap: "anywhere", lineHeight: 1.45 }}>
                            {suggestion}-lp.tpw.my.id
                          </span>
                          <span
                            aria-hidden="true"
                            style={{
                              color: selected ? "#ff956f" : "#8fc392",
                              fontSize: 11,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {selected ? "✓" : "Tersedia"}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <small style={{ color: "#8f887f", fontSize: 10 }}>
              Jika tidak ingin memilih nama sendiri, kode subdomain otomatis 4 huruf dapat digunakan sebagai alamat website.
            </small>
          </section>

          <div className="bp-form-heading">
            <span>01 / IDENTITAS BISNIS</span>
            <h2>Informasi Dasar</h2>
          </div>

          <label>Judul website</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={70}
          />

          <label>Nama bisnis</label>
          <input
            value={content.businessName}
            onChange={(e) => updateBusinessName(e.target.value)}
          />

          <label>Tagline</label>
          <input
            value={content.tagline}
            onChange={(e) => update("tagline", e.target.value)}
          />

          <label>Judul utama</label>
          <textarea
            rows={2}
            value={content.headline}
            onChange={(e) => update("headline", e.target.value)}
          />

          <label>Deskripsi pembuka</label>
          <textarea
            rows={4}
            value={content.introduction}
            onChange={(e) => update("introduction", e.target.value)}
          />

          <div className="bp-form-heading">
            <span>02 / PROFIL BISNIS</span>
            <h2>Tentang Bisnis</h2>
          </div>

          <label>Judul bagian</label>
          <input
            value={content.aboutTitle}
            onChange={(e) => update("aboutTitle", e.target.value)}
          />

          <label>Deskripsi bisnis</label>
          <textarea
            rows={5}
            value={content.about}
            onChange={(e) => update("about", e.target.value)}
          />

          <div className="bp-form-heading">
            <span>03 / PRODUK & LAYANAN</span>
            <h2>Layanan ({content.services.length}/3)</h2>
            <p>Mulai dari satu layanan. Anda dapat menambahkan hingga tiga.</p>
          </div>

          {content.services.map((service, index) => (
            <div className="bp-service-editor" key={index}>
              <div className="bp-service-editor-heading">
                <strong>Layanan {index + 1}</strong>
                {content.services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    aria-label={`Hapus layanan ${index + 1}`}
                    title="Hapus layanan"
                  >
                    − Hapus
                  </button>
                )}
              </div>

              <input
                value={service.title}
                onChange={(e) =>
                  updateService(index, "title", e.target.value)
                }
                placeholder="Nama layanan"
                aria-label={`Nama layanan ${index + 1}`}
              />

              <textarea
                rows={2}
                value={service.description}
                onChange={(e) =>
                  updateService(index, "description", e.target.value)
                }
                placeholder="Deskripsi layanan"
                aria-label={`Deskripsi layanan ${index + 1}`}
              />
            </div>
          ))}

          <button
            type="button"
            className="bp-add-service"
            disabled={content.services.length >= 3}
            onClick={addService}
          >
            + Tambah Layanan ({content.services.length}/3)
          </button>

          <div className="bp-form-heading">
            <span>04 / INFORMASI & KONTAK</span>
            <h2>Hubungi Bisnis</h2>
          </div>

          <label>Nomor untuk tombol Panggil</label>
          <input
            value={content.contact.phone}
            onChange={(e) => updateContact("phone", e.target.value)}
            placeholder="Nomor telepon bisnis"
          />

          <label>WhatsApp</label>
          <input
            value={content.contact.whatsapp}
            onChange={(e) => updateContact("whatsapp", e.target.value)}
            placeholder="08xxxxxxxxxx"
          />

          <label>Email</label>
          <input
            type="email"
            value={content.contact.email}
            onChange={(e) => updateContact("email", e.target.value)}
          />

          <label>Alamat bisnis</label>
          <textarea
            rows={3}
            value={content.contact.address}
            onChange={(e) => updateContact("address", e.target.value)}
          />

          <div className="bp-form-heading">
            <span>05 / LOKASI & PETA</span>
            <h2>Lokasi Bisnis</h2>
            <p>Opsional. Tampilkan titik lokasi tepat, cukup wilayah umum, atau sembunyikan peta.</p>
          </div>

          <div
            style={{
              border: "1px solid #ffffff24",
              background: "#171715",
              padding: 14,
              display: "grid",
              gap: 13,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <strong style={{ color: "#f1e9df", fontSize: 13 }}>Tampilkan Google Maps</strong>
                <small style={{ color: "#aaa198", fontSize: 11, lineHeight: 1.5 }}>Lokasi hanya ditampilkan jika fitur ini diaktifkan.</small>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={content.location.enabled}
                onClick={() => setLocationEnabled(!content.location.enabled)}
                style={{
                  minWidth: 76,
                  minHeight: 40,
                  padding: "7px 12px",
                  border: content.location.enabled ? "1px solid #86c391" : "1px solid #ffffff35",
                  background: content.location.enabled ? "#1d3b2b" : "#272522",
                  color: content.location.enabled ? "#a8e2b1" : "#c8c0b7",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  touchAction: "manipulation",
                }}
              >
                {content.location.enabled ? "ON" : "OFF"}
              </button>
            </div>

            {content.location.enabled && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  <button
                    type="button"
                    aria-pressed={content.location.mode === "pin"}
                    onClick={() => setLocationMode("pin")}
                    style={{
                      minHeight: 48,
                      padding: "9px 10px",
                      border: content.location.mode === "pin" ? "1px solid #f36f45" : "1px solid #ffffff24",
                      background: content.location.mode === "pin" ? "#30221b" : "#20201d",
                      color: "#f1e9df",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      touchAction: "manipulation",
                    }}
                  >
                    Pin Lokasi
                  </button>
                  <button
                    type="button"
                    aria-pressed={content.location.mode === "area"}
                    onClick={() => setLocationMode("area")}
                    style={{
                      minHeight: 48,
                      padding: "9px 10px",
                      border: content.location.mode === "area" ? "1px solid #f36f45" : "1px solid #ffffff24",
                      background: content.location.mode === "area" ? "#30221b" : "#20201d",
                      color: "#f1e9df",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      touchAction: "manipulation",
                    }}
                  >
                    Area Umum
                  </button>
                </div>

                {content.location.mode === "pin" ? (
                  <div style={{ display: "grid", gap: 7 }}>
                    <label htmlFor="bp-google-maps-pin">Link pin Google Maps</label>
                    <input
                      id="bp-google-maps-pin"
                      type="url"
                      value={content.location.googleMapsUrl}
                      onChange={(e) => updateLocationField("googleMapsUrl", e.target.value)}
                      placeholder="https://maps.app.goo.gl/..."
                    />
                    <small style={{ color: "#aaa198", fontSize: 11, lineHeight: 1.6 }}>
                      Di Google Maps HP: cari tempat atau jatuhkan pin → Bagikan → Salin link → tempel di sini. Mode ini menampilkan lokasi tepat.
                    </small>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 7 }}>
                    <label htmlFor="bp-google-maps-area">Kota / Kabupaten / Wilayah</label>
                    <input
                      id="bp-google-maps-area"
                      type="text"
                      value={content.location.areaName}
                      onChange={(e) => updateLocationField("areaName", e.target.value)}
                      placeholder="Contoh: Sukabumi, Jawa Barat"
                      maxLength={120}
                    />
                    <small style={{ color: "#aaa198", fontSize: 11, lineHeight: 1.6 }}>
                      Peta hanya diarahkan ke wilayah umum. Link pin dan koordinat tidak disimpan dalam konten website pada mode ini.
                    </small>
                    <small style={{ color: "#d9b77c", fontSize: 10, lineHeight: 1.5 }}>
                      Periksa juga kolom Alamat Bisnis di atas. Jangan isi alamat jalan atau nomor rumah jika Anda hanya ingin membagikan wilayah umum.
                    </small>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bp-form-heading">
            <span>06 / MEDIA SOSIAL</span>
            <h2>Media Sosial</h2>
            <p>Masukkan tautan profil atau channel bisnis Anda. Ikon hanya muncul untuk akun yang diisi.</p>
          </div>

          <details
            style={{
              margin: "0 0 18px",
              border: "1px solid #ffffff24",
              background: "#171715",
              padding: "12px 14px",
            }}
          >
            <summary
              style={{
                color: "#ff956f",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                touchAction: "manipulation",
                minHeight: 28,
                display: "flex",
                alignItems: "center",
              }}
            >
              Bantuan: cara menyalin tautan profil dari HP
            </summary>
            <div style={{ display: "grid", gap: 12, paddingTop: 12 }}>
              <p style={{ margin: 0, color: "#c8c0b7", fontSize: 11, lineHeight: 1.7 }}>
                Caranya sama untuk semua aplikasi: buka akun yang ingin ditampilkan, masuk ke halaman profil atau channel, pilih Bagikan/Share, lalu Salin Tautan/Copy Link. Kembali ke TPW-LP, ketuk kolom yang sesuai, tahan sebentar, lalu pilih Tempel/Paste.
              </p>

              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <strong style={{ color: "#f1e9df", fontSize: 12 }}>Instagram</strong>
                  <span style={{ color: "#aaa198", fontSize: 11, lineHeight: 1.6 }}>
                    Buka Profil → Bagikan Profil → Salin Tautan. Jika menu berbeda, buka profil Anda lalu gunakan ikon Bagikan.
                  </span>
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <strong style={{ color: "#f1e9df", fontSize: 12 }}>Facebook</strong>
                  <span style={{ color: "#aaa198", fontSize: 11, lineHeight: 1.6 }}>
                    Buka profil atau Halaman bisnis → Bagikan Profil/Halaman atau menu ⋯ → Salin Tautan.
                  </span>
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <strong style={{ color: "#f1e9df", fontSize: 12 }}>YouTube</strong>
                  <span style={{ color: "#aaa198", fontSize: 11, lineHeight: 1.6 }}>
                    Buka channel Anda → Bagikan → Salin Link.
                  </span>
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <strong style={{ color: "#f1e9df", fontSize: 12 }}>TikTok</strong>
                  <span style={{ color: "#aaa198", fontSize: 11, lineHeight: 1.6 }}>
                    Buka Profil → Bagikan Profil → Salin Tautan.
                  </span>
                </div>
              </div>

              <div
                style={{
                  borderLeft: "2px solid #f36f45",
                  padding: "8px 10px",
                  background: "#211b17",
                }}
              >
                <strong style={{ display: "block", color: "#ffb18f", fontSize: 11, marginBottom: 4 }}>
                  Pastikan tautannya benar
                </strong>
                <span style={{ color: "#c8c0b7", fontSize: 11, lineHeight: 1.6 }}>
                  Gunakan tautan profil, Halaman bisnis, atau channel—bukan tautan satu postingan, foto, Reel, atau video. Tautan postingan memang punya ID sendiri, tetapi bukan alamat akun utama yang ingin ditampilkan di website.
                </span>
              </div>
              <small style={{ color: "#898178", fontSize: 10, lineHeight: 1.5 }}>
                Nama dan letak menu dapat berubah mengikuti versi aplikasi. Cari pilihan Bagikan Profil/Share Profile atau Salin Tautan/Copy Link.
              </small>
            </div>
          </details>

          <label>Facebook</label>
          <input
            value={content.social.facebook}
            onChange={(e) => updateSocial("facebook", e.target.value)}
            placeholder="https://facebook.com/akun"
          />

          <label>Instagram</label>
          <input
            value={content.social.instagram}
            onChange={(e) => updateSocial("instagram", e.target.value)}
            placeholder="https://instagram.com/akun"
          />

          <label>YouTube</label>
          <input
            value={content.social.youtube}
            onChange={(e) => updateSocial("youtube", e.target.value)}
            placeholder="https://youtube.com/@akun"
          />

          <label>TikTok</label>
          <input
            value={content.social.tiktok}
            onChange={(e) => updateSocial("tiktok", e.target.value)}
            placeholder="https://tiktok.com/@akun"
          />

          <div className="bp-form-heading">
            <span>07 / GAMBAR WEBSITE</span>
            <h2>Upload Gambar</h2>
            <p>Tiga jenis gambar untuk melengkapi identitas website Anda.</p>
          </div>

          {imageUploadField("logo")}
          {imageUploadField("product")}
          {imageUploadField("background")}

          <div className="bp-form-heading">
            <span>08 / IDENTITAS VISUAL</span>
            <h2>Warna Website</h2>
          </div>

          <div className="bp-color-row">
            <label>
              Warna utama
              <input
                type="color"
                value={content.theme.primary}
                onChange={(e) => updateTheme("primary", e.target.value)}
              />
            </label>
            <label>
              Warna aksen
              <input
                type="color"
                value={content.theme.accent}
                onChange={(e) => updateTheme("accent", e.target.value)}
              />
            </label>
          </div>

          <div className="bp-editor-actions bp-editor-actions-bottom">
            <button disabled={busy || uploading !== null} onClick={saveDraft}>
              Simpan Draft
            </button>
            <button
              disabled={busy || uploading !== null}
              className="bp-submit"
              onClick={submitForReview}
            >
              Ajukan Pemeriksaan →
            </button>
          </div>
        </section>

        <section className="bp-preview">
          <div className="bp-preview-bar">
            <span>LIVE PREVIEW</span>
            <span>
              {slug ? `${slug}-lp.tpw.my.id` : "Preview website"}
            </span>
          </div>
          <BusinessProfileTemplate
            content={content as unknown as Record<string, unknown>}
          />
        </section>
      </div>
    </main>
  )
}
