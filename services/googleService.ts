
import { SYSTEM_CONFIG } from '../constants';
import { Letter } from '../types';

/**
 * Sends data to the Google Apps Script using POST.
 * Note: Mode 'no-cors' is used because GAS does not support standard CORS for POST requests.
 */
export const syncToGoogle = async (payload: any) => {
  const scriptUrl = SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  const sheetId = SYSTEM_CONFIG.GOOGLE.SHEET_ID;
  const folderId = SYSTEM_CONFIG.GOOGLE.FOLDER_ID;

  if (!scriptUrl || scriptUrl.includes('YOUR_SCRIPT_URL') || scriptUrl === '') {
    console.warn('[GoogleSync] No valid Script URL configured.');
    return;
  }

  try {
    // We use text/plain to avoid pre-flight OPTIONS request which GAS doesn't handle well
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', 
      cache: 'no-cache',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        ...payload,
        sheetId,
        folderId,
        timestamp: new Date().toISOString()
      }),
    });
    return { status: 'dispatched' };
  } catch (error) {
    console.error('[GoogleSync] Cloud Save Failed:', error);
    throw error;
  }
};

/**
 * Fetches letters from the Google Sheet via GET.
 * CRITICAL: The GAS Deployment MUST be set to "Anyone".
 */
export const fetchLettersFromGoogle = async (): Promise<Letter[]> => {
  const scriptUrl = SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  const sheetId = SYSTEM_CONFIG.GOOGLE.SHEET_ID;

  if (!scriptUrl || scriptUrl === '' || scriptUrl.includes('YOUR_SCRIPT_URL')) {
    console.warn('[GoogleSync] No Script URL detected.');
    return [];
  }

  try {
    // Cache-busting prevents stale data on different computers
    const url = `${scriptUrl}?action=getLetters&sheetId=${sheetId}&t=${Date.now()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Cloud Error: ${response.status}`);
    }
    
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      if (data && data.error) throw new Error(data.error);
      return Array.isArray(data) ? data : [];
    } catch (parseError) {
      console.error('[GoogleSync] Server returned non-JSON. Deployment is likely not "Anyone".');
      return [];
    }
  } catch (error) {
    console.error('[GoogleSync] CONNECTION ERROR:', error);
    throw error; 
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
