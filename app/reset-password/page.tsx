"use client"

import Link from "next/link"
import { useEffect, useState, type FormEvent } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [ready, setReady] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function checkSession() {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()

      if (!active) return

      setValidSession(!error && Boolean(data.user))
      setReady(true)
    }

    checkSession()

    return () => {
      active = false
    }
  }, [])

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setMessage("")

    if (password.length < 8) {
      setError("Password minimal 8 karakter.")
      return
    }

    if (password !== confirmation) {
      setError("Konfirmasi password tidak sama.")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError("Password belum dapat diperbarui. Silakan minta tautan reset baru.")
        return
      }

      setMessage("Password berhasil diperbarui. Silakan lanjut ke dashboard.")
    } catch {
      setError("Terjadi kesalahan. Silakan coba kembali.")
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return <main className="auth-page"><div className="auth-form">Memeriksa sesi reset...</div></main>
  }

  return (
    <main className="auth-page">
      <Link href="/" className="brand auth-brand">
        <span className="brand-name">TPW<span>—LP</span></span>
      </Link>

      <div className="auth-layout">
        <div className="auth-visual">
          <div className="auth-visual-text">
            <span className="eyebrow">SECURE YOUR ACCOUNT</span>
            <h1>Password<br /><span className="serif">baru.</span></h1>
            <p>Buat password baru untuk melanjutkan menggunakan TPW-LP.</p>
          </div>
          <div className="auth-visual-stamp">TPW—LP</div>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-form">
            <div className="section-tag">ACCOUNT RECOVERY</div>
            <h2>Reset password.</h2>

            {!validSession ? (
              <>
                <p className="auth-lead">
                  Sesi reset tidak tersedia atau sudah kedaluwarsa. Silakan minta tautan reset baru.
                </p>
                <Link className="button auth-submit" href="/forgot-password">
                  Minta tautan reset baru
                </Link>
              </>
            ) : (
              <>
                <p className="auth-lead">Gunakan password baru minimal 8 karakter.</p>
                <form className="login-form" onSubmit={submit}>
                  <label htmlFor="password">Password baru</label>
                  <div className="input-shell">
                    <input
                      id="password"
                      type="password"
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <label htmlFor="confirmation">Ulangi password baru</label>
                  <div className="input-shell">
                    <input
                      id="confirmation"
                      type="password"
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      required
                    />
                  </div>

                  {error && <p role="alert" className="auth-error">{error}</p>}
                  {message && <p role="status">{message}</p>}

                  {message ? (
                    <Link className="button auth-submit" href="/dashboard">
                      Lanjut ke dashboard
                    </Link>
                  ) : (
                    <button className="button auth-submit" type="submit" disabled={loading}>
                      {loading ? "Memperbarui..." : "Simpan password baru"}
                    </button>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
