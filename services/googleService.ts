
export const syncToGoogle = async (payload: any) => {
  const scriptUrl = localStorage.getItem('mrp_google_script_url');
  const sheetId = localStorage.getItem('mrp_google_sheet_id');
  const folderId = localStorage.getItem('mrp_google_folder_id');

  if (!scriptUrl) return null;

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', // Apps Script requires no-cors for simple posts
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
