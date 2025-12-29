
import { Letter, LetterTypeCode } from '../types';
import { ROMAN_MONTHS } from '../constants';
import { syncToGoogle } from './googleService';

const LETTERS_KEY = 'mrp_letters_db';

export const getLetters = (): Letter[] => {
  const data = localStorage.getItem(LETTERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const setLetters = (letters: Letter[]) => {
  localStorage.setItem(LETTERS_KEY, JSON.stringify(letters));
};

export const saveLetter = (letterData: Partial<Letter>): Letter => {
  const letters = getLetters();
  
  const dateObj = new Date(letterData.date || new Date().toISOString());
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  
  const yearLetters = letters.filter(l => new Date(l.date).getFullYear() === year);
  
  let sequence: number;
  if (yearLetters.length > 0) {
    sequence = Math.max(...yearLetters.map(l => l.sequence || 0)) + 1;
  } else {
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
  
  // Sync to Google
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
  
  const updatedLetter = { ...letters[index], ...updates };
  
  // Recalculate letter number if date or type changed
  const dateObj = new Date(updatedLetter.date);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const romanMonth = ROMAN_MONTHS[month];
  const sequenceStr = updatedLetter.sequence.toString().padStart(3, '0');
  
  updatedLetter.letterNumber = `${sequenceStr}/MRP/${updatedLetter.typeCode}/${romanMonth}/${year}`;
  
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
