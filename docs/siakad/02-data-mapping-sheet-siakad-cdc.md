# Data Mapping Sheet SIAKAD -> CDC (Alumni)

Dokumen ini memetakan field data lulusan dari SIAKAD ke model data CDC.
Status: `DRAFT`  
Versi: `v0.1`  
Tanggal: `[YYYY-MM-DD]`

## 1) Mapping Field Utama

| No | Field CDC | Tipe CDC | Wajib | Field SIAKAD (contoh) | Transformasi/Validasi | Contoh nilai |
|---|---|---|---|---|---|---|
| 1 | `id` | string | Ya | `external_id` | Simpan apa adanya (ID global sumber) | `SIAKAD-ALUMNI-0001` |
| 2 | `nim` | string | Ya | `nim` / `student_id` | Trim, unique, regex `^[0-9A-Za-z-]{6,25}$` | `190102001` |
| 3 | `nama` | string | Ya | `nama` / `full_name` | Trim, collapse multi-space | `Siti Aisyah` |
| 4 | `fakultas` | string | Ya | `fakultas` / `faculty_name` | Trim, standardisasi penamaan | `Teknik` |
| 5 | `prodi` | string | Ya | `prodi` / `program_name` | Trim, standardisasi penamaan | `Informatika` |
| 6 | `tahunMasuk` | integer | Ya | `tahun_masuk` / `entry_year` | 4 digit, rentang wajar | `2019` |
| 7 | `tahunLulus` | integer | Ya | `tahun_lulus` / `graduation_year` | 4 digit, `tahunLulus >= tahunMasuk` | `2023` |
| 8 | `email` | string | Ya | `email` | Lowercase, valid email format | `siti@kampus.ac.id` |
| 9 | `nik` | string | Tidak | `nik` / `national_id` | Simpan raw, boleh kosong | `320190100001` |
| 10 | `noHp` | string | Tidak | `no_hp` / `phone` | Normalisasi nomor HP | `0812102001` |
| 11 | `alamat` | string | Tidak | `alamat` / `address` | Trim, preserve linebreak jika ada | `Alamat alumni 1` |
| 12 | `dob` | date string | Tidak | `tanggal_lahir` / `birth_date` | Format `YYYY-MM-DD` | `1999-01-10` |
| 13 | `foto` | string | Tidak | `foto_url` / `photo_url` | URL valid `http/https` | `https://cdn.../foto.jpg` |
| 14 | `updatedAt` | datetime string | Ya | `updated_at` | ISO-8601 timezone aware | `2026-03-01T10:20:30+07:00` |
| 15 | `sent` | boolean | Tidak | - | Default `false` saat import | `false` |
| 16 | `rawNik` | string | Tidak | `nik` / `national_id` | Simpan nilai sumber tanpa modifikasi | `320190100001` |
| 17 | `rawNoHp` | string | Tidak | `no_hp` / `phone` | Simpan nilai sumber tanpa modifikasi | `0812102001` |
| 18 | `rawAlamat` | string | Tidak | `alamat` / `address` | Simpan nilai sumber tanpa modifikasi | `Alamat alumni 1` |

## 2) Aturan Data Quality dan Validasi

| Rule ID | Aturan | Level | Aksi saat gagal |
|---|---|---|---|
| DQ-01 | `nim` wajib dan unik | Critical | Reject record |
| DQ-02 | `nama` wajib | Critical | Reject record |
| DQ-03 | `fakultas` dan `prodi` wajib | Critical | Reject record |
| DQ-04 | `tahunMasuk` dan `tahunLulus` wajib | Critical | Reject record |
| DQ-05 | `tahunLulus >= tahunMasuk` | Major | Reject record |
| DQ-06 | `email` wajib dan valid | Major | Reject record atau fallback sesuai kebijakan |
| DQ-07 | `dob` jika ada harus valid `YYYY-MM-DD` | Minor | Kosongkan field + log warning |
| DQ-08 | `foto` jika ada harus URL valid | Minor | Kosongkan field + log warning |
| DQ-09 | `updated_at` wajib | Critical | Reject record |
| DQ-10 | Spasi berlebih di field teks dibersihkan | Minor | Auto-fix |

## 3) Aturan Matching dan Upsert

| Item | Nilai |
|---|---|
| Primary matching key | `nim` |
| Secondary matching key | `external_id` |
| Strategi | `upsert` |
| Conflict resolver | `updated_at` terbaru menang |
| Rekam jejak | Simpan `batch_id`, `synced_at`, `source_system` |

## 4) Normalisasi Nilai (Disarankan)

| Field | Normalisasi |
|---|---|
| `email` | lowercase |
| `noHp` | ubah `+62` ke `0` (jika kebijakan internal CDC menggunakan format nasional) |
| `fakultas/prodi` | map ke master data CDC (kode -> nama baku) |
| `nama` | trim + hapus spasi ganda |

## 5) Contoh Mapping Payload

### Payload sumber (SIAKAD)

```json
{
  "external_id": "SIAKAD-ALUMNI-0001",
  "student_id": "190102001",
  "full_name": "Siti Aisyah",
  "faculty_name": "Teknik",
  "program_name": "Informatika",
  "entry_year": 2019,
  "graduation_year": 2023,
  "email": "SITI.AISYAH@EXAMPLE.AC.ID",
  "national_id": "320190100001",
  "phone": "+62812102001",
  "address": "Alamat alumni 1",
  "birth_date": "1999-01-10",
  "photo_url": "https://cdn.example.ac.id/alumni/190102001.jpg",
  "updated_at": "2026-03-01T10:20:30+07:00"
}
```

### Hasil normalisasi (CDC)

```json
{
  "id": "SIAKAD-ALUMNI-0001",
  "nim": "190102001",
  "nama": "Siti Aisyah",
  "fakultas": "Teknik",
  "prodi": "Informatika",
  "tahunMasuk": 2019,
  "tahunLulus": 2023,
  "email": "siti.aisyah@example.ac.id",
  "nik": "320190100001",
  "noHp": "0812102001",
  "alamat": "Alamat alumni 1",
  "dob": "1999-01-10",
  "foto": "https://cdn.example.ac.id/alumni/190102001.jpg",
  "rawNik": "320190100001",
  "rawNoHp": "+62812102001",
  "rawAlamat": "Alamat alumni 1",
  "updatedAt": "2026-03-01T10:20:30+07:00"
}
```

## 6) Open Item untuk Tim SIAKAD

- Konfirmasi nama field final SIAKAD (terutama `entry_year`, `graduation_year`, `updated_at`).
- Konfirmasi apakah `email` selalu tersedia.
- Konfirmasi format default nomor HP (`+62` vs `08`).
- Konfirmasi apakah data alumni non-aktif/deleted ikut dikirim.

