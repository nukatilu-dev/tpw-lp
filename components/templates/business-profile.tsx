import type { CSSProperties } from "react"
import styles from "./business-profile.module.css"

type Service = {
  title: string
  description: string
}

type LocationContent = {
  enabled?: boolean
  mode?: "pin" | "area"
  googleMapsUrl?: string
  areaName?: string
}

type BusinessContent = {
  businessName?: string
  tagline?: string
  headline?: string
  introduction?: string
  aboutTitle?: string
  about?: string
  services?: Service[]
  contact?: {
    phone?: string
    whatsapp?: string
    email?: string
    address?: string
  }
  location?: LocationContent
  images?: {
    logo?: string
    product?: string
    background?: string
  }
  social?: {
    facebook?: string
    instagram?: string
    youtube?: string
    tiktok?: string
  }
  theme?: {
    primary?: string
    accent?: string
  }
}

function normalizePhone(value: string) {
  let phone = value.replace(/\D/g, "")
  if (phone.startsWith("0")) phone = `62${phone.slice(1)}`
  else if (phone.startsWith("8")) phone = `62${phone}`
  return phone
}

function safeExternalUrl(value?: string) {
  if (!value?.trim()) return null
  try {
    const input = value.trim()
    const url = new URL(
      input.startsWith("http") ? input : `https://${input}`
    )
    return ["https:", "http:"].includes(url.protocol)
      ? url.toString()
      : null
  } catch {
    return null
  }
}

function safeGoogleMapsUrl(value?: string) {
  if (!value?.trim()) return null
  try {
    const input = value.trim()
    const url = new URL(input.startsWith("http") ? input : `https://${input}`)
    const host = url.hostname.toLowerCase()
    const isGoogleMapsHost =
      host === "maps.app.goo.gl" ||
      (host === "goo.gl" && url.pathname.startsWith("/maps")) ||
      host === "maps.google.com" ||
      host === "google.com" ||
      host === "www.google.com" ||
      host === "maps.google.co.id" ||
      host === "www.google.co.id"
    const isGoogleMapsPath =
      host === "maps.app.goo.gl" ||
      host === "goo.gl" ||
      host === "maps.google.com" ||
      url.pathname.startsWith("/maps")
    return url.protocol === "https:" && isGoogleMapsHost && isGoogleMapsPath
      ? url.toString()
      : null
  } catch {
    return null
  }
}

function getMapsEmbedUrl(query: string, mode: "pin" | "area") {
  const params = new URLSearchParams({
    q: query,
    z: mode === "pin" ? "16" : "10",
    output: "embed",
  })
  return `https://www.google.com/maps?${params.toString()}`
}

type SocialName = "facebook" | "instagram" | "youtube" | "tiktok"

function SocialIcon({ name }: { name: SocialName }) {
  return (
    <svg className={styles.socialIcon} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === "facebook" && (
        <path d="M14 21v-8h3l.5-3H14V8c0-1 .4-1.5 1.6-1.5H18V4h-2.8C12.6 4 11 5.6 11 8v2H8v3h3v8" />
      )}
      {name === "instagram" && <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" />
      </>}
      {name === "youtube" && <>
        <rect x="2.5" y="5" width="19" height="14" rx="4" />
        <path d="m10 9 5 3-5 3z" fill="currentColor" />
      </>}
      {name === "tiktok" && (
        <path d="M14 3v11.2a3.8 3.8 0 1 1-3-3.7V7.4a7.2 7.2 0 1 0 6 7.1V9.2a8 8 0 0 0 4 1.1V7a4.8 4.8 0 0 1-4-4z" />
      )}
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg className={styles.whatsappIcon} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L3 20l1.2-4.8a8.2 8.2 0 1 1 16-3.5Z" />
      <path d="M8.4 7.8c.3-.5.6-.5.9-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.2 0 .4-.1.6l-.6.7c-.2.2-.2.4 0 .6.5.9 1.3 1.6 2.2 2.1.2.1.4.1.6-.1l.8-1c.2-.2.4-.3.6-.2l1.8.9c.2.1.3.3.3.5 0 .5-.2 1.2-.6 1.5-.5.5-1.2.7-2 .6-1.1-.2-2.5-.8-3.8-1.9-1.2-1-2.1-2.3-2.4-3.3-.3-.9-.2-1.8.5-2.7Z" />
    </svg>
  )
}

export default function BusinessProfileTemplate({
  content,
}: {
  content: Record<string, unknown>
}) {
  const data = content as BusinessContent
  const services = Array.isArray(data.services) ? data.services : []

  const name = data.businessName || "Nama Bisnis Anda"
  const whatsapp = data.contact?.whatsapp || ""
  const phone = data.contact?.phone || ""
  const email = data.contact?.email || ""
  const address = data.contact?.address || ""

  const logo = data.images?.logo || ""
  const productImage = data.images?.product || ""
  const backgroundImage = data.images?.background || ""

  const primary = data.theme?.primary || "#173f35"
  const accent = data.theme?.accent || "#d4a96a"

  const themeStyle = {
    "--business-primary": primary,
    "--business-accent": accent,
  } as CSSProperties

  const heroStyle: CSSProperties | undefined = backgroundImage
    ? {
        backgroundImage:
          `linear-gradient(135deg, rgba(23,63,53,.65), rgba(29,48,41,.76)), url("${backgroundImage}")`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }
    : undefined

  const whatsappUrl = whatsapp
    ? `https://wa.me/${normalizePhone(whatsapp)}`
    : null

  const callUrl = phone
    ? `tel:${phone.replace(/[^+\d]/g, "")}`
    : null

  const socialLinks = [
    { name: "facebook" as const, label: "Facebook", url: safeExternalUrl(data.social?.facebook) },
    { name: "instagram" as const, label: "Instagram", url: safeExternalUrl(data.social?.instagram) },
    { name: "youtube" as const, label: "YouTube", url: safeExternalUrl(data.social?.youtube) },
    { name: "tiktok" as const, label: "TikTok", url: safeExternalUrl(data.social?.tiktok) },
  ].filter((item) => item.url !== null)

  const location = data.location
  const locationEnabled = location?.enabled === true
  const locationMode = location?.mode === "area" ? "area" : "pin"
  const pinUrl = locationMode === "pin"
    ? safeGoogleMapsUrl(location?.googleMapsUrl)
    : null
  const areaName = locationMode === "area" ? location?.areaName?.trim() || "" : ""
  const locationQuery = locationMode === "pin" ? pinUrl || "" : areaName
  const locationLink = locationMode === "pin"
    ? pinUrl
    : areaName
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(areaName)}`
      : null
  const locationEmbedUrl = locationQuery
    ? getMapsEmbedUrl(locationQuery, locationMode)
    : null

  return (
    <main className={styles.site} style={themeStyle}>
      <header className={styles.header}>
        <a href="#top" className={styles.brand}>
          {logo ? (
            <img className={styles.logoImage} src={logo} alt={`Logo ${name}`} />
          ) : (
            <span className={styles.brandMark}>
              {name.trim().charAt(0).toUpperCase()}
            </span>
          )}
          <span>{name}</span>
        </a>

        <nav className={styles.nav}>
          <a href="#about">Tentang</a>
          <a href="#services">Layanan</a>
          <a href="#contact">Kontak</a>
          {locationEnabled && locationLink && <a href="#location">Lokasi</a>}
        </nav>

        {whatsappUrl && (
          <a
            className={styles.headerButton}
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
          >
            <WhatsAppIcon /> WhatsApp ↗
          </a>
        )}
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>BUSINESS PROFILE</span>
          <h1>{data.headline || `Selamat datang di ${name}.`}</h1>
          <p className={styles.tagline}>{data.tagline}</p>
          <p className={styles.introduction}>{data.introduction}</p>

          {whatsappUrl && (
            <a
              className={styles.primaryButton}
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon /> Hubungi via WhatsApp <span>↗</span>
            </a>
          )}
        </div>

        <div className={styles.heroVisual} style={heroStyle}>
          <span>YOUR BUSINESS</span>
          <strong>{name}</strong>
          <i>{data.tagline || "Your brand, your story."}</i>
        </div>
      </section>

      <section className={styles.about} id="about">
        <div>
          <span className={styles.eyebrow}>01 / PROFIL BISNIS</span>
          <h2>{data.aboutTitle || "Tentang Kami"}</h2>
        </div>
        <p>{data.about}</p>
      </section>

      <section className={styles.services} id="services">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>
              02 / PRODUK & LAYANAN · {services.length}/3
            </span>
            <h2>Layanan Kami.</h2>
          </div>
        </div>

        {productImage && (
          <div className={styles.productVisual}>
            <img src={productImage} alt={`Produk ${name}`} />
          </div>
        )}

        <div
          className={styles.serviceGrid}
          style={{
            gridTemplateColumns:
              `repeat(${Math.max(1, Math.min(services.length, 3))}, minmax(0, 1fr))`,
          }}
        >
          {services.map((service, index) => (
            <article
              className={styles.serviceCard}
              key={`${service.title}-${index}`}
            >
              <span>0{index + 1}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.contact} id="contact">
        <div>
          <span className={styles.eyebrow}>03 / INFORMASI & KONTAK</span>
          <h2>Informasi & Kontak.</h2>
          <p>{name} siap membantu kebutuhan Anda.</p>
          {socialLinks.length > 0 && (
            <div className={styles.socialLinks} aria-label="Media sosial">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  title={item.label}
                >
                  <SocialIcon name={item.name} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className={styles.contactDetails}>
          {callUrl && (
            <a href={callUrl}>Panggil ↗</a>
          )}
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <WhatsAppIcon /> WhatsApp ↗
            </a>
          )}
          {email && <a href={`mailto:${email}`}>Email: {email}</a>}
          {address && <p>{address}</p>}
        </div>
      </section>

      {locationEnabled && locationLink && locationEmbedUrl && (
        <section id="location" style={{ padding: "clamp(28px, 6vw, 76px) clamp(22px, 6vw, 84px)", borderTop: "1px solid #d9d4ca", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 28, alignItems: "center" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <span className={styles.eyebrow}>04 / LOKASI</span>
            <h2 style={{ color: primary, fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.05, margin: 0 }}>
              Temukan Kami.
            </h2>
            <p style={{ color: "#625f58", lineHeight: 1.7, margin: 0 }}>
              {locationMode === "area"
                ? `Kami berada di wilayah ${areaName}.`
                : "Lihat lokasi kami pada peta Google Maps."}
            </p>
            <a
              href={locationLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "fit-content", minHeight: 44, padding: "10px 16px", background: primary, color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600 }}
            >
              {locationMode === "area" ? "Lihat Area di Google Maps ↗" : "Petunjuk Arah ↗"}
            </a>
            <small style={{ color: "#77736b", lineHeight: 1.5 }}>
              {locationMode === "area"
                ? "Peta menunjukkan wilayah umum, bukan titik alamat pribadi."
                : "Peta menunjukkan pin lokasi yang dibagikan oleh pemilik website."}
            </small>
          </div>
          <div style={{ overflow: "hidden", border: "1px solid #d9d4ca", background: "#eeeae2", minHeight: 280, aspectRatio: "16 / 9" }}>
            <iframe
              title={locationMode === "area" ? `Peta wilayah ${areaName}` : `Peta lokasi ${name}`}
              src={locationEmbedUrl}
              width="100%"
              height="100%"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              style={{ display: "block", width: "100%", height: "100%", minHeight: 280, border: 0 }}
            />
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <strong>{name}</strong>
        <span>{data.tagline}</span>
        <span>Website dibuat dengan TPW-LP</span>
      </footer>
    </main>
  )
}
