
import { LetterTypeCode } from './types';

export const ROMAN_MONTHS: { [key: number]: string } = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
  9: 'IX',
  10: 'X',
  11: 'XI',
  12: 'XII',
};

export const LETTER_TYPES = [
  { code: LetterTypeCode.PWRN, label: 'Quotation (PWRN)' },
  { code: LetterTypeCode.SK, label: 'Surat Kuasa (SK)' },
  { code: LetterTypeCode.TUGAS, label: 'Surat Perintah Tugas (TUGAS)' },
  { code: LetterTypeCode.SURDUK, label: 'Surat Dukungan (SURDUK)' },
  { code: LetterTypeCode.SPK, label: 'Surat Perintah Kerja (SPK)' },
  { code: LetterTypeCode.SUKET, label: 'Surat Keterangan (SUKET)' },
  { code: LetterTypeCode.MISC, label: 'Others (MISC)' },
];
