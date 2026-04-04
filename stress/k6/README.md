# Paket Load Test k6 - CDC Tracer

Paket ini berisi skenario lengkap untuk uji performa sistem CDC:
- `smoke.js`: validasi cepat endpoint inti.
- `baseline.js`: beban normal harian.
- `stress.js`: uji sampai target puncak (default hingga 5000 VUs).
- `soak.js`: uji stabilitas durasi panjang.

## 1. Prasyarat

1. Jalankan backend pada environment `staging` (bukan production).
2. Install `k6`.
3. Siapkan token login admin/API untuk endpoint dashboard.

## 2. Persiapan konfigurasi

1. Salin file environment:
```bash
cp stress/k6/.env.example stress/k6/.env
```
2. Isi minimal salah satu:
- `TOKEN=...`, atau
- `LOGIN_EMAIL=...` dan `LOGIN_PASSWORD=...`
3. Atur `BASE_URL` dan `API_PREFIX` sesuai API server.
4. Jika endpoint login bukan default, set `LOGIN_ENDPOINT_PATH` (default: `/login`).

## 3. Cara menjalankan bertahap

### 3.1 Smoke test
```bash
cd stress/k6
source .env
k6 run smoke.js --summary-export results-smoke.json
```

### 3.2 Baseline
```bash
cd stress/k6
source .env
k6 run baseline.js --summary-export results-baseline.json
```

### 3.3 Stress (target tinggi)
```bash
cd stress/k6
source .env
k6 run stress.js --summary-export results-stress.json
```

### 3.4 Soak
```bash
cd stress/k6
source .env
k6 run soak.js --summary-export results-soak.json
```

## 4. Jalankan seluruh suite

```bash
cd stress/k6
chmod +x run-suite.sh
./run-suite.sh
```

Output default:
- `stress/k6/results/<timestamp>/smoke-summary.json`
- `stress/k6/results/<timestamp>/baseline-summary.json`
- `stress/k6/results/<timestamp>/stress-summary.json`
- `stress/k6/results/<timestamp>/soak-summary.json`

## 5. Endpoint yang diuji

1. `GET /dashboard/tracer/accreditation-summary`
2. `GET /questionnaires/active?audience=alumni` (setup)
3. `GET /questionnaires/{id}/responses`
4. `POST /exports/responses` (jika `ENABLE_EXPORT=1`)

## 6. Parameter penting

1. `ACCREDITATION_YEAR`, `TS_LABELS`, `FAKULTAS_LIST`, `PRODI_LIST`
2. `SUMMARY_ENDPOINT_PATH` (default: `/dashboard/tracer/accreditation-summary`)
3. `SUMMARY_WEIGHT`, `RESPONSES_WEIGHT`, `EXPORT_WEIGHT`
4. `STRESS_STAGE*_VUS` dan `STRESS_STAGE*_DURATION`
5. `SOAK_VUS`, `SOAK_DURATION`
6. `REQUEST_TIMEOUT`, `THINK_TIME_MIN`, `THINK_TIME_MAX`

## 7. Kriteria lulus awal

1. `http_req_failed < 1%` (stress boleh sampai 2% sementara).
2. `p95 http_req_duration < 1500ms` untuk baseline.
3. `p95 http_req_duration < 2500ms` untuk stress awal.
4. Tidak ada lonjakan timeout/5xx yang kontinu pada fase stabil.

## 8. Catatan operasional

1. Untuk target besar (mendekati 5000 concurrent), gunakan lebih dari 1 load generator jika mesin test mulai bottleneck.
2. Saat test, pantau CPU, RAM, IOPS, koneksi DB, slow query, dan hit rate Redis.
3. Aktifkan `ENABLE_EXPORT=1` hanya jika worker queue sudah siap.
