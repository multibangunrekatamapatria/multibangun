
import { Letter, LetterTypeCode } from '../types';
import { ROMAN_MONTHS } from '../constants';

const LETTERS_KEY = 'mrp_letters_db';

export const getLetters = (): Letter[] => {
  const data = localStorage.getItem(LETTERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveLetter = (letterData: Partial<Letter>): Letter => {
  const letters = getLetters();
  
  // Calculate next sequence for this year
  const dateObj = new Date(letterData.date || new Date().toISOString());
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  
  const currentYearLetters = letters.filter(l => new Date(l.date).getFullYear() === year);
  const sequence = (currentYearLetters.length > 0 
    ? Math.max(...currentYearLetters.map(l => l.sequence)) 
    : 0) + 1;

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
