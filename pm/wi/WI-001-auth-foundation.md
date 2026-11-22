# WI-001 — Auth Foundation

Project: TPW-LP
Task: LP-004
Status: DOING

## Tujuan
Menyediakan registrasi dan login pelanggan menggunakan Supabase Auth.

## Cakupan
- Supabase browser client.
- Supabase server client.
- Proxy untuk perlindungan dashboard.
- Registrasi email dan password.
- Login email dan password.
- OAuth Google sebagai opsi, menunggu konfigurasi provider.
- Auth callback.

## Kriteria penerimaan
- [x] File fondasi autentikasi tersedia.
- [x] TypeScript check berhasil.
- [ ] Production build berhasil dengan validasi TypeScript aktif.
- [ ] Registrasi pelanggan berhasil.
- [ ] Login pelanggan berhasil.
- [ ] Dashboard terlindungi untuk pengguna yang belum login.
- [ ] Logout dan sesi berfungsi dengan benar.

## Catatan
Jangan menyimpan service-role key di browser.
Jangan menandai WI selesai sebelum pengujian autentikasi nyata berhasil.
