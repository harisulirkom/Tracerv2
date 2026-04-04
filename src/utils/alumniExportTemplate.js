export const ALUMNI_TEMPLATE_HEADERS = [
  'nama',
  'nik',
  'nim',
  'fakultas',
  'prodi',
  'tahun',
  'email',
  'status',
  'ekstra',
  'bekerja_mulaiSebelum',
  'bekerja_mulaiSetelah',
  'bekerja_lebihCepat6Bulan',
  'bekerja_bulanDapat',
  'bekerja_bulanTidak',
  'bekerja_pendapatan',
  'bekerja_tingkatTempatKerja',
  'bekerja_lokasiDetail',
  'bekerja_provinsi',
  'bekerja_kabupaten',
  'bekerja_jenisPerusahaan',
  'bekerja_namaPerusahaan',
  'bekerja_namaPimpinan',
  'bekerja_telpPerusahaan',
  'bekerja_caraMencari',
  'bekerja_perusahaanLamar',
  'bekerja_perusahaanRespon',
  'bekerja_perusahaanWawancara',
  'bekerja_posisi',
  'bekerja_kesesuaianBidang',
  'bekerja_pendidikanSesuai',
  'wira_namaPerusahaan',
  'wira_telpPerusahaan',
  'wira_jenisPerusahaan',
  'wira_bidang',
  'wira_tingkat',
  'wira_kesesuaian',
  'wira_pendidikan',
  'studi_lokasi',
  'studi_sumberBiaya',
  'studi_namaPt',
  'studi_prodi',
  'studi_tanggalMasuk',
  'studi_alasan',
  'mencari_mulaiSebelum',
  'mencari_mulaiSetelah',
  'mencari_cara',
  'mencari_perusahaanLamar',
  'mencari_perusahaanRespon',
  'mencari_perusahaanWawancara',
  'mencari_aktif4Minggu',
  'kompetensi_individu',
  'kompetensi_pembelajaran',
  'sumberDana',
]

export const ALUMNI_TEMPLATE_SAMPLE_ROW = [
  'Mawar Melati',
  '1234567890123456',
  '12345678',
  'Sains dan Teknologi',
  'Teknik Informatika',
  '2023',
  'mawar@example.com',
  'bekerja',
  'Masukan untuk kampus...',
  '0',
  '1',
  'Ya',
  '1',
  '0',
  '5000000',
  'Nasional',
  'Jakarta Selatan',
  'DKI Jakarta',
  'Jakarta Selatan',
  'Swasta',
  'PT Teknologi Maju',
  'Budi Santoso',
  '021-1234567',
  'Jobstreet; LinkedIn',
  '5',
  '3',
  '2',
  'Software Engineer',
  'Sangat Sesuai',
  'Setingkat Lebih Tinggi',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  'Etika:4;Keahlian:5;Bhs Inggris:4;Teknologi Informasi:5;Komunikasi:4;Kerja Sama:5;Pengembangan Diri:5',
  'Perkuliahan:5;Pembimbingan:4;Metode Pengajaran:5;Sarana:4;Integritas:5;Keluasan Ilmu:4;Kesempatan Riset:5',
  'Mandiri',
]

const HEADER_ALIASES = {
  nama: ['nama_alumni', 'name'],
  nik: ['no_ktp', 'ktp'],
  nim: ['nim_alumni', 'nomor_induk'],
  tahun: ['tahun_lulus', 'tahunLulus'],
  email: ['email_alumni'],
  status: ['status_pekerjaan'],
  ekstra: ['catatan', 'notes', 'keterangan'],
  sumberDana: ['sumber_dana', 'sumber_dana_kuliah'],
}

const hasMeaningfulValue = (value) => {
  if (value === undefined || value === null) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return String(value).trim() !== ''
}

const toCamelCase = (key) =>
  String(key).replace(/_([a-z])/g, (_, char) => char.toUpperCase())

const toSnakeCase = (key) =>
  String(key).replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)

const readObjectValue = (obj, key) => {
  if (!obj || typeof obj !== 'object') return undefined
  if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key]

  const camel = toCamelCase(key)
  if (camel !== key && Object.prototype.hasOwnProperty.call(obj, camel)) return obj[camel]

  const snake = toSnakeCase(key)
  if (snake !== key && Object.prototype.hasOwnProperty.call(obj, snake)) return obj[snake]

  return undefined
}

const scalarString = (value) => {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return String(value).trim()
}

export const formatTemplateCellValue = (value) => {
  if (!hasMeaningfulValue(value)) return ''
  if (Array.isArray(value)) {
    return value.map((item) => scalarString(item)).filter(Boolean).join(';')
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, val]) => {
        const normalizedValue =
          Array.isArray(val) || (val && typeof val === 'object')
            ? scalarString(JSON.stringify(val))
            : scalarString(val)
        if (!key && !normalizedValue) return ''
        if (!key) return normalizedValue
        if (!normalizedValue) return scalarString(key)
        return `${scalarString(key)}:${normalizedValue}`
      })
      .filter(Boolean)
      .join(';')
  }
  return scalarString(value)
}

const getRecordFallbackValue = (record, key) => {
  const source = record || {}
  if (key === 'nama') return source.nama || source.name || ''
  if (key === 'nim') return source.nim || ''
  if (key === 'nik') return source.nik || ''
  if (key === 'fakultas') return source.fakultas || ''
  if (key === 'prodi') return source.prodi || ''
  if (key === 'tahun') return source.tahun || source.tahunLulus || source.tahun_lulus || ''
  if (key === 'email') return source.email || ''
  if (key === 'status') return source.status || ''
  return ''
}

const collectCandidates = (record, key, getRawValue) => {
  const source = record || {}
  const raw = source.raw && typeof source.raw === 'object' ? source.raw : source
  const formData = raw?.formData || raw?.form_data || {}
  const aliases = HEADER_ALIASES[key] || []
  const keysToCheck = Array.from(new Set([key, ...aliases]))
  const values = []

  keysToCheck.forEach((candidateKey) => {
    if (typeof getRawValue === 'function') {
      values.push(getRawValue(raw, candidateKey))
    }
    values.push(readObjectValue(raw, candidateKey))
    values.push(readObjectValue(formData, candidateKey))
    values.push(readObjectValue(source, candidateKey))
  })

  values.push(getRecordFallbackValue(source, key))
  return values
}

export const buildAlumniTemplateDataRow = (record = {}, getRawValue) =>
  ALUMNI_TEMPLATE_HEADERS.map((key) => {
    const value = collectCandidates(record, key, getRawValue).find(hasMeaningfulValue)
    return formatTemplateCellValue(value)
  })

export const buildAlumniTemplateAoA = (records = [], getRawValue) => [
  ALUMNI_TEMPLATE_HEADERS,
  ...records.map((record) => buildAlumniTemplateDataRow(record, getRawValue)),
]

