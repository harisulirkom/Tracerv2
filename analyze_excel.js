import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, 'template-jawaban-alumni.xlsx');
console.log(`Reading file: ${filePath}`);

try {
    const workbook = XLSX.readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames);

    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (json.length > 0) {
            console.log('Headers:', json[0]);
            if (json.length > 1) {
                console.log('First row of data:', json[1]);
            } else {
                console.log('No data rows found');
            }
        } else {
            console.log('Empty sheet');
        }
    });
} catch (error) {
    console.error('Error reading file:', error);
}
