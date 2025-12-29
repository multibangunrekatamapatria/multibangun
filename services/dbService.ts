
import { Letter, LetterTypeCode } from '../types';
import { ROMAN_MONTHS } from '../constants';
import { syncToGoogle } from './googleService';

const LETTERS_KEY = 'mrp_letters_db';

export const getLetters = (): Letter[] => {
  const data = localStorage.getItem(LETTERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveLetter = (letterData: Partial<Letter>): Letter => {
  const letters = getLetters();
  
  const dateObj = new Date(letterData.date || new Date().toISOString());
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  
  // Filter letters belonging to the selected year
  const yearLetters = letters.filter(l => new Date(l.date).getFullYear() === year);
  
  let sequence: number;
  
  if (yearLetters.length > 0) {
    // If we already have letters for this year, continue the sequence
    sequence = Math.max(...yearLetters.map(l => l.sequence)) + 1;
  } else {
    // If this is the first letter of the year:
    // 2025 starts from 341 to match existing physical records
    // 2026 and onwards start from 1
    sequence = (year === 2025) ? 341 : 1;
  }

  const sequenceStr = sequence.toString().padStart(3, '0');
  const romanMonth = ROMAN_MONTHS[month];
  
  const letterNumber = `${sequenceStr}/MRP/${letterData.typeCode}/${romanMonth}/${year}`;
  
  const newLetter: Letter = {
    id: crypto.randomUUID(),
    letterNumber,
    sequence,
    date: letterData.date!,
    companyName: letterData.companyName!,
    requestor: letterData.requestor!,
    typeCode: letterData.typeCode!,
    subject: letterData.subject!,
    createdAt: new Date().toISOString(),
    files: [],
    ...letterData
  };

  const updatedLetters = [newLetter, ...letters];
  localStorage.setItem(LETTERS_KEY, JSON.stringify(updatedLetters));
  
  // Async sync to Google Sheets
  syncToGoogle({
    action: 'saveLetter',
    ...newLetter
  });

  return newLetter;
};

export const updateLetter = (id: string, updates: Partial<Letter>): Letter => {
  const letters = getLetters();
  const index = letters.findIndex(l => l.id === id);
  if (index === -1) throw new Error('Letter not found');
  
  const updatedLetter = { ...letters[index], ...updates };
  letters[index] = updatedLetter;
  localStorage.setItem(LETTERS_KEY, JSON.stringify(letters));
  return updatedLetter;
};

export const deleteLetter = (id: string) => {
  const letters = getLetters();
  const filtered = letters.filter(l => l.id !== id);
  localStorage.setItem(LETTERS_KEY, JSON.stringify(filtered));
};
