
import { SYSTEM_CONFIG } from '../constants';
import { Letter } from '../types';

/**
 * Sends data to Google.
 * We use text/plain and no-cors to avoid the complex "Preflight" check 
 * which often causes the "Failed to Fetch" error in browsers.
 */
export const syncToGoogle = async (payload: any) => {
  const scriptUrl = localStorage.getItem('mrp_google_script_url') || SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  const sheetId = localStorage.getItem('mrp_google_sheet_id') || SYSTEM_CONFIG.GOOGLE.SHEET_ID;
  const folderId = localStorage.getItem('mrp_google_folder_id') || SYSTEM_CONFIG.GOOGLE.FOLDER_ID;

  if (!scriptUrl || scriptUrl === '' || scriptUrl.includes('YOUR_SCRIPT_URL')) {
    return { status: 'skipped' };
  }

  try {
    const body = JSON.stringify({
      ...payload,
      sheetId,
      folderId,
      timestamp: new Date().toISOString()
    });

    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', 
      cache: 'no-cache',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: body,
    });
    
    return { status: 'success' };
  } catch (error) {
    console.error('[CloudSync] Sync Failed:', error);
    throw error;
  }
};

/**
 * Fetches data from the master sheet.
 */
export const fetchLettersFromGoogle = async (): Promise<Letter[]> => {
  const scriptUrl = localStorage.getItem('mrp_google_script_url') || SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  const sheetId = localStorage.getItem('mrp_google_sheet_id') || SYSTEM_CONFIG.GOOGLE.SHEET_ID;

  if (!scriptUrl || scriptUrl === '' || scriptUrl.includes('YOUR_SCRIPT_URL')) {
    return [];
  }

  try {
    const url = `${scriptUrl}?action=getLetters&sheetId=${sheetId}&cache_bust=${Date.now()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[CloudSync] Fetch Failed:', error);
    // Rethrow with a cleaner message for the UI
    throw new Error('MASTER_FETCH_FAILED');
  }
};

export const pingCloud = async (): Promise<boolean> => {
  const scriptUrl = localStorage.getItem('mrp_google_script_url') || SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  if (!scriptUrl || scriptUrl === '') return false;
  try {
    const url = `${scriptUrl}?action=ping&t=${Date.now()}`;
    const response = await fetch(url, { method: 'GET', mode: 'cors', redirect: 'follow' });
    const text = await response.text();
    return text.includes('pong');
  } catch { return false; }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};
