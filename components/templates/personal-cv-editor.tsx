"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import PersonalCVTemplate from "./personal-cv"
import type { TemplateContent } from "@/lib/templates/registry"

type Experience = { position: string; company: string; period: string; description: string }
type Education = { institution: string; degree: string; period: string }
type CV = {
  fullName: string
  profession: string
  headline: string
  biography: string
  photo: string
  skills: string[]
  experiences: Experience[]
  education: Education[]
  contact: { email: string; phone: string; linkedin: string }
  theme: { primary: string; accent: string }
}

type Page = { id: string; title: string; slug: string | null; status: string; content: Record<string, unknown> }

const defaults: CV = {
  fullName: "Nama Lengkap",
  profession: "Profesi Anda",
  headline: "Tuliskan kalimat perkenalan profesional Anda.",
  biography: "Ceritakan diri dan perjalanan profesional Anda.",
  photo: "",
  skills: ["Komunikasi", "Kerja Tim"],
  experiences: [{ position: "Posisi Pekerjaan", company: "Nama Perusahaan", period: "2024 - Sekarang", description: "Jelaskan tanggung jawab dan pencapaian." }],
  education: [{ institution: "Nama Institusi", degree: "Pendidikan", period: "2020 - 2024" }],
  contact: { email: "", phone: "", linkedin: "" },
  theme: { primary: "#172c4b", accent: "#c69b55" },
}

const inputStyle = { width: "100%", padding: 11, background: "#10100f", color: "#f4eee6", border: "1px solid #48443e", marginTop: 6, boxSizing: "border-box" as const }
const labelStyle = { display: "block", color: "#c1b8ad", fontSize: 12, marginTop: 13 }

export default function PersonalCVEditor({ userId, initialPage = null, newPageId = "", newPageSlug = "" }: {
  userId: string; initialPage?: Page | null; newPageId?: string; newPageSlug?: string
}) {
  const router = useRouter()
  const [content, setContent] = useState<CV>(() => {
    const saved = initialPage?.content as Partial<CV> | undefined
    return {
      ...defaults, ...saved,
      contact: { ...defaults.contact, ...saved?.contact },
      theme: { ...defaults.theme, ...saved?.theme },
      skills: saved?.skills || defaults.skills,
      experiences: saved?.experiences || defaults.experiences,
      education: saved?.education || defaults.education,
    }
  })
  const [title, setTitle] = useState(initialPage?.title || defaults.fullName)
  const [slug, setSlug] = useState(initialPage?.slug || newPageSlug || newPageId || "")
  const [pageId, setPageId] = useState(initialPage?.id || newPageId || "")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (pageId && window.location.pathname === "/dashboard/editor/new") {
      window.history.replaceState(null, "", `/dashboard/editor/${pageId}`)
    }
  }, [pageId])

  useEffect(() => {
    if (!slug) return
    const timer = window.setTimeout(async () => {
      const { data, error } = await createClient().rpc("check_landing_page_slug_availability", {
        p_slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "").slice(0, 40),
        p_exclude_page_id: pageId || null,
      })
      if (error) setNotice(`Pemeriksaan domain gagal: ${error.message}`)
      else {
        const result = Array.isArray(data) ? data[0] : data
        setNotice(result?.is_available ? "Domain tersedia." : "Domain belum tersedia.")
      }
    }, 500)
    return () => window.clearTimeout(timer)
  }, [slug, pageId])

  function update<K extends keyof CV>(key: K, value: CV[K]) {
    setContent(current => ({ ...current, [key]: value }))
  }

  async function saveDraft(): Promise<string | null> {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "").slice(0, 40)
    if (!title.trim() || !/^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/.test(cleanSlug)) {
      setNotice("Judul dan alamat website 2–40 karakter wajib valid.")
      return null
    }
    setBusy(true)
    try {
      const supabase = createClient()
      const { data: check, error: checkError } = await supabase.rpc("check_landing_page_slug_availability", {
        p_slug: cleanSlug, p_exclude_page_id: pageId || null,
      })
      if (checkError) throw checkError
      const availability = Array.isArray(check) ? check[0] : check
      if (!availability?.is_available) throw new Error("Alamat website sudah digunakan atau belum tersedia.")

      const payload = { title: title.trim(), slug: cleanSlug, content: content as unknown as TemplateContent }
      if (pageId) {
        const { data, error } = await supabase.from("landing_pages").update(payload)
          .eq("id", pageId).eq("owner_id", userId).is("deleted_at", null).select("id").maybeSingle()
        if (error) throw error
        if (!data) throw new Error("Draft tidak ditemukan atau tidak dapat diedit.")
      } else {
        const { data, error } = await supabase.from("landing_pages").insert({
          ...payload, owner_id: userId, template_key: "personal-cv", status: "draft", domain_type: "lp",
          ...(newPageId ? { id: newPageId } : {}),
        }).select("id").single()
        if (error) throw error
        if (!data?.id) throw new Error("ID draft tidak diterima.")
        setPageId(data.id)
        window.history.replaceState(null, "", `/dashboard/editor/${data.id}`)
      }
      setNotice("Draft Personal CV berhasil disimpan.")
      return pageId || (await supabase.from("landing_pages").select("id").eq("owner_id", userId).eq("slug", cleanSlug).single()).data?.id || null
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal menyimpan draft.")
      return null
    } finally {
      setBusy(false)
    }
  }

  async function uploadPhoto(file?: File) {
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setNotice("Foto harus JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.")
      return
    }
    const id = await saveDraft()
    if (!id) return
    setBusy(true)
    try {
      const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp"
      const path = `${userId}/${id}/cv-photo-${Date.now()}.${ext}`
      const supabase = createClient()
      const { error } = await supabase.storage.from("website-assets").upload(path, file, { upsert: false, contentType: file.type })
      if (error) throw error
      const { data } = supabase.storage.from("website-assets").getPublicUrl(path)
      const next = { ...content, photo: data.publicUrl }
      const { error: updateError } = await supabase.from("landing_pages").update({ content: next }).eq("id", id).eq("owner_id", userId)
      if (updateError) throw updateError
      setContent(next)
      setNotice("Foto profil berhasil diunggah.")
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal mengunggah foto.")
    } finally { setBusy(false) }
  }

  async function submit() {
    const id = await saveDraft()
    if (!id) return
    setBusy(true)
    try {
      const { error } = await createClient().rpc("submit_landing_page", { p_page_id: id })
      if (error) throw error
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal mengajukan pemeriksaan.")
    } finally { setBusy(false) }
  }

  return <main className="bp-editor">
    <header className="bp-editor-header">
      <div>
        <a href="/dashboard" className="bp-back">← Kembali ke Dashboard</a>
        <span className="bp-editor-kicker">TPW-LP / PERSONAL CV</span>
        <h1>Personal <em>CV.</em></h1>
        <p>Bangun profil profesional dan tampilkan pengalaman Anda.</p>
      </div>
      <div className="bp-editor-actions">
        <button disabled={busy} onClick={saveDraft}>Simpan Draft</button>
        <button className="bp-submit" disabled={busy} onClick={submit}>Ajukan Pemeriksaan →</button>
      </div>
    </header>

    {notice && <div className="bp-notice" role="status">{notice}</div>}

    <div className="bp-editor-layout">
      <section className="bp-form">
        <div className="bp-form-heading"><span>01 / IDENTITAS</span><h2>Profil Profesional</h2></div>
        <label style={labelStyle}>Judul website<input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} /></label>
        <label style={labelStyle}>Alamat subdomain<input style={inputStyle} value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /></label>
        <small>{slug || "alamat"}-lp.tpw.my.id</small>
        <label style={labelStyle}>Nama lengkap<input style={inputStyle} value={content.fullName} onChange={e => update("fullName", e.target.value)} /></label>
        <label style={labelStyle}>Profesi<input style={inputStyle} value={content.profession} onChange={e => update("profession", e.target.value)} /></label>
        <label style={labelStyle}>Headline<textarea style={inputStyle} rows={2} value={content.headline} onChange={e => update("headline", e.target.value)} /></label>
        <label style={labelStyle}>Foto profil<input style={inputStyle} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { void uploadPhoto(e.target.files?.[0]); e.target.value = "" }} /></label>
        {content.photo && <img src={content.photo} alt="Foto profil" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover" }} />}
        <label style={labelStyle}>Tentang saya<textarea style={inputStyle} rows={5} value={content.biography} onChange={e => update("biography", e.target.value)} /></label>

        <div className="bp-form-heading"><span>02 / KEAHLIAN</span><h2>Skills</h2></div>
        {content.skills.map((skill, i) => <div key={i} style={{ display: "flex", gap: 6 }}>
          <input style={inputStyle} value={skill} onChange={e => update("skills", content.skills.map((v, n) => n === i ? e.target.value : v))} />
          <button type="button" onClick={() => update("skills", content.skills.filter((_, n) => n !== i))}>Hapus</button>
        </div>)}
        <button type="button" onClick={() => update("skills", [...content.skills, "Keahlian baru"])}>+ Tambah Keahlian</button>

        <div className="bp-form-heading"><span>03 / PENGALAMAN</span><h2>Pengalaman Kerja</h2></div>
        {content.experiences.map((item, i) => <div key={i} className="bp-service-editor">
          <strong>Pengalaman {i + 1}</strong>
          {(["position", "company", "period", "description"] as const).map(key => <label key={key} style={labelStyle}>{({ position: "Posisi", company: "Perusahaan", period: "Periode", description: "Deskripsi" })[key]}
            {key === "description" ? <textarea style={inputStyle} rows={3} value={item[key]} onChange={e => update("experiences", content.experiences.map((v, n) => n === i ? { ...v, [key]: e.target.value } : v))} /> :
              <input style={inputStyle} value={item[key]} onChange={e => update("experiences", content.experiences.map((v, n) => n === i ? { ...v, [key]: e.target.value } : v))} />}
          </label>)}
          <button type="button" onClick={() => update("experiences", content.experiences.filter((_, n) => n !== i))}>Hapus pengalaman</button>
        </div>)}
        <button type="button" onClick={() => update("experiences", [...content.experiences, { position: "", company: "", period: "", description: "" }])}>+ Tambah Pengalaman</button>

        <div className="bp-form-heading"><span>04 / PENDIDIKAN</span><h2>Riwayat Pendidikan</h2></div>
        {content.education.map((item, i) => <div key={i} className="bp-service-editor">
          {(["institution", "degree", "period"] as const).map(key => <label key={key} style={labelStyle}>{({ institution: "Institusi", degree: "Jenjang / Jurusan", period: "Periode" })[key]}
            <input style={inputStyle} value={item[key]} onChange={e => update("education", content.education.map((v, n) => n === i ? { ...v, [key]: e.target.value } : v))} />
          </label>)}
          <button type="button" onClick={() => update("education", content.education.filter((_, n) => n !== i))}>Hapus pendidikan</button>
        </div>)}
        <button type="button" onClick={() => update("education", [...content.education, { institution: "", degree: "", period: "" }])}>+ Tambah Pendidikan</button>

        <div className="bp-form-heading"><span>05 / KONTAK</span><h2>Hubungi Saya</h2></div>
        {(["email", "phone", "linkedin"] as const).map(key => <label key={key} style={labelStyle}>{key === "email" ? "Email" : key === "phone" ? "Nomor Telepon" : "LinkedIn URL"}
          <input style={inputStyle} value={content.contact[key]} onChange={e => update("contact", { ...content.contact, [key]: e.target.value })} />
        </label>)}

        <div className="bp-form-heading"><span>06 / TAMPILAN</span><h2>Warna Website</h2></div>
        <label style={labelStyle}>Warna utama<input type="color" value={content.theme.primary} onChange={e => update("theme", { ...content.theme, primary: e.target.value })} /></label>
        <label style={labelStyle}>Warna aksen<input type="color" value={content.theme.accent} onChange={e => update("theme", { ...content.theme, accent: e.target.value })} /></label>

        <div className="bp-editor-actions">
          <button disabled={busy} onClick={saveDraft}>Simpan Draft</button>
          <button className="bp-submit" disabled={busy} onClick={submit}>Ajukan Pemeriksaan →</button>
        </div>
      </section>

      <section className="bp-preview">
        <div className="bp-preview-bar"><span>LIVE PREVIEW</span><span>{slug}-lp.tpw.my.id</span></div>
        <PersonalCVTemplate content={content as unknown as Record<string, unknown>} />
      </section>
    </div>
  </main>
}
