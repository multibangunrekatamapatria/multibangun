
import React, { useState, useEffect } from 'react';
import { getUsers, saveUser, deleteUser } from '../services/userService';
import { User } from '../types';
import { 
  UserPlus, 
  Trash2, 
  Shield, 
  Users, 
  Database, 
  Globe, 
  Save, 
  CheckCircle, 
  Activity, 
  AlertCircle, 
  Code2, 
  Copy, 
  Check,
  RefreshCw,
  Info,
  FolderOpen
} from 'lucide-react';
import { SYSTEM_CONFIG } from '../constants';
import { pingCloud } from '../services/googleService';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [diagStatus, setDiagStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [diagError, setDiagError] = useState<string | null>(null);
  
  const [newUser, setNewUser] = useState<{
    username: string;
    password: string;
    fullName: string;
    role: 'admin' | 'user';
    department: string;
  }>({ username: '', password: '', fullName: '', role: 'user', department: '' });
  
  const [config, setConfig] = useState({
    scriptUrl: localStorage.getItem('mrp_google_script_url') || SYSTEM_CONFIG.GOOGLE.SCRIPT_URL,
    sheetId: localStorage.getItem('mrp_google_sheet_id') || SYSTEM_CONFIG.GOOGLE.SHEET_ID,
    folderId: localStorage.getItem('mrp_google_folder_id') || SYSTEM_CONFIG.GOOGLE.FOLDER_ID
  });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    saveUser(newUser);
    setUsers(getUsers());
    setShowAddModal(false);
    setNewUser({ username: '', password: '', fullName: '', role: 'user', department: '' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete user?')) {
      deleteUser(id);
      setUsers(getUsers());
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem('mrp_google_script_url', config.scriptUrl);
    localStorage.setItem('mrp_google_sheet_id', config.sheetId);
    localStorage.setItem('mrp_google_folder_id', config.folderId);
    setSaveStatus('Config Updated!');
    setTimeout(() => {
      setSaveStatus(null);
      window.location.reload();
    }, 1000);
  };

  const runDiagnostics = async () => {
    setDiagStatus('testing');
    setDiagError(null);
    try {
      const ok = await pingCloud();
      if (ok) {
        setDiagStatus('success');
      } else {
        throw new Error("No response from Script.");
      }
    } catch (err: any) {
      setDiagStatus('error');
      setDiagError("BLOCKED: Your browser cannot reach the script. Make sure to click 'Authorize Access' in the Google Apps Script deployment settings.");
    }
  };

  const scriptCode = `/**
 * PT MRP - MASTER BACKEND v3.1 (Includes File Upload)
 */

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'ping') return ContentService.createTextOutput("pong").setMimeType(ContentService.MimeType.TEXT);

  const sheetId = e.parameter.sheetId;
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheets()[0];
  
  if (action === 'getLetters') {
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const json = data.map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        if (h === 'files') {
          try { obj[h] = JSON.parse(row[i] || '[]'); } 
          catch(e) { obj[h] = []; }
        } else { obj[h] = row[i]; }
      });
      return obj;
    });
    return ContentService.createTextOutput(JSON.stringify(json)).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'saveLetter') {
      const ss = SpreadsheetApp.openById(body.sheetId);
      const sheet = ss.getSheets()[0];
      const headers = sheet.getDataRange().getValues()[0];
      const newRow = headers.map(h => h === 'files' ? JSON.stringify(body.data[h]) : body.data[h]);
      sheet.appendRow(newRow);
      return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
    }

    if (action === 'uploadFile') {
      const folder = DriveApp.getFolderById(body.folderId);
      const decoded = Utilities.base64Decode(body.fileData);
      const blob = Utilities.newBlob(decoded, body.mimeType, body.fileName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return ContentService.createTextOutput(file.getUrl()).setMimeType(ContentService.MimeType.TEXT);
    }
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}`;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Portal Administration</h1>
          <p className="text-sm text-gray-500 font-medium">Control cloud infrastructure and user access.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg">
          <UserPlus size={18} /> Add User
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* USERS */}
          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center gap-3 font-black text-gray-900 uppercase tracking-tight">
              <Users size={24} className="text-blue-600" /> Authorized Personnel
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                  <th className="px-8 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-8 py-4">
                      <div className="text-sm font-black text-gray-900">{u.fullName}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">{u.department}</div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      {u.username !== 'admin' && <button onClick={() => handleDelete(u.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={18} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DIAGNOSTICS */}
          <div className="bg-[#0f172a] rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xl flex items-center gap-3 uppercase tracking-tighter">
                  <Activity size={24} className="text-emerald-400" /> Connectivity Monitor
                </h3>
                <button 
                  onClick={runDiagnostics} 
                  disabled={diagStatus === 'testing'}
                  className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/5 transition-all"
                >
                  {diagStatus === 'testing' ? <RefreshCw size={14} className="animate-spin" /> : 'Run Test'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Handshake Status</p>
                  {diagStatus === 'success' ? (
                    <div className="flex items-center gap-3 text-emerald-400 font-black"><CheckCircle size={20} /> <span className="uppercase text-sm tracking-widest">Active</span></div>
                  ) : diagStatus === 'error' ? (
                    <div className="flex items-start gap-3 text-red-400 font-black"><AlertCircle size={20} /> <p className="text-[10px] text-red-200 leading-relaxed uppercase">{diagError}</p></div>
                  ) : <p className="text-sm text-gray-500 italic">Idle</p>}
                </div>
                <div className="bg-blue-500/10 rounded-2xl p-6 flex items-start gap-3 border border-blue-500/10">
                  <Info size={20} className="text-blue-400 shrink-0" />
                  <p className="text-[10px] text-blue-100/70 leading-relaxed font-bold uppercase tracking-tight">
                    If blocked, click "Get Script Code" below, replace your script, and click "Deploy". Don't forget to authorize permissions!
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCodeModal(true)} className="w-full bg-white/5 hover:bg-white/10 p-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                <Code2 size={16} /> Get Master Script Code
              </button>
            </div>
          </div>
        </div>

        {/* CONFIG */}
        <div className="bg-white rounded-[2rem] p-8 border border-gray-200 shadow-sm space-y-6 h-fit sticky top-8">
          <h3 className="font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
            <Globe size={20} className="text-blue-600" /> Infrastructure
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Apps Script Web App URL</label>
              <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono" value={config.scriptUrl} onChange={e => setConfig({...config, scriptUrl: e.target.value})} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Google Sheet ID</label>
              <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono" value={config.sheetId} onChange={e => setConfig({...config, sheetId: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Drive Folder ID (for Storage)</label>
              <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono" value={config.folderId} onChange={e => setConfig({...config, folderId: e.target.value})} />
            </div>
            <button onClick={handleSaveConfig} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
              <Save size={16} /> Apply Settings
            </button>
            {saveStatus && <p className="text-center text-[10px] font-black text-emerald-600 uppercase tracking-widest animate-pulse">{saveStatus}</p>}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showCodeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight">Full Backend Script</h3>
              <button onClick={() => setShowCodeModal(false)} className="text-gray-400 hover:text-black"><Activity size={24} className="rotate-45" /></button>
            </div>
            <div className="p-8 bg-gray-900 relative">
              <button onClick={() => { navigator.clipboard.writeText(scriptCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-10 right-10 bg-white/10 text-white p-3 rounded-lg">
                {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </button>
              <pre className="text-[11px] font-mono text-blue-200 overflow-auto max-h-[350px] leading-relaxed custom-scrollbar">
                {scriptCode}
              </pre>
            </div>
            <div className="p-8 bg-gray-50 flex items-center justify-around text-center border-t border-gray-100">
              <div className="space-y-1"><p className="text-[8px] font-black text-gray-400 uppercase">Type</p><p className="text-[10px] font-black text-blue-600 uppercase">Web App</p></div>
              <div className="space-y-1"><p className="text-[8px] font-black text-gray-400 uppercase">Execute As</p><p className="text-[10px] font-black text-blue-600 uppercase">Me</p></div>
              <div className="space-y-1"><p className="text-[8px] font-black text-gray-400 uppercase">Access</p><p className="text-[10px] font-black text-blue-600 uppercase">Anyone</p></div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight">New Account</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold" placeholder="Full Name" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
              <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold" placeholder="Username" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
              <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 font-black text-[10px] uppercase text-gray-400">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
