# CDC Security Incident Response Runbook (SEC-25)

Dokumen ini dipakai saat terjadi insiden keamanan pada sistem CDC.

## 1) Klasifikasi Severity

1. `SEV-1`: kebocoran data sensitif, layanan inti down total, compromise akun admin.
2. `SEV-2`: degradasi signifikan, anomali akses data lintas role, serangan berulang.
3. `SEV-3`: temuan minor, tidak berdampak langsung ke data sensitif.

## 2) Tim Respon Minimum

1. Incident Commander (PIC teknis)
2. Backend engineer
3. Infrastruktur/DevOps
4. Perwakilan pemilik sistem (CDC)

## 3) Prosedur 0-30 Menit

1. Buat tiket insiden + timestamp awal.
2. Tentukan severity awal.
3. Isolasi cepat:
   - nonaktifkan endpoint yang diserang (temporary block/rate-limit ketat).
   - suspend token/sesi admin yang dicurigai.
4. Simpan bukti awal:
   - log aplikasi, Nginx access/error, DB log, snapshot metrik.

## 4) Containment (30-120 Menit)

1. Terapkan mitigasi teknis:
   - rotasi key/token yang terpapar.
   - ubah password DB/app account jika dicurigai bocor.
   - aktifkan rule WAF/rate limit tambahan.
2. Validasi bahwa serangan berhenti (monitor 5xx, login fail spikes, query anomali).
3. Dokumentasikan semua command/perubahan.

## 5) Eradication & Recovery

1. Hilangkan akar masalah (patch code/config).
2. Jalankan regression test minimum:
   - login/logout
   - endpoint export/import
   - role authorization lintas fakultas/prodi
3. Jika perlu restore data:
   - gunakan prosedur `deploy/ubuntu/backup/restore_cdc.sh`.
4. Aktivasi layanan bertahap + monitor ketat minimal 24 jam.

## 6) Komunikasi

1. Internal update tiap 30-60 menit untuk `SEV-1/SEV-2`.
2. Komunikasi eksternal mengikuti kebijakan kampus.
3. Semua komunikasi via channel resmi (hindari chat personal tanpa arsip).

## 7) Post-Incident (maks 3 hari kerja)

1. Postmortem tanpa blame.
2. Daftar tindakan pencegahan:
   - patch permanen
   - update monitoring rules
   - update checklist keamanan
3. Tetapkan owner + deadline tiap action item.
