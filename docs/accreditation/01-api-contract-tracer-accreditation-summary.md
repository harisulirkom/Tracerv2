# Kontrak Endpoint Ringkasan Akreditasi Tracer

Status: `DRAFT`
Versi: `v1`
Tanggal: `2026-04-02`

## Tujuan

Endpoint ini menyediakan agregasi data akreditasi tracer agar frontend tidak perlu memuat seluruh jawaban mentah per halaman.

## Endpoint

`GET /dashboard/tracer/accreditation-summary`

## Query Params

| Param | Tipe | Wajib | Contoh | Keterangan |
|---|---|---|---|---|
| `accreditation_year` | integer | Ya | `2026` | Tahun referensi akreditasi |
| `ts_labels` | string CSV | Ya | `TS-1,TS-2` | Label TS yang dihitung |
| `fakultas` | string | Tidak | `Fakultas Teknik` | Filter fakultas |
| `prodi` | string | Tidak | `Informatika` | Filter prodi |
| `questionnaire_id` | integer | Tidak | `12` | Pakai kuisioner tertentu |

Catatan:
- Jika `fakultas`/`prodi` tidak dikirim, backend mengembalikan agregasi semua data.
- Jika `prodi` dikirim, backend tetap wajib validasi bahwa prodi termasuk fakultas terkait (jika fakultas juga dikirim).

## Response 200

```json
{
  "status": true,
  "message": "OK",
  "data": {
    "scope": {
      "accreditation_year": 2026,
      "fakultas": "all",
      "prodi": "all",
      "ts_labels": ["TS-1", "TS-2"]
    },
    "summary": {
      "total_alumni": 520,
      "total_respondents": 368,
      "response_rate": 70.77,
      "raw_responses": 401,
      "unmatched_responses": 14
    },
    "cohort_rows": [
      {
        "ts_label": "TS-1",
        "total_alumni": 250,
        "respondents": 180,
        "response_rate": 72.0
      },
      {
        "ts_label": "TS-2",
        "total_alumni": 270,
        "respondents": 188,
        "response_rate": 69.63
      }
    ],
    "detail_by_ts": {
      "TS-1": {
        "already": [
          {
            "id": "attempt-1001",
            "nim": "190101001",
            "nama": "Budi",
            "fakultas": "Fakultas Teknik",
            "prodi": "Informatika",
            "tahun_lulus": 2025,
            "status": "Bekerja",
            "last_submitted_at": "2026-03-22T10:15:00+07:00",
            "attempt_count": 1
          }
        ],
        "pending": [
          {
            "nim": "190101002",
            "nama": "Sari",
            "fakultas": "Fakultas Teknik",
            "prodi": "Informatika",
            "tahun_lulus": 2025,
            "status": "Belum mengisi",
            "last_submitted_at": null,
            "attempt_count": 0
          }
        ],
        "unmatched": [
          {
            "id": "attempt-9001",
            "nim": "xxx123",
            "nama": "-",
            "fakultas": "-",
            "prodi": "-",
            "tahun_lulus": 2025,
            "status": "-",
            "last_submitted_at": "2026-03-20T11:00:00+07:00",
            "attempt_count": 1
          }
        ]
      }
    },
    "filter_options": {
      "fakultas": ["Fakultas Teknik", "Fakultas Ekonomi"],
      "prodi": ["Informatika", "Sistem Informasi", "Akuntansi"],
      "prodi_by_fakultas": {
        "Fakultas Teknik": ["Informatika", "Sistem Informasi"],
        "Fakultas Ekonomi": ["Akuntansi"]
      }
    },
    "questionnaire_id": 12,
    "questionnaire_title": "Tracer Alumni 2026",
    "generated_at": "2026-04-02T13:20:00+07:00",
    "response_count": 401
  }
}
```

## Aturan Perhitungan

1. `total_respondents` harus dihitung unik per NIM valid (match alumni).
2. `raw_responses` adalah jumlah semua jawaban masuk sesuai filter, termasuk yang tidak match NIM alumni.
3. `unmatched_responses` adalah jawaban yang tidak memiliki pasangan alumni valid.
4. `response_rate = (total_respondents / total_alumni) * 100`, dibulatkan 2 digit.
5. `cohort_rows[].respondents` dihitung unik per NIM dalam label TS tersebut.

## Performa yang Ditargetkan

1. Data sekitar 2.000 alumni: waktu respon endpoint <= 3 detik.
2. Data sekitar 10.000 alumni: waktu respon endpoint <= 5 detik.
3. Seluruh query harus menggunakan index pada kolom filter: `tahun_lulus`, `fakultas`, `prodi`, `nim`, `created_at`.

## Error Response (contoh)

```json
{
  "status": false,
  "message": "Validation failed",
  "errors": {
    "accreditation_year": ["accreditation_year is required"],
    "ts_labels": ["ts_labels is required"]
  },
  "request_id": "d5f2d9c0-xxxx-xxxx-xxxx-0a01b1234abc"
}
```
