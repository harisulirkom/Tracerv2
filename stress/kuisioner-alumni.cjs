const NIMS = [
  '190802009',
  '20102079',
  '20103032',
  '20106009',
  '20201011',
  '20201018',
  '20201048',
  '20205106',
  '20205114',
  '20302001',
  '20505010',
  '21501004',
  '21501040',
  '21504016',
  '21504018',
  '21504020',
  '21505001',
  '21505016',
];

const STATUSES = ['bekerja', 'wiraswasta', 'melanjutkan', 'mencari', 'belum'];
const INDUSTRIES = ['Teknologi', 'Pendidikan', 'Keuangan', 'Manufaktur', 'Kesehatan', 'Lainnya'];
const SALARYS = ['1-3 jt', '3-5 jt', '5-8 jt', '8-12 jt', '>12 jt'];
const SCORES = ['1', '2', '3', '4', '5'];

function pickRandom(list) {
  if (!list.length) return '';
  return list[Math.floor(Math.random() * list.length)];
}

function buildPayload(req, context, ee, next) {
  const ids = Array.isArray(context.vars.questionIds) ? context.vars.questionIds : [];

  const nim = pickRandom(NIMS) || `190802${Math.floor(Math.random() * 9000) + 1000}`;
  const status = pickRandom(STATUSES) || 'belum';
  const answers = ids.map((id, index) => {
    let jawaban = 'Test';
    if (index % 7 === 0) {
      jawaban = pickRandom(SCORES) || '3';
    } else if (index % 5 === 0) {
      jawaban = pickRandom(SALARYS) || '3-5 jt';
    } else if (index % 3 === 0) {
      jawaban = String(Math.floor(Math.random() * 12) + 1);
    }
    return {
      question_id: Number(id),
      jawaban,
    };
  });

  req.json = {
    nim,
    questionnaire_id: context.vars.questionnaireId || 1,
    answers,
    form_data: {
      nim,
      nama: 'Stress Test',
      status,
      bekerja_jenisPerusahaan: pickRandom(INDUSTRIES) || 'Lainnya',
      bekerja_pendapatan: pickRandom(SALARYS) || '3-5 jt',
    },
  };

  return next();
}

module.exports = {
  buildPayload,
};
