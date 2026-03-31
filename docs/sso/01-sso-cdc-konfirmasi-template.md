# Template Konfirmasi Integrasi SSO-CDC

Gunakan dokumen ini untuk sinkronisasi antara tim CDC dan tim SSO sebelum implementasi dan sebelum go-live.

## 1) Identitas Integrasi

- Nama aplikasi: `CDC Tracer`
- Environment: `[DEV/STAGING/PROD]`
- Domain frontend CDC: `[https://....]`
- Domain backend CDC: `[https://....]`
- PIC CDC: `[nama - kontak]`
- PIC SSO: `[nama - kontak]`
- Tanggal sinkronisasi: `[YYYY-MM-DD]`

## 2) Model Integrasi (Wajib Disepakati)

| Item | Nilai yang disepakati | Status |
|---|---|---|
| Protokol | `[Custom Token Relay / OIDC Auth Code / SAML / CAS]` | `[Confirmed/Pending]` |
| Pola login | `[Redirect ke SSO lalu kembali ke CDC]` | `[Confirmed/Pending]` |
| Pola kirim token ke CDC | `[Query token / one-time ticket / code exchange]` | `[Confirmed/Pending]` |
| Mekanisme refresh sesi | `[Ya/Tidak + cara]` | `[Confirmed/Pending]` |
| Single Logout (SLO) | `[Ya/Tidak + alur]` | `[Confirmed/Pending]` |

## 3) Spesifikasi Token dan Validasi

| Item | Nilai yang disepakati | Status |
|---|---|---|
| Format token | `[JWT/Opaque]` | `[Confirmed/Pending]` |
| Signing algorithm | `[RS256/HS256/dll]` | `[Confirmed/Pending]` |
| Issuer (`iss`) | `[value]` | `[Confirmed/Pending]` |
| Audience (`aud`) | `[value]` | `[Confirmed/Pending]` |
| TTL access token | `[mis. 15 menit]` | `[Confirmed/Pending]` |
| TTL refresh token | `[mis. 7 hari / tidak ada]` | `[Confirmed/Pending]` |
| Endpoint validasi token | `[GET/POST ...]` | `[Confirmed/Pending]` |
| Format respons validasi | `[schema JSON]` | `[Confirmed/Pending]` |
| Error code standar | `[401/403 + body]` | `[Confirmed/Pending]` |

## 4) Kontrak Data User (Claim/Field)

| Field | Wajib | Contoh | Keterangan |
|---|---|---|---|
| `sub` / `user_id` | Ya | `12345` | ID unik global dari SSO |
| `name` | Ya | `Budi Santoso` | Nama tampil |
| `email` | Ya | `budi@kampus.ac.id` | Email pengguna |
| `role` / `group` | Ya | `ALUMNI` | Untuk mapping permission CDC |
| `nim` | Kondisional | `2020123456` | Wajib untuk user alumni |
| `nip` | Kondisional | `1987...` | Wajib untuk staf/dosen bila dibutuhkan |
| `faculty_code` | Opsional | `FT` | Filtering konten/otorisasi |
| `study_program_code` | Opsional | `TI` | Filtering konten/otorisasi |

Catatan aturan bisnis CDC:
- Jika target kuisioner = `alumni`, user wajib punya `nim` valid.
- Jika target kuisioner = `umum`, user boleh tanpa `nim`.

## 5) Otorisasi dan Mapping Role

| Role/Group dari SSO | Role internal CDC | Hak akses utama | Status |
|---|---|---|---|
| `[SUPERADMIN]` | `admin_super` | Full admin | `[Confirmed/Pending]` |
| `[CDC_ADMIN]` | `admin_cdc` | Kelola kuisioner/konten/lowongan | `[Confirmed/Pending]` |
| `[ALUMNI]` | `alumni` | Isi kuisioner alumni + akses public | `[Confirmed/Pending]` |
| `[PUBLIC/GENERAL]` | `public_user` | Isi kuisioner umum + akses public | `[Confirmed/Pending]` |

## 6) Keamanan Integrasi

| Item | Nilai yang disepakati | Status |
|---|---|---|
| Redirect URI whitelist | `[daftar URL CDC]` | `[Confirmed/Pending]` |
| Allowed origin (CORS) | `[daftar origin CDC]` | `[Confirmed/Pending]` |
| Mitigasi token di URL | `[TTL pendek/one-time exchange/cleanup URL]` | `[Confirmed/Pending]` |
| Proteksi replay | `[nonce/jti/one-time use]` | `[Confirmed/Pending]` |
| Clock skew toleransi | `[mis. 60 detik]` | `[Confirmed/Pending]` |

## 7) Operasional dan Reliability

| Item | Nilai yang disepakati | Status |
|---|---|---|
| Timeout API SSO | `[mis. 10-15 detik]` | `[Confirmed/Pending]` |
| Retry policy CDC | `[mis. 1x exponential backoff]` | `[Confirmed/Pending]` |
| Rate limit endpoint auth | `[value]` | `[Confirmed/Pending]` |
| SLA layanan SSO | `[mis. 99.9%]` | `[Confirmed/Pending]` |
| Incident contact | `[channel + PIC on-call]` | `[Confirmed/Pending]` |

## 8) UAT dan Go-Live Gate

Checklist minimal:
- [ ] Login SSO -> CDC sukses untuk role `admin`.
- [ ] Login SSO -> CDC sukses untuk role `alumni`.
- [ ] Login SSO -> CDC sukses untuk role `public_user`.
- [ ] Role tidak dikenal ditangani aman (default deny atau fallback role terbatas).
- [ ] Logout dari CDC bekerja sesuai kesepakatan.
- [ ] Logout dari SSO (global) memutus sesi CDC sesuai kesepakatan.
- [ ] Kuisioner alumni menolak submit tanpa `nim`.
- [ ] Kuisioner umum bisa submit tanpa `nim`.
- [ ] Tidak ada token sensitif tertinggal di URL/history/log.

## 9) Persetujuan

- Tim CDC: `[nama, jabatan, tanggal]`
- Tim SSO: `[nama, jabatan, tanggal]`

