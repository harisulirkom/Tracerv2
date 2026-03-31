# Matriks Mapping Role SSO ke CDC

Dokumen ini adalah baseline implementasi di sisi CDC. Sesuaikan kode role sesuai data asli dari tim SSO.

## 1) Mapping Utama

| Prioritas | Kondisi dari token/hasil validasi SSO | Role CDC | Akses CDC |
|---|---|---|---|
| 1 | `group` contains `SUPERADMIN` | `admin_super` | Semua modul admin + manajemen user |
| 2 | `group` contains `CDC_ADMIN` | `admin_cdc` | Admin kuisioner, bank soal, artikel/berita, CTA, lowongan, respon |
| 3 | `group` contains `ALUMNI` dan `nim` valid | `alumni` | Halaman public + kuisioner alumni + kuisioner umum |
| 4 | `group` contains `PUBLIC` atau `GENERAL` | `public_user` | Halaman public + kuisioner umum |
| 5 | Tidak match rule manapun | `guest_limited` | Public read-only atau deny login (sesuai kebijakan) |

## 2) Rule Validasi untuk Kuisioner

| Tipe kuisioner | Syarat submit | Penolakan |
|---|---|---|
| `alumni` | `role=alumni` dan `nim` ada + valid | `403` jika bukan alumni, `422` jika `nim` kosong/tidak valid |
| `umum` | `role=public_user` atau `role=alumni` | `403` jika role tidak valid |

Catatan penting:
- User alumni boleh isi kuisioner umum.
- User umum tidak boleh isi kuisioner alumni.

## 3) Claim Normalization (Disarankan)

Normalisasi claim dari SSO sebelum dipakai di CDC agar konsisten lintas environment:

| Field internal CDC | Sumber claim SSO (contoh) | Fallback |
|---|---|---|
| `external_id` | `sub` / `user_id` | wajib ada |
| `name` | `name` / `full_name` | `username` |
| `email` | `email` | opsional, bisa null |
| `role_code` | `group` / `roles[]` | `guest_limited` |
| `nim` | `nim` | null |
| `nip` | `nip` | null |

## 4) Contoh Pseudocode Resolver

```text
if hasRole("SUPERADMIN"): return admin_super
if hasRole("CDC_ADMIN"): return admin_cdc
if hasRole("ALUMNI"):
  if empty(nim): reject("NIM wajib untuk role alumni")
  return alumni
if hasRole("PUBLIC") or hasRole("GENERAL"): return public_user
return guest_limited
```

## 5) Test Matrix (Wajib sebelum Go-Live)

| Skenario | Input role/claim | Hasil yang diharapkan |
|---|---|---|
| Admin penuh | `SUPERADMIN` | Bisa akses seluruh menu admin |
| Admin CDC | `CDC_ADMIN` | Tidak bisa akses manajemen superadmin |
| Alumni valid | `ALUMNI` + `nim` | Bisa submit kuisioner alumni |
| Alumni tanpa NIM | `ALUMNI` tanpa `nim` | Ditolak submit alumni, pesan validasi jelas |
| User umum | `PUBLIC` | Bisa submit kuisioner umum |
| Role tidak dikenal | `UNKNOWN_ROLE` | Ditolak atau diberi akses paling terbatas |

## 6) Data yang Harus Diminta ke Tim SSO

- Daftar resmi kode role/group yang valid.
- Contoh payload token/response validasi untuk setiap role.
- Aturan prioritas jika user punya lebih dari satu role.
- Jaminan field `nim` untuk role alumni.

