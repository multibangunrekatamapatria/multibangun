
import { Letter, LetterTypeCode } from '../types';
import { ROMAN_MONTHS } from '../constants';
import { syncToGoogle } from './googleService';

const LETTERS_KEY = 'mrp_letters_db';

export const getLetters = (): Letter[] => {
  const data = localStorage.getItem(LETTERS_KEY);
  return data ? JSON.parse(data) : [];
};

/**
 * Merges cloud data into local storage. 
 * Important: This ensures Incognito sessions get the latest cloud state.
 */
export const setLetters = (letters: Letter[]) => {
  localStorage.setItem(LETTERS_KEY, JSON.stringify(letters));
};

export const saveLetter = (letterData: Partial<Letter>): Letter => {
  const letters = getLetters();
  
  const dateObj = new Date(letterData.date || new Date().toISOString());
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  
  // Find letters for the same year to determine next sequence number
  const yearLetters = letters.filter(l => {
    const lDate = new Date(l.date);
    return lDate.getFullYear() === year;
  });
  
  let sequence: number;
  if (yearLetters.length > 0) {
    // Find the actual highest number used in the cloud/local DB for this year
    sequence = Math.max(...yearLetters.map(l => l.sequence || 0)) + 1;
  } else {
    // If it's the first letter of the year
    // Rule: 2025 starts at 341, others start at 001
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
  
  // Sync to Google Sheets
  syncToGoogle({
    action: 'saveLetter',
    data: newLetter
  });

  return newLetter;
};

export const updateLetter = (id: string, updates: Partial<Letter>): Letter => {
  const letters = getLetters();
  const index = letters.findIndex(l => l.id === id);
  if (index === -1) throw new Error('Letter not found');
  
  const originalLetter = letters[index];
  const updatedLetter = { ...originalLetter, ...updates };
  
  // Recalculate letter number only if type or date changed
  if (updates.date || updates.typeCode) {
    const dateObj = new Date(updatedLetter.date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const romanMonth = ROMAN_MONTHS[month];
    const sequenceStr = updatedLetter.sequence.toString().padStart(3, '0');
    updatedLetter.letterNumber = `${sequenceStr}/MRP/${updatedLetter.typeCode}/${romanMonth}/${year}`;
  }
  
  letters[index] = updatedLetter;
  localStorage.setItem(LETTERS_KEY, JSON.stringify(letters));
  
  syncToGoogle({
    action: 'updateLetter',
    id: id,
    data: updatedLetter
  });
  
  return updatedLetter;
};

export const deleteLetter = (id: string) => {
  const letters = getLetters();
  const filtered = letters.filter(l => l.id !== id);
  localStorage.setItem(LETTERS_KEY, JSON.stringify(filtered));
  
  syncToGoogle({
    action: 'deleteLetter',
    id: id
  });
};
