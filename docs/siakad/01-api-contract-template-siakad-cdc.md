# Template API Contract Integrasi SIAKAD -> CDC (Data Lulusan)

Dokumen ini adalah template kontrak API untuk sinkronisasi data lulusan dari SIAKAD ke CDC.
Status: `DRAFT`  
Versi: `v0.1`  
Tanggal: `[YYYY-MM-DD]`

## 1) Identitas Integrasi

| Item | Nilai |
|---|---|
| Sistem sumber | SIAKAD |
| Sistem target | CDC Tracer |
| Domain SIAKAD API | `[https://....]` |
| Domain CDC API | `[https://....]` |
| PIC SIAKAD | `[nama - jabatan - kontak]` |
| PIC CDC | `[nama - jabatan - kontak]` |
| Timezone | `Asia/Jakarta (UTC+7)` |

## 2) Ruang Lingkup Data

Data yang wajib tersedia dan tampil di halaman **Daftar Alumni -> Detail**:

- `nama`
- `nim`
- `prodi`
- `fakultas`
- `tahunMasuk`
- `tahunLulus`
- `email`
- `nik`
- `noHp`
- `alamat`
- `dob` (tanggal lahir)
- `foto` (URL foto)

## 3) Model Integrasi (Pilih Salah Satu)

### Opsi A (Direkomendasikan): CDC Pull dari API SIAKAD

- CDC menarik data periodik dari endpoint SIAKAD.
- Mendukung full sync awal + incremental sync via `updated_since`.

### Opsi B: SIAKAD Push ke API CDC

- SIAKAD mengirim batch data ke endpoint integrasi CDC.
- CDC memproses upsert secara idempotent.

## 4) Keamanan dan Autentikasi

| Item | Nilai Disepakati |
|---|---|
| Auth method | `[Bearer Token / API Key / HMAC]` |
| Rotasi kredensial | `[mis. 90 hari]` |
| TLS minimum | `TLS 1.2+` |
| IP whitelist | `[ya/tidak + daftar IP]` |
| Rate limit | `[mis. 120 req/menit]` |

Header minimum:

```http
Authorization: Bearer <token>
Content-Type: application/json
X-Request-Id: <uuid>
X-Source-System: SIAKAD
```

## 5) Spesifikasi Endpoint (Template)

### 5.1 Opsi A - CDC Pull

#### GET `/siakad/v1/graduates`

Query params:

| Param | Tipe | Wajib | Contoh | Keterangan |
|---|---|---|---|---|
| `updated_since` | datetime (ISO-8601) | Tidak | `2026-03-01T00:00:00+07:00` | Untuk incremental sync |
| `page` | integer | Tidak | `1` | Paging |
| `per_page` | integer | Tidak | `100` | Maks disepakati, mis. `500` |
| `graduation_year` | integer | Tidak | `2025` | Filter tahun lulus |
| `faculty_code` | string | Tidak | `FT` | Filter fakultas |
| `program_code` | string | Tidak | `IF` | Filter prodi |
| `include_deleted` | boolean | Tidak | `false` | Termasuk data soft-delete |

Response `200`:

```json
{
  "status": true,
  "message": "OK",
  "meta": {
    "page": 1,
    "per_page": 100,
    "total": 1250,
    "has_next": true
  },
  "data": [
    {
      "external_id": "SIAKAD-ALUMNI-0001",
      "nim": "190102001",
      "nama": "Siti Aisyah",
      "fakultas": "Teknik",
      "prodi": "Informatika",
      "tahun_masuk": 2019,
      "tahun_lulus": 2023,
      "email": "siti.aisyah@example.ac.id",
      "nik": "320190100001",
      "no_hp": "0812102001",
      "alamat": "Alamat alumni 1",
      "tanggal_lahir": "1999-01-10",
      "foto_url": "https://....",
      "status_lulusan": "LULUS",
      "updated_at": "2026-03-01T10:20:30+07:00",
      "deleted_at": null
    }
  ]
}
```

#### GET `/siakad/v1/graduates/{nim}`

- Ambil detail satu alumni berdasarkan NIM.

### 5.2 Opsi B - SIAKAD Push

#### POST `/cdc-api/v1/integrations/siakad/graduates/sync`

Request body:

```json
{
  "batch_id": "SIK-20260302-001",
  "sent_at": "2026-03-02T09:00:00+07:00",
  "records": [
    {
      "external_id": "SIAKAD-ALUMNI-0001",
      "nim": "190102001",
      "nama": "Siti Aisyah",
      "fakultas": "Teknik",
      "prodi": "Informatika",
      "tahun_masuk": 2019,
      "tahun_lulus": 2023,
      "email": "siti.aisyah@example.ac.id",
      "nik": "320190100001",
      "no_hp": "0812102001",
      "alamat": "Alamat alumni 1",
      "tanggal_lahir": "1999-01-10",
      "foto_url": "https://....",
      "status_lulusan": "LULUS",
      "updated_at": "2026-03-01T10:20:30+07:00",
      "deleted_at": null
    }
  ]
}
```

Response `200`:

```json
{
  "status": true,
  "message": "Batch processed",
  "summary": {
    "received": 1,
    "created": 1,
    "updated": 0,
    "skipped": 0,
    "failed": 0
  },
  "errors": []
}
```

## 6) Aturan Upsert dan Konflik Data

| Rule | Nilai |
|---|---|
| Kunci utama sinkron | `nim` |
| Kunci sekunder | `external_id` |
| Strategi update | `upsert` |
| Resolusi konflik | Data dengan `updated_at` terbaru menang |
| Delete policy | Soft delete via `deleted_at` (bukan hard delete) |

## 7) Standar Error

| HTTP Code | Kapan terjadi | Contoh `message` |
|---|---|---|
| `400` | Payload/query tidak valid | `Invalid graduation_year` |
| `401` | Token tidak valid/kadaluarsa | `Unauthorized` |
| `403` | Tidak punya izin akses | `Forbidden` |
| `404` | Resource tidak ditemukan | `Graduate not found` |
| `409` | Konflik data (opsional) | `Duplicate external_id` |
| `422` | Validasi field gagal | `nim is required` |
| `429` | Rate limit terlampaui | `Too many requests` |
| `500` | Error internal server | `Internal server error` |

Format error JSON:

```json
{
  "status": false,
  "message": "Validation failed",
  "errors": {
    "nim": ["nim is required"]
  },
  "request_id": "8e76c7b0-xxxx-xxxx-xxxx-0ec4a9d7fabc"
}
```

## 8) Non-Functional Requirement

| Item | Nilai Disepakati |
|---|---|
| Timeout request | `[mis. 15 detik]` |
| Retry policy | `[mis. max 2x, exponential backoff]` |
| Throughput target | `[mis. 10.000 record < 5 menit]` |
| Availability | `[mis. 99.9%]` |
| Log retention | `[mis. 90 hari]` |

## 9) Change Management

- Versi API harus jelas, mis. `/v1`.
- Perubahan breaking wajib notifikasi minimal `[14]` hari kerja.
- Sediakan environment `staging` sebelum `production`.

## 10) Persetujuan

| Tim | Nama | Jabatan | Tanggal | Tanda tangan |
|---|---|---|---|---|
| SIAKAD |  |  |  |  |
| CDC |  |  |  |  |

