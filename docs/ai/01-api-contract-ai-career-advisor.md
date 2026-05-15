# Kontrak Endpoint AI Career Advisor (Internal MVP)

Status: `DRAFT`
Versi: `v1`
Tanggal: `2026-04-09`

## Tujuan

Dokumen ini mendefinisikan endpoint API untuk alur UI AI Career Advisor:
1. Pilih persona
2. Isi form wajib
3. Generate hasil rekomendasi
4. Simpan action dan feedback

## Base URL

`/api/v1/career-advisor`

## Auth

- Semua endpoint membutuhkan token login alumni (`Bearer token`).
- Admin endpoint (analytics) hanya untuk role admin CDC.
- Integrasi provider AI wajib dipanggil dari backend. Frontend tidak boleh menyimpan atau mengirim API key provider.

## Ringkasan Endpoint

1. `GET /options`
2. `POST /sessions`
3. `PATCH /sessions/{session_id}/profile`
4. `POST /sessions/{session_id}/generate`
5. `GET /sessions/{session_id}/result`
6. `POST /sessions/{session_id}/action`
7. `POST /sessions/{session_id}/feedback`
8. `GET /admin/analytics` (admin only)

---

## 1) GET /options

Mengembalikan pilihan dropdown/chip untuk UI.

### Response 200

```json
{
  "status": true,
  "message": "OK",
  "data": {
    "personas": [
      { "id": "fresh", "label": "Fresh Graduate" },
      { "id": "switcher", "label": "Career Switcher" },
      { "id": "entrepreneur", "label": "Entrepreneur Track" }
    ],
    "industries": ["Teknologi", "Pendidikan", "Perbankan", "Pemerintahan", "Kreatif", "Kesehatan"],
    "skill_levels": ["dasar", "menengah", "lanjut"],
    "work_styles": ["Remote", "Hybrid", "Onsite"],
    "weekly_hours": ["3-5", "6-8", ">8"],
    "motivators": ["Stabilitas karir", "Dampak sosial", "Penghasilan", "Fleksibilitas waktu", "Pembelajaran cepat"],
    "support_types": ["Konseling CDC", "Roadmap AI mandiri", "Mentoring alumni", "Komunitas praktik"]
  }
}
```

---

## 2) POST /sessions

Membuat sesi asesmen baru setelah alumni memilih persona.

### Request

```json
{
  "persona_id": "fresh"
}
```

### Validasi

- `persona_id`: required, enum `fresh|switcher|entrepreneur`.

### Response 201

```json
{
  "status": true,
  "message": "Session created",
  "data": {
    "session_id": "ca_sess_01JXYZ...",
    "persona_id": "fresh",
    "form_completion_percent": 0,
    "ready_for_generate": false,
    "created_at": "2026-04-09T09:10:00+07:00"
  }
}
```

---

## 3) PATCH /sessions/{session_id}/profile

Simpan draft form (boleh parsial). Endpoint ini dipanggil saat user mengisi form wajib.

### Request

```json
{
  "graduation_year": 2024,
  "study_program": "Teknik Informatika",
  "target_industry": "Teknologi",
  "target_role": "Data Analyst Junior",
  "skill_level": "menengah",
  "strongest_skill": "SQL",
  "biggest_gap": "Statistik terapan",
  "work_style": "Hybrid",
  "location_preference": "Surabaya",
  "weekly_hours": "6-8",
  "motivator": "Penghasilan",
  "career_goal": "Dapat role entry-level data dalam 12 bulan",
  "main_constraint": "Waktu terbatas karena kerja part-time",
  "support_type": "Konseling CDC"
}
```

### Field wajib untuk generate

- `graduation_year`
- `study_program`
- `target_industry`
- `target_role`
- `skill_level`
- `strongest_skill`
- `biggest_gap`
- `work_style`
- `weekly_hours`
- `motivator`
- `career_goal`
- `support_type`

Opsional:
- `location_preference`
- `main_constraint`

### Response 200

```json
{
  "status": true,
  "message": "Profile updated",
  "data": {
    "session_id": "ca_sess_01JXYZ...",
    "form_completion_percent": 92,
    "confidence_band": "tinggi",
    "ready_for_generate": true,
    "missing_required_fields": []
  }
}
```

---

## 4) POST /sessions/{session_id}/generate

Generate rekomendasi AI dari data sesi.

### Request

```json
{
  "force_regenerate": false
}
```

### Aturan

- Jika `ready_for_generate=false`, kembalikan `422 PROFILE_INCOMPLETE`.
- Jika hasil masih fresh (`<= 24 jam`) dan `force_regenerate=false`, bisa return cache hasil terakhir.

### Response 202 (async)

```json
{
  "status": true,
  "message": "Generation queued",
  "data": {
    "session_id": "ca_sess_01JXYZ...",
    "analysis_id": "ca_an_01JXYZ...",
    "generation_status": "queued"
  }
}
```

### Response 200 (sync/cached)

```json
{
  "status": true,
  "message": "Generation completed",
  "data": {
    "session_id": "ca_sess_01JXYZ...",
    "analysis_id": "ca_an_01JXYZ...",
    "generation_status": "completed"
  }
}
```

---

## 5) GET /sessions/{session_id}/result

Mengambil hasil rekomendasi step 3.

### Response 200

```json
{
  "status": true,
  "message": "OK",
  "data": {
    "session_id": "ca_sess_01JXYZ...",
    "analysis_id": "ca_an_01JXYZ...",
    "generation_status": "completed",
    "confidence_score": 0.89,
    "confidence_band": "tinggi",
    "motivation_narrative": "Kamu menargetkan Data Analyst Junior...",
    "recommendations": [
      {
        "role": "Data Analyst Junior",
        "score": 88,
        "eta": "8-10 minggu",
        "reason": "Cocok dengan target industri dan kekuatan SQL kamu."
      },
      {
        "role": "Business Intelligence Associate",
        "score": 83,
        "eta": "10-12 minggu",
        "reason": "Kebutuhan dashboarding sesuai preferensi kerja hybrid."
      }
    ],
    "skill_gap": [
      "Statistik terapan",
      "Storytelling data",
      "Eksperimen A/B dasar"
    ],
    "plan_12_weeks": [
      { "phase": "Minggu 1-2", "focus": "SQL + data cleaning" },
      { "phase": "Minggu 3-4", "focus": "Dashboard mini" },
      { "phase": "Minggu 5-8", "focus": "Project portofolio" },
      { "phase": "Minggu 9-12", "focus": "Mock interview + apply" }
    ],
    "generated_at": "2026-04-09T09:23:00+07:00"
  }
}
```

### Response 202 (masih diproses)

```json
{
  "status": true,
  "message": "Generation in progress",
  "data": {
    "session_id": "ca_sess_01JXYZ...",
    "generation_status": "in_progress"
  }
}
```

---

## 6) POST /sessions/{session_id}/action

Menyimpan aksi lanjutan alumni (step 4).

### Request

```json
{
  "next_action": "book_counseling"
}
```

### Enum

- `apply_now`
- `book_counseling`
- `save_learning_plan`

### Response 200

```json
{
  "status": true,
  "message": "Action saved",
  "data": {
    "session_id": "ca_sess_01JXYZ...",
    "next_action": "book_counseling",
    "saved_at": "2026-04-09T09:30:00+07:00"
  }
}
```

---

## 7) POST /sessions/{session_id}/feedback

Menyimpan rating relevansi dan komentar.

### Request

```json
{
  "relevance_score": 4,
  "feedback_note": "Role pertama relevan, role ketiga kurang sesuai background saya."
}
```

### Validasi

- `relevance_score`: required, integer, `1..5`
- `feedback_note`: optional, max 500 chars

### Response 200

```json
{
  "status": true,
  "message": "Feedback saved",
  "data": {
    "session_id": "ca_sess_01JXYZ...",
    "relevance_score": 4,
    "saved_at": "2026-04-09T09:31:00+07:00"
  }
}
```

---

## 8) GET /admin/analytics (Admin)

Ringkasan kualitas rekomendasi untuk CDC.

### Query params

- `date_from` (YYYY-MM-DD)
- `date_to` (YYYY-MM-DD)
- `persona_id` (optional)

### Response 200

```json
{
  "status": true,
  "message": "OK",
  "data": {
    "total_sessions": 320,
    "generated_sessions": 271,
    "avg_completion_percent": 86.2,
    "avg_relevance_score": 4.1,
    "top_next_actions": [
      { "action": "save_learning_plan", "count": 140 },
      { "action": "book_counseling", "count": 88 }
    ]
  }
}
```

---

## Format Error Standar

```json
{
  "status": false,
  "message": "Validation failed",
  "error_code": "PROFILE_INCOMPLETE",
  "errors": {
    "target_role": ["target_role is required"],
    "support_type": ["support_type is required"]
  },
  "request_id": "req_01JXYZ..."
}
```

## Error Code yang Dipakai

- `UNAUTHORIZED`
- `FORBIDDEN`
- `SESSION_NOT_FOUND`
- `PROFILE_INCOMPLETE`
- `GENERATION_FAILED`
- `VALIDATION_FAILED`
- `RATE_LIMITED`

## Target Performa MVP

1. `GET /options` <= 200 ms
2. `PATCH /profile` <= 400 ms
3. `POST /generate` enqueue <= 500 ms
4. `GET /result` (completed) <= 700 ms
5. P95 keseluruhan endpoint <= 1.5 s (kecuali proses generate AI async)

## Catatan Implementasi Laravel

1. Gunakan queue untuk proses AI (`generation_status`: queued -> in_progress -> completed/failed).
2. Simpan payload prompt/response AI ter-redact untuk audit internal.
3. Terapkan rate limit endpoint generate (mis. 5 request / 10 menit per user).
4. Jangan kirim data sensitif berlebihan ke provider AI (minimasi PII).
5. Endpoint result harus idempotent (aman dipanggil polling dari frontend).
6. Simpan API key provider AI di backend `.env` (contoh: `OPENAI_API_KEY`, `OPENAI_MODEL`) dan akses hanya di service backend.
