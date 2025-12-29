
import { SYSTEM_CONFIG } from '../constants';
import { Letter } from '../types';

export const syncToGoogle = async (payload: any) => {
  const scriptUrl = SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  const sheetId = SYSTEM_CONFIG.GOOGLE.SHEET_ID;
  const folderId = SYSTEM_CONFIG.GOOGLE.FOLDER_ID;

  try {
    // We use a POST request to send data to the Google Apps Script
    const response = await fetch(scriptUrl, {
      method: 'POST',
      redirect: 'follow', // Crucial for Google Apps Script redirects
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script handles text/plain best for CORS-less POSTs
      },
      body: JSON.stringify({
        ...payload,
        sheetId,
        folderId
      }),
    });
    
    return { status: 'success' };
  } catch (error) {
    console.error('Google Sync Error:', error);
    return null;
  }
};

export const fetchLettersFromGoogle = async (): Promise<Letter[]> => {
  const scriptUrl = SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  const sheetId = SYSTEM_CONFIG.GOOGLE.SHEET_ID;

  try {
    // Append action=getLetters to the URL for a GET request
    const url = `${scriptUrl}?action=getLetters&sheetId=${sheetId}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error('Failed to fetch from Google');
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Could not fetch cloud data, falling back to local storage:', error);
    return [];
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
