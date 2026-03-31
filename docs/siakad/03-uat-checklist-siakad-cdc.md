# UAT Checklist Integrasi SIAKAD -> CDC (Sinkron Data Alumni)

Dokumen ini dipakai saat User Acceptance Test sebelum go-live integrasi data lulusan.
Status: `DRAFT`  
Versi: `v0.1`  
Tanggal: `[YYYY-MM-DD]`

## 1) Informasi UAT

| Item | Nilai |
|---|---|
| Environment SIAKAD | `[staging/prod]` |
| Environment CDC | `[staging/prod]` |
| Rentang data uji | `[mis. lulusan 2022-2025]` |
| Total sampel target | `[mis. 1000 record]` |
| PIC UAT SIAKAD | `[nama]` |
| PIC UAT CDC | `[nama]` |

## 2) Checklist Fungsional

Gunakan kolom status: `PASS / FAIL / BLOCKED`.

| ID | Skenario uji | Hasil yang diharapkan | Bukti | Status | Catatan |
|---|---|---|---|---|---|
| F-01 | Auth endpoint integrasi valid | Request berhasil dengan kredensial resmi | Screenshot/log |  |  |
| F-02 | Request tanpa auth | Ditolak `401` | Log response |  |  |
| F-03 | Full sync awal dijalankan | Data masuk ke CDC tanpa crash | Log job |  |  |
| F-04 | Incremental sync `updated_since` | Hanya data berubah yang diproses | Perbandingan before/after |  |  |
| F-05 | Paging endpoint sumber | Semua halaman terbaca sampai selesai | Log page 1..N |  |  |
| F-06 | Record baru | Masuk sebagai data baru (`created`) | Query DB/screenshot |  |  |
| F-07 | Record existing berubah | Terupdate (`updated`) | Query DB/screenshot |  |  |
| F-08 | Record duplikat dalam batch | Tidak membuat data ganda | Log + query DB |  |  |
| F-09 | Idempotency test (kirim batch sama 2x) | Tidak duplikasi data | Log summary |  |  |
| F-10 | Data kosong pada field wajib | Ditolak + error validasi jelas | Log error |  |  |
| F-11 | Data soft-delete (jika dipakai) | CDC menandai non-aktif sesuai kontrak | Query DB |  |  |

## 3) Checklist Kualitas Data (Daftar Alumni -> Detail)

| ID | Skenario uji | Hasil yang diharapkan | Bukti | Status | Catatan |
|---|---|---|---|---|---|
| D-01 | `nama` terisi | Tampil benar di tabel dan detail | Screenshot UI |  |  |
| D-02 | `nim` terisi dan unik | Tidak ada bentrok antar alumni | Query DB |  |  |
| D-03 | `prodi` dan `fakultas` | Nilai sesuai data SIAKAD | Screenshot UI |  |  |
| D-04 | `tahunMasuk` dan `tahunLulus` | Nilai angka valid | Screenshot UI |  |  |
| D-05 | `email` | Format valid dan tampil benar | Screenshot UI |  |  |
| D-06 | `nik` | Tersimpan dan tampil di detail | Screenshot UI |  |  |
| D-07 | `noHp` | Tersimpan sesuai normalisasi | Screenshot UI |  |  |
| D-08 | `alamat` | Tersimpan dan tampil utuh | Screenshot UI |  |  |
| D-09 | `dob` | Format `YYYY-MM-DD` valid | Screenshot UI |  |  |
| D-10 | `foto` URL valid | Gambar tampil atau fallback jika kosong | Screenshot UI |  |  |
| D-11 | `updatedAt` | Update timestamp berubah saat data diubah | Query DB/log |  |  |
| D-12 | Pencarian/filter admin | Data hasil sync bisa dicari/filter | Video/screenshot |  |  |

## 4) Checklist Keamanan dan Reliabilitas

| ID | Skenario uji | Hasil yang diharapkan | Bukti | Status | Catatan |
|---|---|---|---|---|---|
| S-01 | TLS aktif | Koneksi HTTPS valid | SSL check |  |  |
| S-02 | Invalid token | Ditolak `401` | Log response |  |  |
| S-03 | Token expired | Ditolak `401` + pesan jelas | Log response |  |  |
| S-04 | Rate limit | Error `429` saat melebihi limit | Log response |  |  |
| S-05 | Timeout simulasi | Retry berjalan sesuai policy | Log retry |  |  |
| S-06 | Partial failure (sebagian record gagal) | Job selesai, error list tersedia | Log summary/errors |  |  |
| S-07 | Audit log | Ada `request_id`, `batch_id`, jumlah sukses/gagal | Log observability |  |  |

## 5) Checklist Performa

| ID | Skenario uji | Target minimal | Hasil aktual | Status | Catatan |
|---|---|---|---|---|---|
| P-01 | Sync 1.000 record | `< 60 detik` |  |  |  |
| P-02 | Sync 10.000 record | `< 5 menit` |  |  |  |
| P-03 | Beban bersamaan (concurrent) | Tidak ada timeout massal |  |  |  |
| P-04 | Query daftar alumni setelah sync | Tetap responsif |  |  |  |

## 6) Checklist Recovery dan Operasional

| ID | Skenario uji | Hasil yang diharapkan | Bukti | Status | Catatan |
|---|---|---|---|---|---|
| R-01 | Gagal di tengah batch | Dapat re-run tanpa duplikasi | Log re-run |  |  |
| R-02 | Rollback data batch | Mekanisme rollback jelas dan terdokumentasi | SOP/runbook |  |  |
| R-03 | Monitoring alert | Alert terkirim saat error threshold tercapai | Screenshot alert |  |  |
| R-04 | Dokumentasi runbook | Tim operasional dapat menjalankan SOP | Dokumen/SOP |  |  |

## 7) Rekonsiliasi Data

| Item | Nilai |
|---|---|
| Total record SIAKAD (sumber) |  |
| Total record CDC (setelah sync) |  |
| Selisih |  |
| Persentase kecocokan |  |
| Catatan mismatch utama |  |

## 8) Go/No-Go Decision

| Kriteria | Hasil |
|---|---|
| Semua test critical (`F-01..F-11`, `D-01..D-10`, `S-01..S-04`) PASS | `[Ya/Tidak]` |
| Tidak ada blocker severity tinggi | `[Ya/Tidak]` |
| Tim operasional siap (runbook + monitoring) | `[Ya/Tidak]` |
| Keputusan akhir | `[GO / NO-GO]` |

## 9) Persetujuan UAT

| Tim | Nama | Jabatan | Tanggal | Tanda tangan |
|---|---|---|---|---|
| SIAKAD |  |  |  |  |
| CDC |  |  |  |  |
| QA/PM |  |  |  |  |

