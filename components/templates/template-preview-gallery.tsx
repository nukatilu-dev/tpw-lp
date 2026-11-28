"use client"

import { useState } from "react"
import UniversalRenderer from "@/components/templates/universal-renderer"
import { createTemplateContent, type TemplateKey } from "@/lib/templates/registry"
import { toUniversalDocument } from "@/lib/templates/universal"
import { applyThemePreset, THEME_PRESETS, type ThemeKey } from "@/lib/templates/themes"

const GUIDE_KEYS: TemplateKey[] = [
  "business-profile",
  "personal-cv",
  "digital-menu",
  "product-catalog",
  "creative-portfolio",
]

const GUIDE_NAMES: Record<TemplateKey, string> = {
  "business-profile": "TPW Tahu Hejo",
  "personal-cv": "Leeloo TPW",
  "digital-menu": "Kedai Kopi TPW",
  "product-catalog": "Katalog Produk TPW",
  "creative-portfolio": "Kreatif Sendiri TPW",
}

const GUIDE_DESCRIPTIONS: Record<TemplateKey, string> = {
  "business-profile": "Website profil usaha, layanan, dan informasi kontak.",
  "personal-cv": "Website profil personal, pengalaman, dan portofolio diri.",
  "digital-menu": "Menu digital untuk kedai, restoran, dan usaha kuliner.",
  "product-catalog": "Katalog produk dengan kategori, foto, dan informasi harga.",
  "creative-portfolio": "Ruang untuk menampilkan karya dan proyek kreatif.",
}

const DEFAULT_THEMES: Record<TemplateKey, ThemeKey> = {
  "business-profile": "botanical",
  "personal-cv": "expedition",
  "digital-menu": "coffeehouse",
  "product-catalog": "showcase",
  "creative-portfolio": "editorial",
}

export function makeGuideContent(key: TemplateKey): Record<string, unknown> {
  const content = createTemplateContent(key) as Record<string, unknown>

  switch (key) {
    case "business-profile":
      Object.assign(content, {
        businessName: "TPW Tahu Hejo",
        tagline: "Tahu segar, pilihan keluarga.",
        headline: "Rasa segar dari Tahu Hejo",
        introduction: "Contoh profil usaha TPW. Ceritakan usaha, tampilkan produk, dan mudahkan pelanggan menghubungi Anda.",
        aboutTitle: "Tentang Tahu Hejo",
        about: "Tahu Hejo adalah contoh usaha kuliner yang menampilkan identitas bisnis, keunggulan produk, galeri, dan informasi pemesanan.",
        services: [
          { title: "Tahu Hejo", description: "Produk tahu segar untuk kebutuhan sehari-hari." },
          { title: "Produk Olahan", description: "Inspirasi produk olahan berbahan kedelai." },
        ],
        contact: { phone: "0812 0000 0000", whatsapp: "0812 0000 0000", email: "halo@tpw.my.id", address: "Sukabumi, Jawa Barat" },
        social: { instagram: "https://instagram.com/", facebook: "https://facebook.com/" },
      })
      break

    case "personal-cv":
      Object.assign(content, {
        fullName: "Leeloo TPW",
        profession: "Virtual Artist · Adventure Explorer",
        headline: "Beyond the ordinary. Into every adventure.",
        biography: "Saya Leeloo, virtual artist dengan jiwa penjelajah. Saya menyukai alam terbuka, perjalanan, tantangan, dan cerita tentang orang-orang yang bergerak membawa perubahan.",
        photo: "/template-guides/leeloo/leeloo-profile-adventure.png",
        officePhoto: "/template-guides/leeloo/leeloo-office-planning.png",
        gallery: [
          "/template-guides/leeloo/leeloo-profile-adventure.png",
          "/template-guides/leeloo/leeloo-office-planning.png",
          "/template-guides/leeloo/leeloo-field-briefing.png",
        ],
        skills: ["Adventure & Exploration", "Field Coordination", "Storytelling", "Creative Direction"],
        experiences: [
          { position: "Virtual Artist & Adventure Explorer", company: "TPW", period: "2026 - Sekarang", description: "Mengeksplorasi alam, membangun cerita visual, dan mengangkat tema petualangan serta misi sosial." },
          { position: "Field Operations Briefing", company: "Social Mission — Karhutla", period: "Project Showcase", description: "Visualisasi karakter pemimpin briefing dan koordinasi petugas lapangan dalam misi penyelamatan." },
        ],
        education: [
          { institution: "Leeloo Virtual Character Universe", degree: "Creative Identity & Exploration", period: "Ongoing" },
        ],
        contact: { email: "hello@tpw.my.id" },
      })
      break

    case "digital-menu":
      Object.assign(content, {
        restaurantName: "Kedai Kopi TPW",
        tagline: "Tempat singgah, rasa istimewa.",
        introduction: "Pilih kopi dan teman santai favorit Anda.",
        categories: [
          {
            name: "Kopi",
            items: [
              {
                name: "Kopi Susu",
                description: "Espresso dan susu dengan rasa seimbang.",
                price: 18000,
                image: "",
              },
              {
                name: "Americano",
                description: "Kopi hitam dengan karakter kuat.",
                price: 15000,
                image: "",
              },
            ],
          },
          {
            name: "Non-Kopi",
            items: [
              {
                name: "Cokelat",
                description: "Minuman cokelat hangat atau dingin.",
                price: 17000,
                image: "",
              },
            ],
          },
        ],
        contact: { whatsapp: "0812 0000 0000", address: "Sukabumi, Jawa Barat" },
      })
      break

    case "product-catalog":
      Object.assign(content, {
        brandName: "Katalog Produk TPW",
        tagline: "Temukan produk pilihan Anda.",
        introduction: "Contoh katalog produk dengan kategori, foto, deskripsi, dan harga.",
        categories: ["Makanan", "Minuman", "Produk Pilihan"],
        products: [
          { name: "Tahu Hejo", description: "Tahu segar khas TPW.", price: 12000, image: "", category: "Makanan" },
          { name: "Susu Kedelai", description: "Minuman kedelai siap dinikmati.", price: 10000, image: "", category: "Minuman" },
          { name: "Paket Hemat", description: "Pilihan produk untuk keluarga.", price: 25000, image: "", category: "Produk Pilihan" },
        ],
        contact: { whatsapp: "0812 0000 0000", email: "order@tpw.my.id" },
      })
      break

    case "creative-portfolio":
      Object.assign(content, {
        creatorName: "Kreatif Sendiri TPW",
        profession: "Creative Studio",
        tagline: "Ide menjadi karya.",
        biography: "Ruang untuk menampilkan karya, proyek, eksperimen, dan cerita kreatif Anda.",
        projects: [
          { title: "Brand Identity", category: "Design", description: "Eksplorasi identitas visual sebuah brand.", image: "" },
          { title: "Digital Campaign", category: "Creative", description: "Konsep kampanye digital dan konten.", image: "" },
        ],
        contact: { email: "creative@tpw.my.id", instagram: "https://instagram.com/" },
      })
      break
  }

  return content
}

export default function TemplatePreviewGallery() {
  const [selectedThemes, setSelectedThemes] = useState<Record<TemplateKey, ThemeKey>>(DEFAULT_THEMES)
  const [selectedGuide, setSelectedGuide] = useState<TemplateKey | null>(null)

  function changeTheme(templateKey: TemplateKey, themeKey: ThemeKey) {
    setSelectedThemes((current) => ({ ...current, [templateKey]: themeKey }))
  }

  function useSelectedGuide() {
    if (!selectedGuide) return
    // The new universal draft-creation route will consume this guide key.
    window.location.assign(`/dashboard/editor/new?guide=${selectedGuide}&theme=${selectedThemes[selectedGuide]}`)
  }

  return (
    <main style={{ minHeight: "100vh", padding: "32px 20px 56px", background: "#101114", color: "#f4f4f5" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ marginBottom: 24 }}>
          <p style={{ color: "#a1a1aa", margin: "0 0 8px" }}>TPW-LP · WEBSITE GUIDE</p>
          <h1 style={{ fontSize: 32, margin: "0 0 8px" }}>Website seperti apa yang ingin Anda buat?</h1>
          <p style={{ color: "#a1a1aa", margin: 0 }}>
            Pilih contoh yang paling mendekati kebutuhan Anda. Semua isi dan tampilannya dapat disesuaikan nanti.
          </p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 22 }}>
          {GUIDE_KEYS.map((key) => {
            const content = makeGuideContent(key)
            const document = toUniversalDocument(key, content)
            const themeKey = selectedThemes[key]
            document.themeKey = themeKey
            document.theme = applyThemePreset(themeKey, document.theme)
            const activeTheme = THEME_PRESETS.find((theme) => theme.key === themeKey)
            const isSelected = selectedGuide === key

            return (
              <section
                key={key}
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  border: isSelected ? "2px solid #8bba72" : "1px solid #34363d",
                  borderRadius: 14,
                  background: "#202127",
                  boxShadow: isSelected ? "0 0 0 2px #8bba7233" : "none",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedGuide(key)}
                  aria-pressed={isSelected}
                  style={{
                    width: "100%",
                    padding: "15px 17px",
                    border: 0,
                    background: "transparent",
                    color: "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ display: "block", color: "#a1a1aa", fontSize: 11, marginBottom: 5 }}>
                    {isSelected ? "GUIDE DIPILIH" : "PILIH GUIDE"}
                  </span>
                  <strong style={{ display: "block", fontSize: 18 }}>{GUIDE_NAMES[key]}</strong>
                  <span style={{ display: "block", color: "#b8bac3", fontSize: 13, marginTop: 5 }}>
                    {GUIDE_DESCRIPTIONS[key]}
                  </span>
                </button>

                <div style={{ padding: "0 12px 12px", background: "#fff", color: "#222" }}>
                  <div style={{ overflow: "hidden", borderRadius: 8, maxHeight: 360, pointerEvents: "none" }}>
                    <UniversalRenderer document={document} />
                  </div>
                </div>

                <div style={{ padding: "12px 15px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#d4d4d8", fontSize: 12 }}>
                    <span>Gaya visual</span>
                    <select
                      value={themeKey}
                      onChange={(event) => changeTheme(key, event.target.value as ThemeKey)}
                      onClick={(event) => event.stopPropagation()}
                      style={{ minWidth: 135, padding: "8px 9px", borderRadius: 8, border: "1px solid #555", background: "#303139", color: "#fff" }}
                    >
                      {THEME_PRESETS.map((theme) => (
                        <option key={theme.key} value={theme.key}>{theme.name}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectedGuide(key)}
                    style={{
                      padding: "8px 13px",
                      borderRadius: 8,
                      border: isSelected ? "1px solid #8bba72" : "1px solid #555",
                      background: isSelected ? "#31452b" : "#303139",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {isSelected ? "Terpilih" : "Gunakan Guide"}
                  </button>
                </div>
                {activeTheme && (
                  <div style={{ padding: "7px 15px", background: activeTheme.theme.primary, color: "#fff", fontSize: 11 }}>
                    {activeTheme.description}
                  </div>
                )}
              </section>
            )
          })}
        </div>

        <div style={{ position: "sticky", bottom: 12, marginTop: 24, padding: 14, border: "1px solid #454750", borderRadius: 12, background: "#25272e", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div>
            <strong>{selectedGuide ? `Pilihan: ${GUIDE_NAMES[selectedGuide]}` : "Belum ada Guide dipilih"}</strong>
            <p style={{ margin: "4px 0 0", color: "#a1a1aa", fontSize: 12 }}>
              {selectedGuide ? "Lanjutkan untuk mulai menyesuaikan website Anda." : "Pilih salah satu contoh website terlebih dahulu."}
            </p>
          </div>
          <button
            type="button"
            disabled={!selectedGuide}
            onClick={useSelectedGuide}
            style={{
              padding: "12px 18px",
              border: 0,
              borderRadius: 9,
              background: selectedGuide ? "#8bba72" : "#555",
              color: "#111",
              fontWeight: 700,
              cursor: selectedGuide ? "pointer" : "not-allowed",
            }}
          >
            Lanjutkan ke Editor →
          </button>
        </div>
      </div>
    </main>
  )
}
