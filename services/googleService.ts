
import { SYSTEM_CONFIG } from '../constants';
import { Letter } from '../types';

/**
 * Sends data to the Google Apps Script using POST.
 */
export const syncToGoogle = async (payload: any) => {
  const scriptUrl = SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  const sheetId = SYSTEM_CONFIG.GOOGLE.SHEET_ID;
  const folderId = SYSTEM_CONFIG.GOOGLE.FOLDER_ID;

  console.log(`[GoogleSync] Attempting ${payload.action}...`);

  try {
    // We use text/plain to avoid CORS pre-flight triggers in simple Apps Script setups
    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', 
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
    
    // Note: With no-cors we can't read the response body, but the request is fired.
    return { status: 'dispatched' };
  } catch (error) {
    console.error('[GoogleSync] Request failed:', error);
    throw error;
  }
};

/**
 * Fetches letters from the Google Sheet via GET.
 */
export const fetchLettersFromGoogle = async (): Promise<Letter[]> => {
  const scriptUrl = SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  const sheetId = SYSTEM_CONFIG.GOOGLE.SHEET_ID;

  try {
    // Adding a cache-buster timestamp
    const url = `${scriptUrl}?action=getLetters&sheetId=${sheetId}&t=${Date.now()}`;
    console.log('[GoogleSync] Fetching database from cloud...');
    
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });
    
    if (!response.ok) {
      throw new Error(`Cloud Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[GoogleSync] Cloud data loaded: ${data.length} records found.`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[GoogleSync] Critical Fetch Error:', error);
    // Return empty array so app can still function, but warn the user
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
