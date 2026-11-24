"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setError(
          error.message === "Email not confirmed"
            ? "Email belum dikonfirmasi. Silakan periksa kotak masuk email."
            : "Email atau password tidak sesuai. Periksa kembali data login."
        )
        return
      }

      router.replace("/dashboard")
      router.refresh()
    } catch {
      setError("Tidak dapat menghubungi layanan login. Coba kembali.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <Link href="/" className="brand auth-brand">
        <Image src="/tpw_new_0.png" alt="" width={32} height={32} className="brand-mark-image"/>
        <span className="brand-name">TPW<span>—LP</span></span>
      </Link>

      <Link href="/" className="auth-back">
        <ArrowLeft size={15}/> Kembali ke beranda
      </Link>

      <div className="auth-layout">
        <div className="auth-visual">
          <div className="auth-visual-text">
            <span className="eyebrow"><span className="eyebrow-dot"/> YOUR SPACE STARTS HERE</span>
            <h1>Selamat<br/>datang <span className="serif">kembali.</span></h1>
            <p>Website kamu menunggu untuk jadi lebih.</p>
          </div>
          <div className="auth-visual-stamp">TPW—LP<br/><small>MADE FOR YOUR NEXT BIG THING</small></div>
          <div className="auth-graphic">
            <span>01</span><span>BUILD<br/>SOMETHING<br/><em>YOURS.</em></span><span>✳</span>
          </div>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-form">
            <div className="section-tag">YOUR ACCOUNT</div>
            <h2>Log in.</h2>
            <p className="auth-lead">Masuk dan lanjutkan membangun kehadiran digitalmu.</p>

            <div className="auth-divider"><span/>MASUK DENGAN EMAIL<span/></div>

            <form className="login-form" onSubmit={login}>
              <label htmlFor="email">Email address</label>
              <div className="input-shell">
                <Mail size={17}/>
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

              <div className="password-label">
                <label htmlFor="password">Password</label>
                <Link href="/forgot-password" className="auth-forgot">
                  Lupa password?
                </Link>
              </div>
              <div className="input-shell">
                <LockKeyhole size={17}/>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />
                <button
                  className="toggle-password"
                  type="button"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>

              {error && <p role="alert" className="auth-error">{error}</p>}

              <button className="button auth-submit" type="submit" disabled={loading}>
                {loading ? "Memeriksa akun..." : "Masuk ke akun"}
                <ArrowRight size={17}/>
              </button>
            </form>

            <p className="register-prompt">
              Belum punya akun? <Link href="/register">Buat akun gratis <ArrowRight size={14}/></Link>
            </p>

            <p className="auth-terms">
              Dengan masuk, kamu menyetujui <a href="#terms">Ketentuan Layanan</a> dan <a href="#privacy">Kebijakan Privasi</a>.
            </p>
          </div>

          <div className="auth-form-footer">
            <span>© 2026 TPW-LP</span>
            <span>DESIGNED FOR YOUR DIGITAL PRESENCE</span>
          </div>
        </div>
      </div>
    </main>
  )
}
