# Security Checklist CDC (Laravel + Vue + Nginx + Redis)

Dokumen ini dipakai untuk audit keamanan sebelum go-live dan audit berkala.

## 1) Scope

- Frontend: Vue (`Tracerv2`)
- Backend: Laravel API (`ModulCDC`)
- Infra: Nginx, PHP-FPM, MariaDB/MySQL, Redis
- Akses: role `super_admin`, `admin_universitas`, `admin_fakultas`, `admin_prodi`

## 2) Aturan Eksekusi

- Jalankan di lingkungan `staging` yang meniru production.
- Gunakan data uji (bukan data sensitif asli).
- Simpan bukti tiap item: screenshot, log, output command, atau report scanner.
- Status item: `PASS`, `FAIL`, `N/A`.

## 3) Checklist Inti (Wajib)

| ID | Area | Item Uji | Cara Uji Singkat | Kriteria Lulus | Bukti | Status |
|---|---|---|---|---|---|---|
| SEC-01 | Konfigurasi | `APP_DEBUG=false` di server | Cek `.env` + respon error publik | Error publik tidak menampilkan stacktrace | Screenshot + config dump |  |
| SEC-02 | Konfigurasi | Secret/key tidak hardcoded | Scan repo + env | Tidak ada secret di source code | Hasil scan (`gitleaks`/manual) |  |
| SEC-03 | HTTP Security | Header keamanan aktif | Cek response header | Ada `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, CSP sesuai kebutuhan | Screenshot DevTools/curl |  |
| SEC-04 | TLS | HTTPS wajib | Akses HTTP & HTTPS | HTTP redirect ke HTTPS, sertifikat valid | Screenshot browser + SSL check |  |
| SEC-05 | CORS | Origin dibatasi | Uji origin liar | Origin tidak dikenal ditolak | Curl/Postman result |  |
| SEC-06 | Auth | Brute-force login dibatasi | 20+ login gagal beruntun | Throttle/limit aktif, tidak bisa brute-force bebas | Log + response API |  |
| SEC-07 | Auth | Logout invalidasi token | Login, logout, pakai token lama | Token lama ditolak (`401`) | Postman collection |  |
| SEC-08 | Session | Cookie aman (jika pakai cookie) | Cek atribut cookie | `HttpOnly`, `Secure`, `SameSite` sesuai policy | Screenshot browser |  |
| SEC-09 | Authorization | Isolasi data role fakultas/prodi | Uji akses lintas scope | User tidak bisa lihat/edit data di luar scope | Bukti API response |  |
| SEC-10 | Authorization | Cegah IDOR endpoint detail/update/delete | Ganti ID milik user lain | API menolak (`403/404`) | Postman script |  |
| SEC-11 | Input Validation | SQLi basic payload | Kirim payload injeksi di query/filter/form | Tidak terjadi bypass/DB error bocor | Request/response log |  |
| SEC-12 | Input Validation | XSS stored/reflected | Input `<script>` pada field teks | Script tidak dieksekusi di UI/admin | Screenshot hasil render |  |
| SEC-13 | API | Rate-limit endpoint sensitif | Uji endpoint login/export/report | Rate-limit aktif, server tetap responsif | Hasil test + log |  |
| SEC-14 | Upload/Import | Validasi file import ketat | Upload ekstensi/ukuran salah | File ilegal ditolak | Bukti response |  |
| SEC-15 | Dependency | Audit package backend | Jalankan `composer audit` | Tidak ada vulnerability `critical/high` tanpa mitigasi | Output command |  |
| SEC-16 | Dependency | Audit package frontend | Jalankan `npm audit --production` | Tidak ada `critical/high` tanpa mitigasi | Output command |  |
| SEC-17 | DAST | Scan OWASP ZAP baseline | Scan URL staging | Tidak ada temuan `High`, `Medium` ditindaklanjuti | Report ZAP |  |
| SEC-18 | Logging | Audit log aksi admin | Uji CRUD kritikal | Log tercatat lengkap (aktor, waktu, aksi) | Screenshot/log extract |  |
| SEC-19 | Backup | Backup & restore diuji | Simulasi restore | Restore berhasil dalam target waktu | Berita acara uji restore |  |
| SEC-20 | Redis | Redis tidak terbuka publik | Cek bind/firewall | Redis hanya internal/private network | Config + netstat |  |

## 4) Checklist Tambahan (Disarankan)

| ID | Area | Item Uji | Kriteria Lulus | Status |
|---|---|---|---|---|
| SEC-21 | DB | User DB least privilege | User app bukan superuser DB |  |
| SEC-22 | Nginx | Limit request body/timeout aman | Tidak mudah DoS payload besar |  |
| SEC-23 | PHP-FPM | `expose_php=Off` dan hardening php.ini | Informasi versi sensitif tidak bocor |  |
| SEC-24 | Monitoring | Alert 5xx, latency, CPU, disk, DB | Alert aktif dan terkirim |  |
| SEC-25 | IR | Runbook insiden keamanan | Ada SOP isolasi, rotasi key, rollback |  |

## 5) Command Cepat (Evidence)

### Backend

```bash
composer audit
php artisan route:list
php artisan config:show app
```

### Frontend

```bash
npm audit --production
npm run build
```

### Header/TLS (contoh)

```bash
curl -I https://domain-cdc-anda
curl -I http://domain-cdc-anda
```

## 6) Exit Criteria (Siap Go-Live)

- Semua item `SEC-01` s/d `SEC-20` berstatus `PASS` atau ada mitigasi tertulis + approval.
- Tidak ada vulnerability `critical`.
- Temuan `high` harus ditutup atau punya compensating control yang disetujui.
- Bukti audit tersimpan rapi (folder report + tanggal eksekusi).

## 7) Frekuensi Audit

- Pre go-live: wajib penuh.
- Rutin bulanan: `SEC-06`, `SEC-09`, `SEC-10`, `SEC-15`, `SEC-16`, `SEC-17`, `SEC-18`.
- Setelah perubahan besar auth/role/endpoint: ulang minimal `SEC-06` s/d `SEC-13`.
