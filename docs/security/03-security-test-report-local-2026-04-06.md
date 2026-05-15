# Security Test Report (Local) - 2026-04-06

Scope eksekusi: audit cepat berbasis code/config + runtime lokal yang tersedia.

Legenda status:
- `PASS`: lulus pada scope pengujian lokal.
- `FAIL`: ada temuan yang perlu diperbaiki.
- `PARTIAL`: kontrol ada, tapi belum tervalidasi end-to-end.
- `BLOCKED`: tidak bisa diuji penuh pada lingkungan ini.

## Hasil SEC-01 s.d. SEC-25

| ID | Status | Ringkasan Hasil |
|---|---|---|
| SEC-01 | PARTIAL | Guard runtime production sudah ditambahkan: aplikasi akan gagal boot jika `APP_DEBUG=true` pada `APP_ENV=production`; env lokal masih `APP_DEBUG=true`. |
| SEC-02 | PARTIAL | Secret scan + preflight sudah ditambahkan (`scan-secrets.php`, `scan-secrets.sh`, `preflight-security-check.sh`), namun secret management terpusat & rotasi belum tervalidasi penuh. |
| SEC-03 | PASS | Header keamanan API aktif: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. |
| SEC-04 | BLOCKED | Uji TLS/HSTS butuh domain HTTPS staging/production. |
| SEC-05 | PASS | CORS whitelist berjalan: origin known di-allow, origin unknown tidak mendapat `Access-Control-Allow-Origin`. |
| SEC-06 | PASS | Test otomatis lulus: login dibatasi setelah 5 gagal (`SecurityControlsTest::test_login_is_rate_limited_after_five_failed_attempts`). |
| SEC-07 | PASS | Test otomatis lulus: logout menghapus personal access token aktif (`SecurityControlsTest::test_logout_invalidates_current_access_token`). |
| SEC-08 | PARTIAL | Session cookie `secure` kini default `true` saat `APP_ENV=production`; env lokal non-HTTPS tetap non-secure sesuai kebutuhan dev. |
| SEC-09 | PASS | Test otomatis lintas scope lulus (`AlumniScopeAuthorizationTest`): admin fakultas/prodi hanya melihat data dalam scope-nya. |
| SEC-10 | PASS | Test otomatis anti-IDOR lulus: akses detail/update lintas scope ditolak (`AlumniScopeAuthorizationTest`, `SecurityControlsTest`). |
| SEC-11 | PASS | Query SQL dominan memakai binding parameter; tidak ditemukan raw SQL concat berbahaya pada audit cepat. |
| SEC-12 | PASS | Potensi XSS ditutup: modal CSV tidak lagi menggunakan interpolasi `innerHTML`, diganti DOM API + `textContent`/`textarea.value`. |
| SEC-13 | PASS | Test otomatis lulus: throttle endpoint sensitif tervalidasi pada `login` dan `exports/responses` (`SecurityControlsTest`). |
| SEC-14 | PASS | Upload import alumni tervalidasi (`file`, `mimes:csv,txt`, `max`). |
| SEC-15 | BLOCKED | `composer audit` gagal timeout ke Packagist advisory API pada environment ini. |
| SEC-16 | PARTIAL | Setelah upgrade dependency, tersisa 1 vulnerability `high` pada `xlsx` (no fix upstream). Sudah dipasang policy allowlist sementara di CI dengan expiry. |
| SEC-17 | BLOCKED | Tool DAST (OWASP ZAP) tidak tersedia di environment saat ini. |
| SEC-18 | PASS | Audit log aksi kritikal tersedia di banyak endpoint (auth, alumni, questionnaire, export, response). |
| SEC-19 | PARTIAL | Paket backup/restore sudah ditambahkan (`deploy/ubuntu/backup/*`), namun simulasi restore terjadwal di server belum dieksekusi pada audit ini. |
| SEC-20 | PARTIAL | Redis terkonfigurasi localhost, tetapi verifikasi bind/firewall server target belum dilakukan. |
| SEC-21 | PARTIAL | Guard runtime production ditambahkan untuk menolak user DB superuser + disediakan SQL template least-privilege (`deploy/ubuntu/mysql/01-create-app-user.sql`); env lokal masih `root`. |
| SEC-22 | PARTIAL | Baseline anti-abuse Nginx ditambahkan (`limit_req/limit_conn`, timeout header/body, login-specific limit), perlu uji di server aktif. |
| SEC-23 | PARTIAL | Template hardening php.ini ditambahkan (`deploy/ubuntu/php/conf.d/98-cdc-security.ini`), belum tervalidasi di runtime server target. |
| SEC-24 | PARTIAL | Template monitoring & alert rules ditambahkan (`deploy/ubuntu/monitoring/*`), namun pengiriman alert real channel belum dibuktikan. |
| SEC-25 | PASS | Runbook incident response keamanan tersedia dan siap dipakai (`docs/security/04-incident-response-runbook-cdc.md`). |

## Evidence Utama

1. Backend env/config:
   - `APP_DEBUG=true`, `DB_USERNAME=root`: `ModulCDC/.env`
   - Session config: `config/session.php`
2. Header/CORS runtime:
   - Endpoint `GET /api/ping` menunjukkan security headers aktif.
   - Origin known vs unknown diuji via `Invoke-WebRequest`.
3. Rate limiter:
   - `app/Providers/AppServiceProvider.php` (`login/public/submit/export`).
4. Auth token handling:
   - `app/Http/Controllers/AuthController.php` (`logout` menghapus current token).
5. XSS candidate:
   - `src/views/AdminAlumniView.vue` sudah dipatch ke DOM API aman (tanpa `innerHTML` interpolasi).
6. Dependency audit:
   - Frontend `npm audit --omit=dev`: tersisa advisory `xlsx` (no fix upstream), sudah di-allowlist sementara via policy CI.
   - Backend `composer audit`: blocked timeout.
7. Guard production:
   - `app/Providers/AppServiceProvider.php`: fail-fast guard untuk `APP_DEBUG` dan DB superuser saat `production`.
8. Least-privilege DB template:
   - `deploy/ubuntu/mysql/01-create-app-user.sql`.
9. Security deploy toolkit:
   - `deploy/ubuntu/security/preflight-security-check.sh`
   - `deploy/ubuntu/security/scan-secrets.php`
   - `deploy/ubuntu/security/scan-secrets.sh`
10. Backup/restore toolkit:
   - `deploy/ubuntu/backup/backup_cdc.sh`
   - `deploy/ubuntu/backup/restore_cdc.sh`
   - `deploy/ubuntu/backup/verify_restore.sh`
11. Nginx/PHP hardening templates:
   - `deploy/ubuntu/nginx/security-hardening.snippet`
   - `deploy/ubuntu/php/conf.d/98-cdc-security.ini`
12. Monitoring + IR:
   - `deploy/ubuntu/monitoring/prometheus-alert-rules.yml`
   - `docs/security/04-incident-response-runbook-cdc.md`
13. Security regression tests (backend):
   - `tests/Feature/SecurityControlsTest.php` (rate-limit login/export, token invalidation, authorization/IDOR export, production guards).
14. CI security gate:
   - `ModulCDC/.github/workflows/backend-ci.yml`
   - `Tracerv2/.github/workflows/frontend-ci.yml`
15. Frontend dependency mitigation:
   - Upgrade `axios` ke `1.14.0` dan `jspdf` ke `4.2.1`.
   - Policy file `scripts/security/npm-audit-policy.json` + checker `scripts/security/check-npm-audit.mjs`.
16. Scope authorization regression tests (backend):
   - `tests/Feature/AlumniScopeAuthorizationTest.php` (index scope fakultas/prodi, deny cross-scope view/update, allow super-admin delete).
