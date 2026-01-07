
import { SYSTEM_CONFIG } from '../constants';
import { Letter } from '../types';

/**
 * Sends data to the Google Apps Script using POST.
 */
export const syncToGoogle = async (payload: any) => {
  const scriptUrl = localStorage.getItem('mrp_google_script_url') || SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  const sheetId = localStorage.getItem('mrp_google_sheet_id') || SYSTEM_CONFIG.GOOGLE.SHEET_ID;
  const folderId = localStorage.getItem('mrp_google_folder_id') || SYSTEM_CONFIG.GOOGLE.FOLDER_ID;

  if (!scriptUrl || scriptUrl.includes('YOUR_SCRIPT_URL') || scriptUrl === '') {
    console.warn('[GoogleSync] No valid Script URL configured.');
    return;
  }

  try {
    // We use text/plain for the body to avoid pre-flight CORS preflights
    // GAS handles JSON strings inside the request body even if the mime-type is text/plain
    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', // Critical: GAS POST only works with no-cors or specialized redirects
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
    
    // Note: With no-cors, we can't read the response status, 
    // but we can assume success if no network error occurred.
    return { status: 'dispatched' };
  } catch (error) {
    console.error('[GoogleSync] Cloud Save Failed:', error);
    throw error;
  }
};

/**
 * Fetches letters from the Google Sheet via GET.
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
      mode: 'cors', // GET requests support CORS if GAS is deployed correctly
      redirect: 'follow',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }
    
    const data = await response.json();
    if (data && data.error) throw new Error(data.error);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[GoogleSync] CONNECTION ERROR:', error);
    // Rethrow a more descriptive error for the UI
    if (error.message.includes('Failed to fetch')) {
      throw new Error('CORS_OR_PERMISSION_DENIED');
    }
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
