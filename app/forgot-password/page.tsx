"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { createClient } from "@/lib/supabase/client"
import { getAuthRedirectUrl } from "@/lib/auth/redirect-url"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage("")
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()
      const redirectTo = getAuthRedirectUrl("/auth/callback?next=/reset-password")

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      )

      if (error) {
        setError("Permintaan reset belum dapat diproses. Silakan coba kembali.")
        return
      }

      setMessage(
        "Jika alamat email terdaftar, instruksi reset password akan dikirim. Periksa inbox dan folder spam."
      )
    } catch {
      setError("Tidak dapat menghubungi layanan. Silakan coba kembali.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <Link href="/" className="brand auth-brand">
        <span className="brand-name">TPW<span>—LP</span></span>
      </Link>

      <Link href="/login" className="auth-back">Kembali ke login</Link>

      <div className="auth-layout">
        <div className="auth-visual">
          <div className="auth-visual-text">
            <span className="eyebrow">ACCOUNT RECOVERY</span>
            <h1>Ambil kembali<br /><span className="serif">aksesmu.</span></h1>
            <p>Kami akan mengirimkan instruksi untuk membuat password baru.</p>
          </div>
          <div className="auth-visual-stamp">TPW—LP</div>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-form">
            <div className="section-tag">ACCOUNT RECOVERY</div>
            <h2>Lupa password?</h2>
            <p className="auth-lead">
              Masukkan email yang kamu gunakan saat mendaftar.
            </p>

            <form className="login-form" onSubmit={submit}>
              <label htmlFor="email">Email address</label>
              <div className="input-shell">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              {error && <p role="alert" className="auth-error">{error}</p>}
              {message && <p role="status">{message}</p>}

              <button className="button auth-submit" type="submit" disabled={loading}>
                {loading ? "Mengirim..." : "Kirim instruksi reset"}
              </button>
            </form>

            <p className="register-prompt">
              Ingat password? <Link href="/login">Masuk</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
