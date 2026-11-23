"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function register(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.session) {
        setMessage("Akun berhasil dibuat. Silakan masuk ke halaman login.")
      } else {
        setMessage(
          "Pendaftaran diterima. Periksa email untuk konfirmasi akun. Setelah konfirmasi, silakan login."
        )
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat mendaftar."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <Link href="/" className="brand auth-brand">
        <span className="brand-name">TPW<span>—LP</span></span>
      </Link>

      <Link href="/" className="auth-back">
        <ArrowLeft size={15}/> Kembali ke beranda
      </Link>

      <div className="auth-layout">
        <div className="auth-visual">
          <div className="auth-visual-text">
            <span className="eyebrow">
              <span className="eyebrow-dot"/> YOUR SPACE STARTS HERE
            </span>
            <h1>Mulai cerita<br/><span className="serif">digitalmu.</span></h1>
            <p>Satu akun untuk membangun rumah digital milikmu.</p>
          </div>
          <div className="auth-visual-stamp">
            TPW—LP<br/><small>MADE FOR YOUR NEXT BIG THING</small>
          </div>
          <div className="auth-graphic">
            <span>01</span>
            <span>BUILD<br/>SOMETHING<br/><em>YOURS.</em></span>
            <span>✳</span>
          </div>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-form">
            <div className="section-tag">CREATE ACCOUNT</div>
            <h2>Daftar.</h2>
            <p className="auth-lead">
              Buat akun dan mulai membangun landing page.
            </p>

            <form className="login-form" onSubmit={register}>
              <label htmlFor="name">Nama lengkap</label>
              <div className="input-shell">
                <input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nama kamu"
                  autoComplete="name"
                  required
                />
              </div>

              <label htmlFor="email">Email address</label>
              <div className="input-shell">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              <label htmlFor="password">Password (minimal 8 karakter)</label>
              <div className="input-shell">
                <input
                  id="password"
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Buat password"
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && <p role="alert" className="auth-error">{error}</p>}
              {message && <p role="status">{message}</p>}

              <button
                className="button auth-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? "Mendaftarkan..." : "Buat akun"}
                <ArrowRight size={17}/>
              </button>
            </form>

            <p className="register-prompt">
              Sudah punya akun?{" "}
              <Link href="/login">Masuk <ArrowRight size={14}/></Link>
            </p>
          </div>

          <div className="auth-form-footer">
            <span>© 2026 TPW-LP</span>
            <span>YOUR DIGITAL PRESENCE</span>
          </div>
        </div>
      </div>
    </main>
  )
}
