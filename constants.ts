
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

// Global System Configuration
export const SYSTEM_CONFIG = {
  PORTAL_NAME: 'Multiportal',
  COMPANY_NAME: 'Multibangun',
  FULL_COMPANY_NAME: 'PT MULTIBANGUN REKATAMA PATRIA',
  GOOGLE: {
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyxhTOOx7Qwovwb626u4oX_18SBlJR8z8fv1GUX2XrqHx5E-WdRmsBsxURUqAKSIBQfbw/exec',
    SHEET_ID: '11vn4x2XHRsx-V2SThBoqNrXFuuZlGa1gG21jMT3HpdE',
    FOLDER_ID: '1Blv1USh7R2Bs3ENtQJyQOpiTH-9oZhp5'
  }
};

/**
 * Formats an ISO or YYYY-MM-DD date string into dd/mm/yyyy
 */
export const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
};
