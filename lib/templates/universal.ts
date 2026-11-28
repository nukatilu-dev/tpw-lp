import type { TemplateKey } from "./registry"

export type UniversalDocument = {
  version: 1
  templateKey: TemplateKey
  themeKey: string
  theme: UniversalTheme
  sections: UniversalSection[]
  imageFrames?: Record<string, { zoom: number; x: number; y: number }>
  businessProfileLayout?: BusinessProfileLayout
}

export type BusinessProfileLayout = "corporate-dark" | "clean-business" | "modern-teal"

export const BUSINESS_PROFILE_LAYOUTS: { key: BusinessProfileLayout; name: string; description: string }[] = [
  { key: "corporate-dark", name: "Corporate Dark", description: "Gelap, editorial, dengan aksen emas dan hero split." },
  { key: "clean-business", name: "Clean Business", description: "Putih dan lapang dengan hero foto lebar." },
  { key: "modern-teal", name: "Modern Teal", description: "Teal modern dengan hero asimetris dan kartu dinamis." },
]

export function isBusinessProfileLayout(value: unknown): value is BusinessProfileLayout {
  return value === "corporate-dark" || value === "clean-business" || value === "modern-teal"
}

export type UniversalSectionType =
  | "header" | "hero" | "about" | "services" | "products"
  | "skills" | "experience" | "education" | "gallery"
  | "contact" | "location" | "projects"

export type UniversalSection = {
  id: string
  type: UniversalSectionType
  visible: boolean
  layout: string
  content: Record<string, unknown>
}

export type UniversalTheme = {
  primary?: string
  accent?: string
  background?: string
  text?: string
  fontFamily?: string
  fontStyle?: string
  backgroundImage?: string
  backgroundOverlay?: string
  backgroundSize?: string
  backgroundPosition?: string
  backgroundRepeat?: string
  headerBackground?: string
  headerText?: string
}

type Data = Record<string, unknown>

function record(value: unknown): Data {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Data
    : {}
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function section(
  id: string,
  type: UniversalSectionType,
  content: Data,
  layout = "default",
): UniversalSection {
  return { id, type, visible: true, layout, content }
}

function themeFrom(data: Data): UniversalTheme {
  const meta = record(data._tpw)
  const theme = Object.keys(record(meta.theme)).length ? record(meta.theme) : record(data.theme)
  const images = record(data.images)
  return {
    primary: typeof theme.primary === "string" ? theme.primary : undefined,
    accent: typeof theme.accent === "string" ? theme.accent : undefined,
    background: typeof theme.background === "string" ? theme.background : undefined,
    text: typeof theme.text === "string" ? theme.text : undefined,
    fontFamily: typeof theme.fontFamily === "string" ? theme.fontFamily : undefined,
    backgroundImage: typeof theme.backgroundImage === "string"
      ? theme.backgroundImage
      : typeof images.background === "string" ? images.background : undefined,
    backgroundOverlay: typeof theme.backgroundOverlay === "string"
      ? theme.backgroundOverlay : undefined,
    backgroundSize: typeof theme.backgroundSize === "string" ? theme.backgroundSize : undefined,
    backgroundPosition: typeof theme.backgroundPosition === "string" ? theme.backgroundPosition : undefined,
    backgroundRepeat: typeof theme.backgroundRepeat === "string" ? theme.backgroundRepeat : undefined,
  }
}

export function toUniversalDocument(
  templateKey: TemplateKey,
  input: Record<string, unknown>,
): UniversalDocument {
  const data = record(input)
  const contact = record(data.contact)
  const images = record(data.images)
  const social = record(data.social)
  const meta = record(data._tpw)
  const sections: UniversalSection[] = []

  switch (templateKey) {
    case "business-profile": {
      const name = data.businessName || "Nama Bisnis Anda"
      sections.push(
        section("header", "header", { name, logo: images.logo || "", social }),
        section("hero", "hero", {
          title: data.headline || name,
          subtitle: data.tagline || "",
          introduction: data.introduction || "",
          image: images.hero || "",
        }),
        section("about", "about", {
          title: data.aboutTitle || "Tentang Kami",
          description: data.about || "",
        }),
        section("services", "services", { items: list(data.services).slice(0, 3) }),
        ...(list(data.products).length ? [section("products", "products", { mode: "catalog", items: list(data.products) })] : []),
        section("gallery", "gallery", {
          title: typeof data.galleryTitle === "string" ? data.galleryTitle : "Galeri",
          images: list(data.gallery).length ? list(data.gallery) : [images.product].filter(Boolean),
        }),
        section("contact", "contact", { ...contact, social }),
        ...(typeof data.youtubeUrl === "string" && data.youtubeUrl.trim() ? [section("video", "video" as UniversalSectionType, { url: data.youtubeUrl })] : []),
      )
      const location = record(data.location)
      const mapUrl = location.googleMapsUrl || location.mapUrl
      if ((typeof location.name === "string" && location.name.trim()) || (typeof location.address === "string" && location.address.trim()) || (typeof mapUrl === "string" && mapUrl.trim())) {
        sections.push(section("location", "location", {
          ...location,
          areaName: location.areaName || location.address || contact.address || "",
          googleMapsUrl: mapUrl || "",
        }))
      }
      break
    }

    case "personal-cv":
      sections.push(
        section("header", "header", {
          name: data.fullName || "Nama Lengkap",
          profession: data.profession || "",
          photo: data.photo || "",
        }),
        section("hero", "hero", {
          title: data.headline || "",
          subtitle: data.profession || "",
          image: data.officePhoto || "",
        }),
        section("about", "about", {
          title: "Tentang Saya",
          description: data.biography || "",
        }),
        section("skills", "skills", { items: list(data.skills) }),
        section("experience", "experience", { items: list(data.experiences) }),
        section("education", "education", { items: list(data.education) }),
        section("gallery", "gallery", {
          title: "Adventure, Leadership & Social Mission",
          images: list(data.gallery),
        }),
        section("contact", "contact", contact),
      )
      break

    case "digital-menu":
      sections.push(
        section("header", "header", { name: data.restaurantName || "Nama Restoran" }),
        section("hero", "hero", {
          title: data.restaurantName || "Nama Restoran",
          subtitle: data.tagline || "",
          introduction: data.introduction || "",
        }),
        section("products", "products", { mode: "menu", categories: list(data.categories) }),
        section("contact", "contact", contact),
      )
      break

    case "product-catalog":
      sections.push(
        section("header", "header", { name: data.brandName || "Nama Brand" }),
        section("hero", "hero", {
          title: data.brandName || "Nama Brand",
          subtitle: data.tagline || "",
          introduction: data.introduction || "",
        }),
        section("products", "products", {
          mode: "catalog",
          categories: list(data.categories),
          items: list(data.products),
        }),
        section("contact", "contact", contact),
      )
      break

    case "creative-portfolio":
      sections.push(
        section("header", "header", {
          name: data.creatorName || "Nama Kreator",
          profession: data.profession || "",
        }),
        section("hero", "hero", {
          title: data.creatorName || "Nama Kreator",
          subtitle: data.tagline || "",
          introduction: data.biography || "",
        }),
        section("projects", "projects", { items: list(data.projects) }),
        section("contact", "contact", contact),
      )
      break
  }

  return {
    version: 1,
    templateKey,
    themeKey: typeof meta.themeKey === "string" ? String(meta.themeKey) : "default",
    theme: themeFrom(data),
    sections,
    imageFrames: record(meta.imageFrames) as unknown as Record<string, { zoom: number; x: number; y: number }>,
    businessProfileLayout: isBusinessProfileLayout(meta.businessProfileLayout)
      ? meta.businessProfileLayout
      : "corporate-dark",
  }
}
