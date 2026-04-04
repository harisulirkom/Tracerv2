import XLSX from 'xlsx';
import axios from 'axios';
import fs from 'fs';

// Constants from AdminKuisionerResponsesView.vue
const arrayColumns = ['kompetensi_individu', 'kompetensi_pembelajaran'];
const objectColumns = [];
const FIXED_HEADERS = [
    'nama', 'nik', 'nim', 'fakultas', 'prodi', 'tahun', 'email', 'status', 'ekstra',
    'bekerja_mulaiSebelum', 'bekerja_mulaiSetelah', 'bekerja_lebihCepat6Bulan', 'bekerja_bulanDapat', 'bekerja_bulanTidak',
    'bekerja_pendapatan', 'bekerja_tingkatTempatKerja', 'bekerja_lokasiDetail', 'bekerja_provinsi', 'bekerja_kabupaten',
    'bekerja_jenisPerusahaan', 'bekerja_namaPerusahaan', 'bekerja_namaPimpinan', 'bekerja_telpPerusahaan', 'bekerja_caraMencari',
    'bekerja_perusahaanLamar', 'bekerja_perusahaanRespon', 'bekerja_perusahaanWawancara', 'bekerja_posisi', 'bekerja_kesesuaianBidang', 'bekerja_pendidikanSesuai',
    'wira_namaPerusahaan', 'wira_telpPerusahaan', 'wira_jenisPerusahaan', 'wira_bidang', 'wira_tingkat', 'wira_kesesuaian', 'wira_pendidikan',
    'studi_lokasi', 'studi_sumberBiaya', 'studi_namaPt', 'studi_prodi', 'studi_tanggalMasuk', 'studi_alasan',
    'mencari_mulaiSebelum', 'mencari_mulaiSetelah', 'mencari_cara', 'mencari_perusahaanLamar', 'mencari_perusahaanRespon', 'mencari_perusahaanWawancara', 'mencari_aktif4Minggu',
    'kompetensi_individu', 'kompetensi_pembelajaran', 'sumberDana'
];

const findHeaderIndex = (headers, key) => {
    return headers.findIndex(h => String(h || '').trim().toLowerCase() === key.toLowerCase())
}

const isSampleRowArray = (row = []) => {
    if (!row.length) return false
    const sampleValues = ['Mawar Melati', '1234567890123456', 'mawar@example.com']
    const normalized = row.map((cell) => String(cell ?? '').trim())
    return sampleValues.some(val => normalized.includes(val))
}

const getElementValue = (obj, keys) => {
    for (const k of keys) {
        if (obj[k]) return obj[k]
    }
    return ''
}

async function runDebug() {
    try {
        console.log("Reading file: debug_template.xlsx");
        const workbook = XLSX.readFile('debug_template.xlsx');

        let sheetName = workbook.SheetNames.find(name => name === 'Template');
        if (!sheetName) sheetName = workbook.SheetNames[0];
        console.log(`Using Sheet: ${sheetName}`);

        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false,
        });

        if (rawRows.length < 1) throw new Error('File kosong.');
        const headerRow = rawRows[0];
        console.log("Headers detected:", headerRow);

        let dataRows = rawRows.slice(1);

        // Sample detection
        if (dataRows.length && isSampleRowArray(dataRows[0])) {
            console.log("Sample row detected and removed.");
            dataRows = dataRows.slice(1);
        } else {
            console.log("No sample row detected or it was already removed.");
        }

        dataRows = dataRows.filter((row) =>
            row.some((cell) => String(cell ?? '').trim().length)
        );

        console.log(`Found ${dataRows.length} valid data rows.`);
        if (dataRows.length === 0) {
            console.log("WARNING: No data rows found to import!");
            return;
        }

        const payloads = dataRows.map(row => {
            const getValue = (key) => {
                const idx = findHeaderIndex(headerRow, key)
                return idx !== -1 ? row[idx] : ''
            }

            const normalized = {}
            const headerKeys = headerRow.map(h => String(h || '').trim())

            headerKeys.forEach((key, idx) => {
                let val = row[idx]
                if (arrayColumns.includes(key)) {
                    if (typeof val === 'string') {
                        val = val.split(';').map(v => v.trim()).filter(Boolean)
                    }
                    if (!Array.isArray(val)) val = val ? [val] : []
                }
                normalized[key] = val
            })

            return {
                type: 'alumni',
                audience: 'alumni',
                questionnaire_id: 1, // HARDCODED for debugging
                answers: [],

                // Identity
                nama: getValue('nama') || 'Responden',
                nim: getValue('nim') || '',
                nik: getValue('nik') || '',
                email: getValue('email') || '',
                prodi: getValue('prodi') || '',
                fakultas: getValue('fakultas') || '',
                tahun: getValue('tahun') || '',
                status: (getValue('status') || 'belum').toLowerCase(),

                // Metrics
                waitMonths:
                    getElementValue(normalized, ['bekerja_bulanDapat', 'bekerja_bulanTidak', 'mencari_mulaiSetelah', 'mencari_mulaiSebelum']) || 0,
                salary: getValue('bekerja_pendapatan') || 0,
                province: getValue('bekerja_provinsi') || getValue('studi_lokasi') || '',
                industry: getValue('bekerja_jenisPerusahaan') || getValue('wira_jenisPerusahaan') || getValue('wira_bidang') || '',
                eduFit: getValue('bekerja_pendidikanSesuai') || getValue('wira_pendidikan') || '',

                // Raw data
                raw: { ...normalized },
                form_data: { ...normalized }
            }
        });

        console.log("First Payload Sample:", JSON.stringify(payloads[0], null, 2));

        console.log("Sending to Backend...");
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/submissions/bulk', {
                data: payloads
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            console.log("Success! Created count:", response.data.data.length);
        } catch (error) {
            if (error.response) {
                console.error("API Error Status:", error.response.status);
                console.error("API Error Data:", JSON.stringify(error.response.data, null, 2));
            } else {
                console.error("Network Error:", error.message);
            }
        }

    } catch (err) {
        console.error("Script Error:", err);
    }
}

runDebug();
