# TPW-LP — Progress

Last update: 2026-11-22

## Completed
- [x] Source V0 dan Git baseline.
- [x] Supabase client dan server helper.
- [x] Registrasi akun Supabase berhasil.
- [x] Login berhasil.
- [x] Identitas pengguna ditampilkan di dashboard.
- [x] Dashboard tanpa login diarahkan ke /login.
- [x] Navbar mengikuti session pengguna.
- [x] Guest memilih template diarahkan ke login.
- [x] Lima tabel inti Supabase dibuat.
- [x] Owner Admin berhasil didaftarkan dan aktif.
- [x] RPC submit, publish, reject, dan takedown dibuat.
- [x] Admin Console dan endpoint tindakan dibuat.
- [x] Admin search, filter template, dan Log Aktivitas dibuat.
- [x] WAHA terhubung melalui 10.0.0.250:3001.
- [x] WAHA session default berstatus WORKING.
- [x] Template registry lima kategori dibuat.
- [x] Business Profile renderer dibuat.
- [x] Business Profile editor dibuat.
- [x] Database landing_pages memiliki record Tahu Hejo.
- [x] Kolom domain_type dan revision_of ditambahkan.

## Current
- [ ] Dashboard masih menggunakan sebagian data demo.
- [ ] Dashboard perlu membaca landing_pages berdasarkan owner.
- [ ] Draft Tahu Hejo perlu ditampilkan dan dibuka kembali.
- [ ] Tiga template aktif perlu dihubungkan ke editor.
- [ ] Edit Published harus menggunakan mekanisme revisi.
- [ ] Upload gambar belum terhubung ke Supabase Storage.
- [ ] Admin dan tindakan moderasi perlu pengujian data nyata.

## Next
1. Dashboard real data dan pengelolaan draft.
2. Penyederhanaan dashboard dan panel domain.
3. Editor tiga template aktif.
4. Upload gambar dan Storage.
5. Revisi halaman Published.
6. Paket, masa aktif, pembayaran, dan LPF.
7. Publishing engine dan routing subdomain.
8. Integrasi notifikasi WAHA.
9. Deploy dan end-to-end acceptance.

## Known Gaps
- Dashboard masih memuat data demo Alia, Kopi Pagi,
  order, dan domain.
- Publishing engine belum dibuat.
- Routing suffix -lp dan -lpf belum aktif.
- Upload gambar belum selesai.
- Pembayaran dan aktivasi langganan belum diimplementasikan.
- WAHA API Key belum dikonfigurasi di environment TPW-LP.
- Node.js 20 perlu ditingkatkan ke Node.js 22 sebelum deploy.

## Working Rules
- Pertahankan desain V0.
- Satu task inti aktif pada satu waktu.
- Jangan mengubah Portal TPW atau Project Z.
- Jangan memperluas scope di luar keputusan MVP.
- Jangan menandai task DONE sebelum berfungsi dan diuji.
- Fokus sampai deploy dan publish.
