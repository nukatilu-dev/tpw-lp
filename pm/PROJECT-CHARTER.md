# TPW-LP — Project Charter

Project ID: TPWLP
Product: TPW Landing Page
Repository: tpw-dev/project-lp/source
Branch: main

## Objective
Platform untuk pelanggan membuat, mengedit, menyimpan,
dan mempublikasikan landing page bisnis sendiri.

## MVP Scope
1. Public website dan pricing.
2. Registrasi, login, dan session pelanggan.
3. Customer dashboard berbasis Supabase.
4. Lima template dalam katalog.
5. Tiga template aktif untuk pembuatan draft awal.
6. Editor konten dan upload gambar.
7. Live preview.
8. Admin review, publish, reject, dan takedown.
9. Publishing engine dan customer subdomain.
10. Trial 7 hari dan langganan manual.
11. Pembayaran transfer dan konfirmasi Admin.
12. Notifikasi WhatsApp melalui WAHA.
13. Production deployment dan acceptance.

## Product Decisions
- Pertahankan desain dan source V0.
- Koreksi typo Lending Page menjadi Landing Page.
- Harga:
  - Rp50.000 / 1 bulan
  - Rp125.000 / 3 bulan
  - Rp250.000 / 6 bulan
- Trial 7 hari.
- Pembayaran manual melalui transfer.
- Tidak menggunakan payment gateway otomatis.
- Template aktif awal:
  Business Profile, Digital Menu, Product Catalog.
- Personal CV dan Creative Portfolio tetap dalam katalog.
- LPF gratis bersyarat untuk Business Profile dan Personal CV,
  sesuai ketentuan kelayakan dan subscription.
- Domain reguler: {slug}-lp.tpw.my.id.
- Domain LPF: {slug}-lpf.tpw.my.id.
- Daftar website vertikal, maksimal tiga terlihat sebelum scroll.
- Draft dapat dibuka kembali melalui Edit Draft.
- Website Published yang diedit dibuat sebagai revisi.
- Versi publik tidak berubah sebelum revisi disetujui Admin.
- Admin khusus Owner mengelola validasi dan publikasi.
- WAHA untuk notifikasi pelanggan melalui server.
- Supabase existing digunakan sebagai backend dan storage.
- Deployment menggunakan server, Cloudflare Tunnel,
  dan Nginx Proxy Manager.

## Out of Scope
- Payment gateway otomatis.
- AI page generator.
- Animated template preview.
- Telegram CS.
- Custom domain automation.
- Ekspansi fitur di luar kebutuhan MVP.

## Definition of Done
Pelanggan dapat mendaftar, membuat website, mengedit,
mengunggah gambar, menyimpan draft, mengajukan review,
membayar paket, dan mengakses website melalui subdomain.
Admin dapat melakukan validasi, publikasi, dan takedown.
