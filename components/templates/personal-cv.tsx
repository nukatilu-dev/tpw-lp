import type { CSSProperties } from "react"

type CV = {
  fullName?: string
  profession?: string
  headline?: string
  biography?: string
  photo?: string
  skills?: string[]
  experiences?: { position: string; company: string; period: string; description: string }[]
  education?: { institution: string; degree: string; period: string }[]
  contact?: { email?: string; phone?: string; linkedin?: string }
  theme?: { primary?: string; accent?: string }
}

export default function PersonalCVTemplate({ content }: { content: Record<string, unknown> }) {
  const cv = content as CV
  const primary = cv.theme?.primary || "#172c4b"
  const accent = cv.theme?.accent || "#c69b55"
  const style = { "--cv-primary": primary, "--cv-accent": accent } as CSSProperties

  return (
    <main style={{ ...style, color: "#263247", background: "#f5f6f8", fontFamily: "Arial,sans-serif", minHeight: "100vh" }}>
      <header style={{ background: primary, color: "white", padding: "64px 24px", textAlign: "center" }}>
        {cv.photo && <img src={cv.photo} alt={cv.fullName || "Foto profil"} style={{ width: 124, height: 124, borderRadius: "50%", objectFit: "cover", border: `4px solid ${accent}`, marginBottom: 20 }} />}
        <h1 style={{ fontSize: "clamp(30px,5vw,48px)", margin: "0 0 10px" }}>{cv.fullName || "Nama Lengkap"}</h1>
        <p style={{ color: accent, fontSize: 18, margin: 0 }}>{cv.profession || "Profesi Anda"}</p>
        <p style={{ maxWidth: 700, margin: "20px auto 0", lineHeight: 1.7 }}>{cv.headline}</p>
      </header>

      <div style={{ maxWidth: 900, margin: "auto", padding: "42px 22px", display: "grid", gap: 34 }}>
        <section>
          <h2 style={{ color: primary, borderBottom: `2px solid ${accent}`, paddingBottom: 10 }}>Tentang Saya</h2>
          <p style={{ lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{cv.biography}</p>
        </section>

        {!!cv.skills?.length && <section>
          <h2 style={{ color: primary, borderBottom: `2px solid ${accent}`, paddingBottom: 10 }}>Keahlian</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {cv.skills.filter(Boolean).map((skill, i) => <span key={i} style={{ background: "#e6eaf0", padding: "9px 15px", borderRadius: 20 }}>{skill}</span>)}
          </div>
        </section>}

        {!!cv.experiences?.length && <section>
          <h2 style={{ color: primary, borderBottom: `2px solid ${accent}`, paddingBottom: 10 }}>Pengalaman Kerja</h2>
          {cv.experiences.map((item, i) => <article key={i} style={{ margin: "20px 0" }}>
            <h3 style={{ marginBottom: 5 }}>{item.position}</h3>
            <strong>{item.company}</strong>
            <p style={{ color: "#718096", margin: "5px 0" }}>{item.period}</p>
            <p style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{item.description}</p>
          </article>)}
        </section>}

        {!!cv.education?.length && <section>
          <h2 style={{ color: primary, borderBottom: `2px solid ${accent}`, paddingBottom: 10 }}>Pendidikan</h2>
          {cv.education.map((item, i) => <article key={i} style={{ margin: "18px 0" }}>
            <h3 style={{ marginBottom: 5 }}>{item.institution}</h3>
            <p style={{ margin: 0 }}>{item.degree} · {item.period}</p>
          </article>)}
        </section>}

        <section>
          <h2 style={{ color: primary, borderBottom: `2px solid ${accent}`, paddingBottom: 10 }}>Kontak</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {cv.contact?.email && <a href={`mailto:${cv.contact.email}`}>{cv.contact.email}</a>}
            {cv.contact?.phone && <a href={`tel:${cv.contact.phone}`}>{cv.contact.phone}</a>}
            {cv.contact?.linkedin && <a href={cv.contact.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
          </div>
        </section>
      </div>
      <footer style={{ textAlign: "center", padding: 24, color: "#778094", fontSize: 12 }}>Personal CV · TPW-LP</footer>
    </main>
  )
}
