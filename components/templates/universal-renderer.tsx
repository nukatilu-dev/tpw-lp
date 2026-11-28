import type { CSSProperties, MouseEvent } from "react"
import type {
  UniversalDocument,
  UniversalSection,
} from "@/lib/templates/universal"

type Props = {
  document: UniversalDocument
  editable?: boolean
  onSelectField?: (path: string, label: string, kind?: "text" | "image") => void
}

function text(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function records(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is Record<string, unknown> =>
      item !== null && typeof item === "object" && !Array.isArray(item),
  )
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string" && !!item)
}

function formatPrice(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return ""
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function SectionContent({ section, editable = false, onSelectField, imageFrames = {} }: { section: UniversalSection; editable?: boolean; onSelectField?: Props["onSelectField"]; imageFrames?: NonNullable<UniversalDocument["imageFrames"]> }) {
  const frame = (path: string, fit: "cover" | "contain" = "cover") => {
    const value = imageFrames[path] || { zoom: 1, x: 50, y: 50 }
    // Crop is applied inside a fixed, overflow-hidden frame. object-position
    // controls the focal point; scale controls zoom without moving the frame.
    return {
      objectFit: fit,
      objectPosition: `${Math.max(0, Math.min(100, value.x ?? 50))}% ${Math.max(0, Math.min(100, value.y ?? 50))}%`,
      transform: fit === "contain" ? "none" : `scale(${Math.max(1, Math.min(3, value.zoom || 1))})`,
      transformOrigin: "center center",
    } as const
  }
  const edit = (
    path: string,
    label: string,
    kind: "text" | "image" = "text",
    baseClassName?: string,
  ) => {
    const className = [
      baseClassName,
      "tpw-editable-target",
    ].filter(Boolean).join(" ")

    return editable && onSelectField
      ? {
          onClick: (event: MouseEvent) => {
            event.stopPropagation()
            onSelectField(path, label, kind)
          },
          ...(className ? { className } : {}),
          title: `Klik untuk mengedit ${label}`,
        }
      : {}
  }
  const content = section.content

  switch (section.type) {
    case "header":
      return (
        <header id={`ue-section-${section.id}`} className="tpw-section-header" style={{ backgroundColor: "var(--tpw-header-background)", color: "var(--tpw-header-text)" }}>
          <div className="tpw-header-brand">
            {text(content.logo) ? <span className="tpw-header-logo-frame" {...edit("images.logo", "Logo bisnis", "image")}><img className="tpw-header-logo" src={text(content.logo)} alt="Logo bisnis" style={frame("images.logo", "contain")} /></span> : editable ? <button type="button" className="tpw-logo-placeholder" {...edit("images.logo", "Logo bisnis", "image")}>＋ Logo</button> : null}
            {text(content.photo) && <img className="tpw-header-avatar" src={text(content.photo)} alt="" />}
            <div>
              <strong {...edit("businessName", "Nama bisnis")}>{text(content.name)}</strong>
              {text(content.profession) && <span>{text(content.profession)}</span>}
            </div>
          </div>
          <nav className="tpw-header-nav" aria-label="Navigasi website">
            <a href="#ue-section-about">Tentang</a>
            <a href="#ue-section-services">Layanan</a>
            <a href="#ue-section-gallery">Galeri</a>
            <a href="#ue-section-contact">Kontak</a>
          </nav>
        </header>
      )

    case "hero":
      return (
        <section
          id={`ue-section-${section.id}`} className="tpw-section-hero"
          style={{ backgroundImage: "linear-gradient(110deg,var(--tpw-hero-overlay),var(--tpw-primary))" }}
        >
          <div className="tpw-hero-copy">
            <p className="tpw-hero-eyebrow">{text(content.eyebrow)}</p>
            <h1 {...edit("headline", "Headline")}>{text(content.title)}</h1>
            {text(content.subtitle) && <h2 {...edit("tagline", "Tagline")}>{text(content.subtitle)}</h2>}
            {text(content.introduction) && <p className="tpw-hero-intro" {...edit("introduction", "Deskripsi hero")}>{text(content.introduction)}</p>}
          </div>
          {text(content.image) ? (
            <span {...edit("images.background", "Foto utama", "image", "tpw-hero-image-frame")}><img className="tpw-hero-image tpw-editable-image" src={text(content.image)} alt="Foto utama" style={frame("images.background")} /></span>
          ) : editable ? (
            <button type="button" className="tpw-image-placeholder" {...edit("images.background", "Foto utama", "image")}>＋ Tambahkan foto utama</button>
          ) : null}
        </section>
      )

    case "about":
      return (
        <section id={`ue-section-${section.id}`} className="tpw-section tpw-about">
          <h2 {...edit("aboutTitle", "Judul tentang kami")}>{text(content.title) || "Tentang Kami"}</h2>
          <p {...edit("about", "Cerita bisnis")}>{text(content.description)}</p>
        </section>
      )

    case "services":
      return (
        <section id={`ue-section-${section.id}`} className="tpw-section">
          <h2>Layanan</h2>
          <div className="tpw-section-grid">
            {records(content.items).map((item, index) => (
              <article key={index} className="tpw-section-card">
                {text(item.image) && <div className="tpw-service-image-frame"><img src={text(item.image)} alt={text(item.title)} style={frame(`services.${index}.image`)} {...edit(`services.${index}.image`, `Foto layanan ${index + 1}`, "image")} /></div>}
                {editable && !text(item.image) && <button type="button" className="tpw-card-image-placeholder" {...edit(`services.${index}.image`, `Foto layanan ${index + 1}`, "image")}>＋ Foto layanan</button>}
                <h3 {...edit(`services.${index}.title`, `Nama layanan ${index + 1}`)}>{text(item.title)}</h3>
                {text(item.description) && <p {...edit(`services.${index}.description`, `Deskripsi layanan ${index + 1}`)}>{text(item.description)}</p>}
              </article>
            ))}
          </div>
        </section>
      )

    case "products":
      return (
        <section id={`ue-section-${section.id}`} className="tpw-section">
          <h2>{content.mode === "menu" ? "Menu Kami" : "Produk Kami"}</h2>
          <div className="tpw-section-grid">
            {records(content.items).map((item, index) => (
              <article key={index} className="tpw-section-card">
                {text(item.image) ? <div className="tpw-product-image-frame"><img src={text(item.image)} alt={text(item.name)} loading="lazy" style={frame(`products.${index}.image`)} {...edit(`products.${index}.image`, `Foto produk ${index + 1}`, "image")} /></div> : editable ? <button type="button" className="tpw-card-image-placeholder" {...edit(`products.${index}.image`, `Foto produk ${index + 1}`, "image")}>＋ Foto produk</button> : null}
                <h3>{text(item.name)}</h3>
                {text(item.description) && <p>{text(item.description)}</p>}
                {formatPrice(item.price) && <strong>{formatPrice(item.price)}</strong>}
              </article>
            ))}
            {records(content.categories).map((category, index) => (
              <article key={`category-${index}`} className="tpw-section-card">
                <h3>{text(category.name)}</h3>
                {records(category.items).map((item, itemIndex) => (
                  <div className="tpw-menu-item" key={itemIndex}>
                    <strong>{text(item.name)}</strong>
                    {text(item.description) && <p>{text(item.description)}</p>}
                    {formatPrice(item.price) && <span>{formatPrice(item.price)}</span>}
                    {text(item.image) && <img src={text(item.image)} alt={text(item.name)} loading="lazy" style={frame(`products.${index}.image`)} />}
                  </div>
                ))}
              </article>
            ))}
          </div>
        </section>
      )

    case "skills":
      return (
        <section id={`ue-section-${section.id}`} className="tpw-section">
          <h2>Keahlian</h2>
          <div className="tpw-section-grid">
            {strings(content.items).map((item, index) => (
              <span key={index} className="tpw-section-card">{item}</span>
            ))}
          </div>
        </section>
      )

    case "experience":
    case "education":
    case "projects": {
      const title = {
        experience: "Pengalaman",
        education: "Pendidikan",
        projects: "Karya & Proyek",
      }[section.type]

      return (
        <section id={`ue-section-${section.id}`} className="tpw-section">
          <h2>{title}</h2>
          <div className="tpw-section-grid">
            {records(content.items).map((item, index) => (
              <article key={index} className="tpw-section-card">
                {text(item.image) && <img src={text(item.image)} alt="" loading="lazy" />}
                <h3>{text(item.title) || text(item.position) || text(item.institution)}</h3>
                {text(item.category) && <p>{text(item.category)}</p>}
                {text(item.company) && <p>{text(item.company)}</p>}
                {text(item.degree) && <p>{text(item.degree)}</p>}
                {text(item.description) && <p>{text(item.description)}</p>}
                {text(item.period) && <small>{text(item.period)}</small>}
              </article>
            ))}
          </div>
        </section>
      )
    }

    case "gallery":
      return (
        <section id={`ue-section-${section.id}`} className="tpw-section tpw-gallery-section">
          <h2>{text(content.title) || "Galeri"}</h2>
          <div className="tpw-gallery-grid">
            {strings(content.images).map((image, index) => (
              <figure key={index}>
                <img src={image} alt={`Galeri ${index + 1}`} loading="lazy" style={frame(`gallery.${index}`)} {...edit(`gallery.${index}`, `Foto galeri ${index + 1}`, "image")} />
              </figure>
            ))}
          </div>
        </section>
      )

    case "contact":
      return (
        <section id={`ue-section-${section.id}`} className="tpw-section tpw-contact">
          <h2>Hubungi Kami</h2>
          <div className="tpw-contact-list">
            {Object.entries(content).map(([key, value]) => {
              if (typeof value !== "string" || !value.trim()) return null
              return <p key={key}><strong>{key}: </strong>{value}</p>
            })}
          </div>
        </section>
      )

    case "location":
      return (
        <section id={`ue-section-${section.id}`} className="tpw-section">
          <h2>Lokasi</h2>
          {text(content.areaName) && <p>{text(content.areaName)}</p>}
          {text(content.googleMapsUrl) && (
            <a href={text(content.googleMapsUrl)} target="_blank" rel="noreferrer">Lihat lokasi</a>
          )}
        </section>
      )

    default:
      return null
  }
}

export default function UniversalRenderer({ document, editable = false, onSelectField }: Props) {
  const theme = document.theme
  const themeKey = document.themeKey
  const style = {
    "--tpw-primary": theme.primary || "#173f35",
    "--tpw-accent": theme.accent || "#d4a96a",
    "--tpw-background": theme.background || "#ffffff",
    "--tpw-text": theme.text || "#263247",
    "--tpw-header-background": theme.headerBackground || theme.primary || "#173f35",
    "--tpw-header-text": theme.headerText || "#ffffff",
    "--tpw-hero-overlay": theme.backgroundOverlay || "rgba(20, 30, 25, .58)",
    "--tpw-page-image": theme.backgroundImage ? `url("${theme.backgroundImage}")` : "none",
    "--tpw-page-overlay": theme.backgroundOverlay || "transparent",
    "--tpw-page-bg-size": theme.backgroundSize || "cover",
    "--tpw-page-bg-position": theme.backgroundPosition || "center",
    "--tpw-page-bg-repeat": theme.backgroundRepeat || "no-repeat",
    fontFamily: theme.fontFamily || "Arial, sans-serif",
    fontStyle: theme.fontStyle === "italic" ? "italic" : "normal",
    fontWeight: theme.fontStyle === "bold" ? 700 : 400,
  } as CSSProperties

  return (
    <main className="tpw-universal-site" data-theme={themeKey} data-template={document.templateKey} data-business-layout={document.businessProfileLayout} style={style}>
      {document.sections.filter((section) => section.visible).map((section) => (
        <SectionContent key={section.id} section={section} editable={editable} onSelectField={onSelectField} imageFrames={document.imageFrames} />
      ))}
      <footer className="tpw-universal-footer">Powered by TPW-LP</footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;700&family=Lato:wght@400;700&family=Merriweather:wght@400;700&family=Nunito:wght@400;700&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;700&family=Quicksand:wght@400;700&family=Oswald:wght@400;700&display=swap');
        .tpw-universal-site .tpw-editable-target{cursor:text;outline:2px dashed transparent;outline-offset:4px;border-radius:3px;transition:outline-color .15s}.tpw-universal-site .tpw-editable-target:hover{outline-color:#8bba72}.tpw-universal-site .tpw-logo-placeholder{width:48px;height:48px;border:1px dashed #a8c58d;border-radius:50%;background:#ffffff18;color:inherit;font-size:10px;cursor:pointer}.tpw-universal-site .tpw-image-placeholder{min-width:220px;min-height:260px;border:2px dashed #a8c58d;border-radius:18px;background:#ffffff18;color:inherit;font:inherit;cursor:pointer}.tpw-universal-site .tpw-editable-image{cursor:pointer;outline:2px dashed transparent;outline-offset:5px}.tpw-universal-site .tpw-editable-image:hover{outline-color:#8bba72}
        .tpw-universal-site{position:relative;isolation:isolate;min-height:100vh;color:var(--tpw-text);background-color:var(--tpw-background);background-image:var(--tpw-page-image);background-size:var(--tpw-page-bg-size);background-position:var(--tpw-page-bg-position);background-repeat:var(--tpw-page-bg-repeat);background-attachment:fixed;overflow:hidden;overflow-wrap:anywhere}
        .tpw-universal-site:before{content:"";position:absolute;z-index:0;inset:0;background:var(--tpw-page-overlay);pointer-events:none}
        .tpw-universal-site>*{position:relative;z-index:1}
        .tpw-universal-site .tpw-section{background:color-mix(in srgb,var(--tpw-background) 88%,transparent);backdrop-filter:saturate(1.05)}
        .tpw-universal-site .tpw-section-header{padding:18px 6%;display:flex;align-items:center;justify-content:space-between;color:#fff;background:var(--tpw-primary)}
        .tpw-universal-site .tpw-header-nav{display:flex;align-items:center;gap:clamp(13px,2vw,28px);font-size:13px}.tpw-universal-site .tpw-header-nav a{color:inherit;text-decoration:none;opacity:.9}.tpw-universal-site .tpw-header-nav a:hover{color:var(--tpw-accent);opacity:1}
        .tpw-universal-site .tpw-header-brand{display:flex;align-items:center;gap:12px}
        .tpw-universal-site .tpw-header-brand span{display:block;margin-top:4px;opacity:.82;font-size:13px}
        .tpw-universal-site .tpw-header-logo,.tpw-universal-site .tpw-header-avatar{width:48px;height:48px;object-fit:cover;border-radius:50%}
        .tpw-universal-site .tpw-section-hero{position:relative;isolation:isolate;min-height:390px;padding:76px 7%;display:flex;align-items:center;justify-content:center;gap:34px;text-align:center;color:#fff;background:linear-gradient(135deg,var(--tpw-primary),#252b35);background-position:center;background-size:cover}
        .tpw-universal-site .tpw-hero-copy{max-width:760px;position:relative;z-index:1}
        .tpw-universal-site .tpw-hero-eyebrow{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--tpw-accent)}
        .tpw-universal-site .tpw-section-hero h1{font-size:clamp(32px,5vw,58px);line-height:1.08;margin:0 0 12px}
        .tpw-universal-site .tpw-section-hero h2{color:var(--tpw-accent);font-size:clamp(18px,3vw,25px);font-weight:500}
        .tpw-universal-site .tpw-hero-intro{max-width:720px;margin:20px auto 0;line-height:1.8}
        .tpw-universal-site .tpw-hero-image{position:relative;z-index:1;width:min(38%,420px);max-height:390px;object-fit:cover;border-radius:18px;box-shadow:0 22px 60px #0005}
        .tpw-universal-site .tpw-section{padding:48px 7%;max-width:1180px;margin:auto}
        .tpw-universal-site .tpw-section h2{color:var(--tpw-primary);border-bottom:2px solid var(--tpw-accent);padding-bottom:12px;margin-top:0}
        .tpw-universal-site .tpw-section p{line-height:1.8;white-space:pre-wrap}
        .tpw-universal-site .tpw-section-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:18px}
        .tpw-universal-site .tpw-section-card{display:block;padding:20px;border:1px solid color-mix(in srgb,var(--tpw-primary) 15%,transparent);border-radius:12px;background:rgba(255,255,255,.82)}
        .tpw-universal-site .tpw-section-card h3{color:var(--tpw-primary)}
        .tpw-universal-site .tpw-section-card img{width:100%;max-height:280px;object-fit:cover;border-radius:10px}
        .tpw-universal-site .tpw-menu-item{padding:12px 0;border-bottom:1px solid #e5e7eb}
        .tpw-universal-site .tpw-gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
        .tpw-universal-site .tpw-gallery-grid figure{margin:0;overflow:hidden;border-radius:14px;background:#eee}
        .tpw-universal-site .tpw-gallery-grid img{display:block;width:100%;height:280px;object-fit:cover;transition:transform .35s ease}
        .tpw-universal-site .tpw-gallery-grid figure:hover img{transform:scale(1.035)}
        .tpw-universal-site .tpw-contact{background:color-mix(in srgb,var(--tpw-primary) 6%,transparent)}
        .tpw-universal-site .tpw-universal-footer{padding:24px;text-align:center;font-size:12px;opacity:.65}
        /* Botanical Fresh */
        .tpw-universal-site[data-theme="botanical"]{font-family:Georgia,serif}
        .tpw-universal-site[data-theme="botanical"] .tpw-section-hero{background-image:radial-gradient(circle at 85% 15%,#d8b66a55,transparent 32%),linear-gradient(120deg,var(--tpw-primary),#426d4f)}
        .tpw-universal-site[data-theme="botanical"] .tpw-section-header{border-bottom:4px solid var(--tpw-accent)}
        .tpw-universal-site[data-theme="botanical"] .tpw-section-card{border-radius:4px 18px 4px 18px}
        /* Modern Editorial */
        .tpw-universal-site[data-theme="editorial"]{font-family:Georgia,serif}
        .tpw-universal-site[data-theme="editorial"] .tpw-section-hero{justify-content:flex-start;text-align:left;background-image:linear-gradient(115deg,#172233,var(--tpw-primary))}
        .tpw-universal-site[data-theme="editorial"] .tpw-section-hero h1{font-weight:500;letter-spacing:-.045em}
        .tpw-universal-site[data-theme="editorial"] .tpw-section h2{border-bottom:1px solid var(--tpw-accent);letter-spacing:.04em}
        .tpw-universal-site[data-theme="editorial"] .tpw-section-card{border:0;border-top:2px solid var(--tpw-accent);border-radius:0;background:transparent}
        /* Warm Coffeehouse */
        .tpw-universal-site[data-theme="coffeehouse"]{font-family:Georgia,serif}
        .tpw-universal-site[data-theme="coffeehouse"] .tpw-section-hero{background-image:radial-gradient(ellipse at 75% 25%,#d7a66a55,transparent 38%),linear-gradient(120deg,#241711,var(--tpw-primary))}
        .tpw-universal-site[data-theme="coffeehouse"] .tpw-section-header{background:#241711}
        .tpw-universal-site[data-theme="coffeehouse"] .tpw-section-card{background:#fffaf4;border-color:#e5d4c1;border-radius:18px}
        /* Clean Showcase */
        .tpw-universal-site[data-theme="showcase"]{font-family:Arial,sans-serif}
        .tpw-universal-site[data-theme="showcase"] .tpw-section-hero{min-height:320px;text-align:left;justify-content:space-between;background-image:linear-gradient(120deg,#f1f5f5,var(--tpw-primary));color:#fff}
        .tpw-universal-site[data-theme="showcase"] .tpw-section-card{border-radius:8px;box-shadow:0 8px 28px #172b3510}
        .tpw-universal-site[data-theme="showcase"] .tpw-gallery-grid img{height:240px}
        /* Adventure Field */
        .tpw-universal-site[data-theme="expedition"]{font-family:Arial,sans-serif}
        .tpw-universal-site[data-theme="expedition"] .tpw-section-header{background:#26372d}
        .tpw-universal-site[data-theme="expedition"] .tpw-section-hero{min-height:470px;text-align:left;justify-content:space-between;background-image:linear-gradient(110deg,#1c3029dd,#465b47aa),radial-gradient(circle at 15% 80%,#d68a4544,transparent 40%)}
        .tpw-universal-site[data-theme="expedition"] .tpw-section-hero h1{text-transform:uppercase;letter-spacing:-.035em}
        .tpw-universal-site[data-theme="expedition"] .tpw-section-hero h2{color:#e99a52}
        .tpw-universal-site[data-theme="expedition"] .tpw-section-card{background:#f7f6ef;border-radius:3px 14px 3px 14px}
        .tpw-universal-site[data-theme="expedition"] .tpw-gallery-grid img{height:320px}
        /* THEME TEMPLATE: composition and content hierarchy */
        .tpw-universal-site[data-template="business-profile"] .tpw-section-hero{min-height:430px;justify-content:space-between;text-align:left;padding-left:8%;padding-right:8%}
        .tpw-universal-site[data-template="business-profile"] .tpw-hero-copy{max-width:58%}
        .tpw-universal-site[data-template="business-profile"] .tpw-hero-image{width:34%;aspect-ratio:4/5;max-height:360px;border-radius:48% 48% 14px 14px}
        .tpw-universal-site[data-template="business-profile"] .tpw-about{max-width:900px;text-align:center;padding-top:68px;padding-bottom:68px}
        .tpw-universal-site[data-template="business-profile"] .tpw-gallery-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
        .tpw-universal-site[data-template="personal-cv"] .tpw-section-header{padding:22px 8%;background:transparent;color:var(--tpw-text);border-bottom:1px solid color-mix(in srgb,var(--tpw-primary) 20%,transparent)}
        .tpw-universal-site[data-template="personal-cv"] .tpw-header-logo,.tpw-universal-site[data-template="personal-cv"] .tpw-header-avatar{width:62px;height:62px;border-radius:18px}
        .tpw-universal-site[data-template="personal-cv"] .tpw-section-hero{min-height:350px;justify-content:flex-start;text-align:left;padding:58px 10%;background:transparent;color:var(--tpw-text)}
        .tpw-universal-site[data-template="personal-cv"] .tpw-section-hero h1{font-size:clamp(38px,6vw,76px);max-width:760px}
        .tpw-universal-site[data-template="personal-cv"] .tpw-section-hero h2{color:var(--tpw-primary)}
        .tpw-universal-site[data-template="personal-cv"] .tpw-section-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .tpw-universal-site[data-template="personal-cv"] .tpw-section-card{border:0;border-left:3px solid var(--tpw-accent);border-radius:0;background:transparent}
        .tpw-universal-site[data-template="digital-menu"] .tpw-section-header{justify-content:center;text-align:center;background:var(--tpw-primary);padding:24px}
        .tpw-universal-site[data-template="digital-menu"] .tpw-section-hero{min-height:260px;display:block;padding:62px 6%;text-align:center}
        .tpw-universal-site[data-template="digital-menu"] .tpw-section-hero h1{font-family:Georgia,serif;font-size:clamp(34px,5vw,54px)}
        .tpw-universal-site[data-template="digital-menu"] .tpw-section{max-width:900px}
        .tpw-universal-site[data-template="digital-menu"] .tpw-section-grid{display:block}
        .tpw-universal-site[data-template="digital-menu"] .tpw-section-card{padding:22px 4px;border:0;border-bottom:1px solid color-mix(in srgb,var(--tpw-primary) 18%,transparent);border-radius:0;background:transparent}
        .tpw-universal-site[data-template="digital-menu"] .tpw-menu-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px 16px;align-items:center;padding:16px 0}
        .tpw-universal-site[data-template="digital-menu"] .tpw-menu-item img{grid-column:1/-1;width:100%;max-height:220px;object-fit:cover;border-radius:12px}
        .tpw-universal-site[data-template="product-catalog"] .tpw-section-header{background:transparent;color:var(--tpw-text);border-bottom:1px solid #0001}
        .tpw-universal-site[data-template="product-catalog"] .tpw-section-hero{min-height:300px;justify-content:flex-start;text-align:left;color:var(--tpw-text);background:transparent;padding:56px 7%}
        .tpw-universal-site[data-template="product-catalog"] .tpw-section-hero h1{font-size:clamp(34px,5vw,58px)}
        .tpw-universal-site[data-template="product-catalog"] .tpw-section-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
        .tpw-universal-site[data-template="product-catalog"] .tpw-section-card{padding:0;border:0;border-radius:0;background:transparent}
        .tpw-universal-site[data-template="product-catalog"] .tpw-section-card img{height:250px;object-fit:cover;border-radius:12px}
        .tpw-universal-site[data-template="creative-portfolio"] .tpw-section-header{background:transparent;color:var(--tpw-text);padding:26px 7%}
        .tpw-universal-site[data-template="creative-portfolio"] .tpw-section-hero{min-height:440px;justify-content:flex-start;text-align:left;background:transparent;color:var(--tpw-text);padding:78px 9%}
        .tpw-universal-site[data-template="creative-portfolio"] .tpw-section-hero h1{font-size:clamp(48px,8vw,100px);letter-spacing:-.07em;line-height:.95}
        .tpw-universal-site[data-template="creative-portfolio"] .tpw-section-hero h2{color:var(--tpw-primary)}
        .tpw-universal-site[data-template="creative-portfolio"] .tpw-section-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:28px}
        .tpw-universal-site[data-template="creative-portfolio"] .tpw-section-card{padding:0;border:0;background:transparent}
        .tpw-universal-site[data-template="creative-portfolio"] .tpw-section-card img{aspect-ratio:4/3;height:auto;max-height:none;border-radius:2px}
        .tpw-universal-site[data-template="creative-portfolio"] .tpw-section-card:nth-child(even){transform:translateY(34px)}
        /* Theme Style only changes the visual skin; it does not change the template composition. */
        .tpw-universal-site[data-theme="botanical"] .tpw-section{border-radius:0}
        .tpw-universal-site[data-theme="editorial"] .tpw-section{background:color-mix(in srgb,#f5f3ef 88%,transparent)}
        .tpw-universal-site[data-theme="coffeehouse"] .tpw-section{background:color-mix(in srgb,#f8f0e7 91%,transparent)}
        .tpw-universal-site[data-theme="showcase"] .tpw-section{background:color-mix(in srgb,#fff 92%,transparent)}
        .tpw-universal-site[data-theme="expedition"] .tpw-section{background:color-mix(in srgb,#f0f0e8 90%,transparent)}
        /* Template-controlled image frames: source image remains untouched. */
        .tpw-universal-site .tpw-header-brand{min-width:0;max-width:100%}
        .tpw-universal-site .tpw-header-logo{display:block!important;width:clamp(42px,8vw,88px)!important;height:clamp(42px,8vw,88px)!important;max-width:88px!important;max-height:88px!important;min-width:0;flex:0 0 auto;object-fit:contain!important;border-radius:0!important;overflow:hidden}
        .tpw-universal-site .tpw-header-avatar{display:block!important;width:64px!important;height:64px!important;max-width:64px!important;max-height:64px!important;flex:0 0 auto;object-fit:cover!important}
        .tpw-universal-site .tpw-section-hero{min-width:0;overflow:hidden}
        .tpw-universal-site .tpw-hero-copy{flex:1 1 58%;min-width:0;width:auto;max-width:58%;overflow-wrap:normal;word-break:normal}
        .tpw-universal-site .tpw-section-hero h1{max-width:100%;overflow-wrap:break-word;word-break:normal}
        .tpw-universal-site .tpw-hero-image{flex:0 1 38%;width:38%;max-width:420px;min-width:0;max-height:390px;aspect-ratio:16/9;object-fit:cover;clip-path:inset(0 round 18px)}
        .tpw-universal-site .tpw-product-image-frame{width:100%;aspect-ratio:1/1;max-height:250px;overflow:hidden;border-radius:12px;margin-bottom:12px;background:#eee}
        .tpw-universal-site .tpw-product-image-frame img{width:100%;height:100%;max-height:none;object-fit:cover}
        .tpw-universal-site .tpw-service-image-frame{width:100%;aspect-ratio:4/3;max-height:220px;overflow:hidden;border-radius:10px;margin-bottom:14px;background:#e8e8e8}
        .tpw-universal-site .tpw-service-image-frame img{display:block;width:100%;height:100%;max-height:none;object-fit:cover}
        .tpw-universal-site .tpw-card-image-placeholder{width:100%;aspect-ratio:4/3;max-height:220px;margin-bottom:14px;border:1px dashed #9aaa8d;border-radius:10px;background:#f5f6f2;color:#52624b;cursor:pointer}
        .tpw-universal-site .tpw-section-card img{max-width:100%;max-height:280px;object-fit:cover;overflow:hidden}
        .tpw-universal-site .tpw-gallery-grid img{width:100%;height:clamp(150px,22vw,280px);max-height:280px;object-fit:cover;overflow:hidden}
        .tpw-universal-site[data-template="business-profile"] .tpw-section-hero{display:flex;gap:clamp(18px,3vw,34px)}
        .tpw-universal-site[data-template="business-profile"] .tpw-hero-copy{flex:1 1 58%;max-width:58%;min-width:0}
        .tpw-universal-site[data-template="business-profile"] .tpw-hero-image{flex:0 1 34%;width:34%;max-width:360px;aspect-ratio:4/5;max-height:360px;clip-path:inset(0 round 18px)}
        /* Template Guide controls image frame dimensions; original files are preserved. */
        .tpw-universal-site .tpw-header-brand{min-width:0;max-width:100%}
        .tpw-universal-site .tpw-header-logo{display:block!important;width:clamp(42px,8vw,88px)!important;height:clamp(42px,8vw,88px)!important;max-width:88px!important;max-height:88px!important;min-width:0;flex:0 0 auto;object-fit:contain!important;border-radius:0!important;overflow:hidden}
        .tpw-universal-site .tpw-header-avatar{display:block!important;width:64px!important;height:64px!important;max-width:64px!important;max-height:64px!important;flex:0 0 auto;object-fit:cover!important}
        .tpw-universal-site .tpw-section-hero{min-width:0;overflow:hidden}
        .tpw-universal-site .tpw-hero-copy{flex:1 1 58%;min-width:0;width:auto;max-width:58%;overflow-wrap:normal;word-break:normal}
        .tpw-universal-site .tpw-section-hero h1{max-width:100%;overflow-wrap:break-word;word-break:normal}
        .tpw-universal-site .tpw-hero-image{flex:0 1 38%;width:38%;max-width:420px;min-width:0;max-height:390px;aspect-ratio:16/9;object-fit:cover;clip-path:inset(0 round 18px)}
        .tpw-universal-site .tpw-product-image-frame{width:100%;aspect-ratio:1/1;max-height:250px;overflow:hidden;border-radius:12px;margin-bottom:12px;background:#eee}
        .tpw-universal-site .tpw-product-image-frame img{width:100%;height:100%;max-height:none;object-fit:cover}
        .tpw-universal-site .tpw-service-image-frame{width:100%;aspect-ratio:4/3;max-height:220px;overflow:hidden;border-radius:10px;margin-bottom:14px;background:#e8e8e8}
        .tpw-universal-site .tpw-service-image-frame img{display:block;width:100%;height:100%;max-height:none;object-fit:cover}
        .tpw-universal-site .tpw-card-image-placeholder{width:100%;aspect-ratio:4/3;max-height:220px;margin-bottom:14px;border:1px dashed #9aaa8d;border-radius:10px;background:#f5f6f2;color:#52624b;cursor:pointer}
        .tpw-universal-site .tpw-section-card img{max-width:100%;max-height:280px;object-fit:cover;overflow:hidden}
        .tpw-universal-site .tpw-gallery-grid img{width:100%;height:clamp(150px,22vw,280px);max-height:280px;object-fit:cover;overflow:hidden}
        .tpw-universal-site[data-template="business-profile"] .tpw-section-hero{display:flex;gap:clamp(18px,3vw,34px)}
        .tpw-universal-site[data-template="business-profile"] .tpw-hero-copy{flex:1 1 58%;max-width:58%;min-width:0}
        .tpw-universal-site[data-template="business-profile"] .tpw-hero-image{flex:0 1 34%;width:34%;max-width:360px;aspect-ratio:4/5;max-height:360px;clip-path:inset(0 round 18px)}
        @media(max-width:650px){
          .tpw-universal-site .tpw-header-nav{display:none}
          .tpw-universal-site .tpw-section-hero{padding:58px 6%;display:block;text-align:left}
          .tpw-universal-site .tpw-hero-image{width:100%;max-width:100%;max-height:340px;margin-top:24px;aspect-ratio:16/10}
          .tpw-universal-site .tpw-hero-copy{width:100%;max-width:100%;min-width:0}
          .tpw-universal-site .tpw-header-logo{width:56px!important;height:56px!important;max-width:56px!important;max-height:56px!important}
          .tpw-universal-site .tpw-service-image-frame{max-height:220px}
          .tpw-universal-site .tpw-section{padding:32px 6%}
          .tpw-universal-site[data-template="business-profile"] .tpw-hero-copy{max-width:none;flex-basis:auto}
          .tpw-universal-site[data-template="business-profile"] .tpw-hero-image{width:100%;aspect-ratio:16/10;border-radius:14px}
          .tpw-universal-site[data-template="personal-cv"] .tpw-section-grid,.tpw-universal-site[data-template="product-catalog"] .tpw-section-grid,.tpw-universal-site[data-template="creative-portfolio"] .tpw-section-grid{grid-template-columns:1fr}
          .tpw-universal-site[data-template="creative-portfolio"] .tpw-section-card:nth-child(even){transform:none}
          .tpw-universal-site[data-template="digital-menu"] .tpw-menu-item{grid-template-columns:1fr auto}
          .tpw-universal-site[data-theme="editorial"] .tpw-section-hero{text-align:left}
        }

        /* Business Profile frame constraints: prevent uploaded assets from controlling layout. */
        .tpw-universal-site .tpw-section-header{min-width:0;overflow:hidden}
        .tpw-universal-site .tpw-header-brand{display:flex;align-items:center;gap:14px;min-width:0;max-width:100%;flex-wrap:nowrap}
        .tpw-universal-site .tpw-header-logo{display:block!important;flex:0 0 88px!important;width:88px!important;height:88px!important;min-width:0!important;max-width:88px!important;min-height:0!important;max-height:88px!important;object-fit:contain!important;object-position:50% 50%;border-radius:0!important;overflow:hidden;transform-origin:center center}
        .tpw-universal-site .tpw-header-brand>div{min-width:0;overflow-wrap:anywhere}
        .tpw-universal-site .tpw-section-hero{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:clamp(18px,3vw,36px);min-width:0;overflow:hidden}
        .tpw-universal-site .tpw-hero-copy{box-sizing:border-box;flex:1 1 58%;width:58%;max-width:58%;min-width:280px;overflow:hidden}
        .tpw-universal-site .tpw-section-hero h1{display:block;width:100%;max-width:100%;min-width:0;font-size:clamp(30px,4.2vw,56px);line-height:1.08;white-space:normal;overflow-wrap:break-word;word-break:normal}
        .tpw-universal-site .tpw-hero-image{box-sizing:border-box;display:block;flex:0 1 34%;width:34%;min-width:0;max-width:360px;height:auto;max-height:360px;aspect-ratio:4/5;object-fit:cover;overflow:hidden;transform-origin:center center}
        .tpw-universal-site .tpw-editable-target{max-width:100%;box-sizing:border-box}
        @media(max-width:650px){
          .tpw-universal-site .tpw-section-hero{display:block;padding:42px 6%;text-align:left}
          .tpw-universal-site .tpw-hero-copy{width:100%;max-width:100%;min-width:0}
          .tpw-universal-site .tpw-hero-image{width:100%;max-width:100%;max-height:320px;aspect-ratio:16/10;margin-top:20px}
          .tpw-universal-site .tpw-header-logo{flex:0 0 64px!important;width:64px!important;height:64px!important;max-width:64px!important;max-height:64px!important}
        }
        /* Three Business Profile templates: composition is independent from Theme Style. */
        .tpw-universal-site[data-template="business-profile"][data-business-layout="corporate-dark"]{--tpw-primary:#121416;--tpw-accent:#e0b54b;--tpw-background:#181a1d;--tpw-text:#f4f1e9;background:#181a1d;color:#f4f1e9}
        .tpw-universal-site[data-template="business-profile"][data-business-layout="corporate-dark"] .tpw-section-header{padding:20px 8%;background:#101113;border-bottom:1px solid #e0b54b55}.tpw-universal-site[data-template="business-profile"][data-business-layout="corporate-dark"] .tpw-section-hero{min-height:560px;background:linear-gradient(105deg,#101113 48%,#25272a);padding:76px 9%;gap:8%}.tpw-universal-site[data-template="business-profile"][data-business-layout="corporate-dark"] .tpw-hero-copy{max-width:56%}.tpw-universal-site[data-template="business-profile"][data-business-layout="corporate-dark"] .tpw-section-hero h1{font-size:clamp(48px,6.8vw,92px);letter-spacing:-.055em;text-transform:uppercase}.tpw-universal-site[data-template="business-profile"][data-business-layout="corporate-dark"] .tpw-hero-image-frame{width:34%;height:420px;border:1px solid #e0b54b77;border-radius:2px}.tpw-universal-site[data-template="business-profile"][data-business-layout="corporate-dark"] .tpw-section{max-width:none;padding:70px 9%;background:#1d1f22;color:#d7d4cd}.tpw-universal-site[data-template="business-profile"][data-business-layout="corporate-dark"] .tpw-section h2,.tpw-universal-site[data-template="business-profile"][data-business-layout="corporate-dark"] .tpw-section-card h3{color:#f7f3e9}.tpw-universal-site[data-template="business-profile"][data-business-layout="corporate-dark"] .tpw-about{display:grid;grid-template-columns:1fr 1.25fr;gap:70px;text-align:left;max-width:none}.tpw-universal-site[data-template="business-profile"][data-business-layout="corporate-dark"] .tpw-about h2{font-size:clamp(35px,4vw,57px);border:0}.tpw-universal-site[data-template="business-profile"][data-business-layout="corporate-dark"] .tpw-section-card{background:#25272b;border:0;border-top:2px solid #e0b54b;border-radius:0;color:#d7d4cd}.tpw-universal-site[data-template="business-profile"][data-business-layout="corporate-dark"] .tpw-contact{background:#101113}
        .tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"]{--tpw-primary:#1d2730;--tpw-accent:#c7853f;--tpw-background:#fff;--tpw-text:#28343d;background:#fff}.tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-section-header{padding:22px 8%;background:#fff;color:#1d2730;border-bottom:1px solid #e4e7e8}.tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-section-hero{min-height:600px;padding:70px 8%;align-items:flex-end;text-align:left;background:linear-gradient(0deg,#0c1519cc,transparent 70%),var(--tpw-page-image),linear-gradient(135deg,#71818a,#243139)}.tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-hero-copy{max-width:780px}.tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-section-hero h1{font-size:clamp(46px,6vw,82px);letter-spacing:-.055em}.tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-hero-image-frame{display:block;flex:0 0 38%;width:38%;max-width:460px;height:clamp(300px,32vw,420px);max-height:420px;aspect-ratio:1/1;overflow:hidden}.tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-section{padding:82px 9%;max-width:1260px;background:#fff}.tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-about{display:grid;grid-template-columns:42% 1fr;gap:12%;text-align:left;max-width:1120px}.tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-about h2{font-size:clamp(36px,4vw,58px);border:0}.tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-section-grid{gap:1px;background:#e6e9ea}.tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-section-card{border:0;border-radius:0;background:#fff;padding:30px}
        .tpw-universal-site[data-template="business-profile"][data-business-layout="modern-teal"]{--tpw-primary:#0d5d5a;--tpw-accent:#f2bd68;--tpw-background:#edf5f3;--tpw-text:#153634;background:#edf5f3}.tpw-universal-site[data-template="business-profile"][data-business-layout="modern-teal"] .tpw-section-header{padding:22px 8%;background:#0d5d5a}.tpw-universal-site[data-template="business-profile"][data-business-layout="modern-teal"] .tpw-section-hero{min-height:520px;padding:74px 9%;background:linear-gradient(120deg,#074744,#0e7771)}.tpw-universal-site[data-template="business-profile"][data-business-layout="modern-teal"] .tpw-hero-copy{max-width:52%}.tpw-universal-site[data-template="business-profile"][data-business-layout="modern-teal"] .tpw-section-hero h1{font-size:clamp(45px,6.2vw,80px);letter-spacing:-.06em}.tpw-universal-site[data-template="business-profile"][data-business-layout="modern-teal"] .tpw-hero-image-frame{width:37%;height:390px;border-radius:48% 48% 8px 8px;border:10px solid #ffffff22}.tpw-universal-site[data-template="business-profile"][data-business-layout="modern-teal"] .tpw-section{padding:72px 9%;max-width:1240px;background:#edf5f3}.tpw-universal-site[data-template="business-profile"][data-business-layout="modern-teal"] .tpw-about{max-width:980px;text-align:left}.tpw-universal-site[data-template="business-profile"][data-business-layout="modern-teal"] .tpw-about h2{font-size:clamp(36px,4vw,58px)}.tpw-universal-site[data-template="business-profile"][data-business-layout="modern-teal"] .tpw-section-card{border:0;border-radius:20px;background:#fff;box-shadow:0 16px 35px #0b4a4620}.tpw-universal-site[data-template="business-profile"][data-business-layout="modern-teal"] .tpw-gallery-grid figure{border-radius:2px 28px 2px 28px}
        @media(max-width:650px){.tpw-universal-site[data-template="business-profile"][data-business-layout] .tpw-section-hero{min-height:auto;padding:56px 6%;gap:28px}.tpw-universal-site[data-template="business-profile"][data-business-layout] .tpw-hero-copy{max-width:none}.tpw-universal-site[data-template="business-profile"][data-business-layout] .tpw-hero-image-frame{width:100%;height:270px}.tpw-universal-site[data-template="business-profile"][data-business-layout] .tpw-about{display:block;padding:48px 6%}.tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-section-hero{min-height:520px;justify-content:space-between;gap:6%}.tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-hero-copy{flex:1 1 56%;width:56%;max-width:56%;min-width:0}.tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-hero-image-frame{flex:0 0 38%;width:38%;max-width:460px;height:clamp(300px,32vw,420px);max-height:420px;aspect-ratio:1/1}.tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-section{padding:52px 6%}}
        /* Crop V2: clipping belongs to the frame, never to the transformed image. */
        .tpw-universal-site .tpw-header-logo-frame{display:block;flex:0 0 88px;width:88px;height:88px;max-width:88px;max-height:88px;overflow:hidden;position:relative;}
        .tpw-universal-site .tpw-header-logo-frame .tpw-header-logo{display:block!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:contain!important;transform:none!important;}
        .tpw-universal-site .tpw-hero-image-frame{display:block;position:relative;flex:0 1 34%;width:34%;max-width:360px;min-width:0;height:360px;max-height:360px;aspect-ratio:4/5;overflow:hidden;border-radius:18px;}
        .tpw-universal-site .tpw-hero-image-frame .tpw-hero-image{display:block!important;flex:none!important;width:100%!important;height:100%!important;min-width:0!important;max-width:none!important;min-height:0!important;max-height:none!important;aspect-ratio:auto!important;object-fit:cover!important;border-radius:0!important;clip-path:none!important;}
        .tpw-universal-site .tpw-service-image-frame,.tpw-universal-site .tpw-product-image-frame,.tpw-universal-site .tpw-gallery-grid figure{position:relative;overflow:hidden;}
        .tpw-universal-site .tpw-service-image-frame img,.tpw-universal-site .tpw-product-image-frame img,.tpw-universal-site .tpw-gallery-grid figure img{display:block;width:100%;height:100%;max-height:none;object-fit:cover;}
        @media(max-width:650px){
          .tpw-universal-site .tpw-header-logo-frame{flex-basis:64px;width:64px;height:64px;max-width:64px;max-height:64px;}
          .tpw-universal-site .tpw-hero-image-frame{width:100%;max-width:100%;height:auto;max-height:320px;aspect-ratio:16/10;margin-top:20px;}
          .tpw-universal-site .tpw-hero-image-frame .tpw-hero-image{height:100%!important;}
        }
        @media(max-width:650px){
          .tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-section-hero{min-height:auto!important;justify-content:flex-start!important;flex-direction:column!important;align-items:stretch!important;gap:24px!important}
          .tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-hero-copy{width:100%!important;max-width:100%!important;flex:0 0 auto!important}
          .tpw-universal-site[data-template="business-profile"][data-business-layout="clean-business"] .tpw-hero-image-frame{display:block!important;flex:0 0 auto!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:none!important;aspect-ratio:1/1!important}
        }
      `}</style>
    </main>
  )
}
