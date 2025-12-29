
export enum LetterTypeCode {
  PWRN = 'PWRN',
  SK = 'SK',
  TUGAS = 'TUGAS',
  SURDUK = 'SURDUK',
  MISC = 'MISC',
  SPK = 'SPK',
  SUKET = 'SUKET'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'user';
  fullName: string;
  department: string;
}

export interface Letter {
  id: string;
  letterNumber: string;
  sequence: number;
  date: string;
  companyName: string;
  requestor: string;
  typeCode: LetterTypeCode;
  subject: string;
  
  // Conditional fields
  materialInquired?: string;
  projectName?: string;
  startDate?: string;
  transportation?: string;
  installerNames?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  companyRequested?: string;
  picName?: string;
  expirationDate?: string;
  
  // File management
  files: Array<{
    name: string;
    url: string;
    uploadedAt: string;
  }>;
  createdAt: string;
}

export interface PONumber {
  id: string;
  poNumber: string;
  createdAt: string;
}
