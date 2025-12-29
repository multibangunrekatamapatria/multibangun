
import { SYSTEM_CONFIG } from '../constants';

export const syncToGoogle = async (payload: any) => {
  // First try to get from local storage (if admin changed it), otherwise use system default
  const scriptUrl = localStorage.getItem('mrp_google_script_url') || SYSTEM_CONFIG.GOOGLE.SCRIPT_URL;
  const sheetId = localStorage.getItem('mrp_google_sheet_id') || SYSTEM_CONFIG.GOOGLE.SHEET_ID;
  const folderId = localStorage.getItem('mrp_google_folder_id') || SYSTEM_CONFIG.GOOGLE.FOLDER_ID;

  if (!scriptUrl) {
    console.warn('Google Script URL is not configured.');
    return null;
  }

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        sheetId,
        folderId
      }),
    });
    return { status: 'sent' };
  } catch (error) {
    console.error('Google Sync Error:', error);
    return null;
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
