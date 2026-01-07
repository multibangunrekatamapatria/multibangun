
import { SYSTEM_CONFIG } from '../constants';
import { Letter } from '../types';

/**
 * Sends data to the Google Apps Script using POST.
 * Note: Browser POSTs to GAS often trigger "no-cors" mode requirements.
 */
export const syncToGoogle = async (payload: any) => {
  const scriptUrl = localStorage.getItem('mrp_google_script_url') || SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  const sheetId = localStorage.getItem('mrp_google_sheet_id') || SYSTEM_CONFIG.GOOGLE.SHEET_ID;
  const folderId = localStorage.getItem('mrp_google_folder_id') || SYSTEM_CONFIG.GOOGLE.FOLDER_ID;

  if (!scriptUrl || scriptUrl.includes('YOUR_SCRIPT_URL') || scriptUrl === '') {
    return { status: 'skipped' };
  }

  try {
    // We send as text/plain to avoid CORS pre-flight OPTIONS check which GAS doesn't support
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
    
    return { status: 'success' };
  } catch (error) {
    console.error('[CloudSync] POST Failure:', error);
    throw error;
  }
};

/**
 * Fetches data via GET. 
 */
export const fetchLettersFromGoogle = async (): Promise<Letter[]> => {
  const scriptUrl = localStorage.getItem('mrp_google_script_url') || SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  const sheetId = localStorage.getItem('mrp_google_sheet_id') || SYSTEM_CONFIG.GOOGLE.SHEET_ID;

  if (!scriptUrl || scriptUrl === '' || scriptUrl.includes('YOUR_SCRIPT_URL')) {
    return [];
  }

  try {
    const url = `${scriptUrl}?action=getLetters&sheetId=${sheetId}&t=${Date.now()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow', // Crucial for GAS redirects
    });
    
    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[CloudSync] GET Failure:', error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error('NETWORK_OR_CORS_BLOCKED');
    }
    throw error; 
  }
};

export const pingCloud = async (): Promise<boolean> => {
  const scriptUrl = localStorage.getItem('mrp_google_script_url') || SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  if (!scriptUrl || scriptUrl === '') return false;

  try {
    const url = `${scriptUrl}?action=ping`;
    const response = await fetch(url, { method: 'GET', mode: 'cors', redirect: 'follow' });
    const text = await response.text();
    return text === 'pong';
  } catch {
    return false;
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
