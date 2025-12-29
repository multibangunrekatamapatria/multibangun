
import { SYSTEM_CONFIG } from '../constants';
import { Letter } from '../types';

/**
 * Sends data to the Google Apps Script.
 * Uses a standard POST request. Note: Apps Script often returns a 302 redirect.
 */
export const syncToGoogle = async (payload: any) => {
  const scriptUrl = SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  const sheetId = SYSTEM_CONFIG.GOOGLE.SHEET_ID;
  const folderId = SYSTEM_CONFIG.GOOGLE.FOLDER_ID;

  console.log(`[GoogleSync] Sending ${payload.action}...`);

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', // Standard for Public Apps Scripts to avoid pre-flight CORS issues
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        ...payload,
        sheetId,
        folderId
      }),
    });
    
    // With no-cors, we can't see the response body, but the request is sent.
    return { status: 'sent' };
  } catch (error) {
    console.error('[GoogleSync] Error:', error);
    throw error;
  }
};

/**
 * Fetches letters from the Google Sheet.
 */
export const fetchLettersFromGoogle = async (): Promise<Letter[]> => {
  const scriptUrl = SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  const sheetId = SYSTEM_CONFIG.GOOGLE.SHEET_ID;

  try {
    const url = `${scriptUrl}?action=getLetters&sheetId=${sheetId}&t=${Date.now()}`;
    console.log('[GoogleSync] Fetching cloud data...');
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    console.log(`[GoogleSync] Successfully retrieved ${data.length || 0} records.`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[GoogleSync] Fetch Error:', error);
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
