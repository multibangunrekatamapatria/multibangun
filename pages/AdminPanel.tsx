
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
  RefreshCw
} from 'lucide-react';
import { SYSTEM_CONFIG } from '../constants';
import { fetchLettersFromGoogle } from '../services/googleService';

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
    if (window.confirm('Are you sure you want to remove this user?')) {
      deleteUser(id);
      setUsers(getUsers());
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem('mrp_google_script_url', config.scriptUrl);
    localStorage.setItem('mrp_google_sheet_id', config.sheetId);
    localStorage.setItem('mrp_google_folder_id', config.folderId);
    setSaveStatus('Settings updated!');
    setTimeout(() => {
      setSaveStatus(null);
      window.location.reload(); // Reload to apply new service config
    }, 1500);
  };

  const runDiagnostics = async () => {
    setDiagStatus('testing');
    setDiagError(null);
    try {
      await fetchLettersFromGoogle();
      setDiagStatus('success');
    } catch (err: any) {
      setDiagStatus('error');
      if (err.message === 'CORS_OR_PERMISSION_DENIED') {
        setDiagError("The Script URL is blocked. Ensure 'Who has access' is set to 'Anyone' and the project is 'Deployed as Web App'.");
      } else {
        setDiagError(err.message || "Unknown Connection Error");
      }
    }
  };

  const scriptCode = `/**
 * PT MRP - GOOGLE APPS SCRIPT MASTER
 * Instructions:
 * 1. Create a Google Sheet. Copy its ID.
 * 2. Extensions -> Apps Script.
 * 3. Paste this code.
 * 4. Click 'Deploy' -> 'New Deployment'.
 * 5. Type: 'Web App'. 
 * 6. Execute as: 'Me'. 
 * 7. Who has access: 'Anyone'. (CRITICAL)
 */

function doGet(e) {
  const action = e.parameter.action;
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
        } else {
          obj[h] = row[i];
        }
      });
      return obj;
    });
    return ContentService.createTextOutput(JSON.stringify(json))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.openById(body.sheetId);
  const sheet = ss.getSheets()[0];
  const action = body.action;

  if (action === 'saveLetter') {
    const letter = body.data;
    const headers = sheet.getDataRange().getValues()[0];
    const newRow = headers.map(h => h === 'files' ? JSON.stringify(letter[h]) : letter[h]);
    sheet.appendRow(newRow);
  }
  
  // Handling for updates/deletes goes here...
  
  return ContentService.createTextOutput("Success")
    .setMimeType(ContentService.MimeType.TEXT);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Admin Control Center</h1>
          <p className="text-sm text-gray-500 font-medium">Manage security, users, and cloud connectivity.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <UserPlus size={18} />
          Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* USER TABLE */}
          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center gap-3 font-black text-gray-900 uppercase tracking-tight">
              <Users size={24} className="text-blue-600" />
              User Access Management
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-4">User Details</th>
                    <th className="px-8 py-4">Credentials</th>
                    <th className="px-8 py-4">Role</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="text-sm font-black text-gray-900">{u.fullName}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">{u.department}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-xs text-gray-600 font-mono">UID: {u.username}</div>
                        <div className="text-xs text-gray-300 font-mono">PW: ••••••••</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {u.username !== 'admin' ? (
                          <button onClick={() => handleDelete(u.id)} className="text-gray-300 hover:text-red-600 p-2 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        ) : (
                          <Shield size={18} className="text-gray-200 ml-auto mr-2" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DIAGNOSTICS SECTION */}
          <div className="bg-[#0f172a] rounded-[2rem] p-8 text-white shadow-2xl overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-xl flex items-center gap-3 uppercase tracking-tighter">
                  <Activity size={24} className="text-emerald-400" />
                  Cloud Health Check
                </h3>
                <button 
                  onClick={runDiagnostics}
                  disabled={diagStatus === 'testing'}
                  className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/5 transition-all"
                >
                  {diagStatus === 'testing' ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
                  Run Test
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/5 rounded-[1.5rem] p-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Current Status</p>
                  {diagStatus === 'idle' && <p className="text-sm font-bold text-gray-500 italic">No tests run yet.</p>}
                  {diagStatus === 'testing' && <p className="text-sm font-bold text-blue-400 animate-pulse">Establishing handshake...</p>}
                  {diagStatus === 'success' && (
                    <div className="flex items-center gap-3 text-emerald-400 font-black">
                      <CheckCircle size={20} />
                      <span className="uppercase tracking-widest text-sm">Synchronized</span>
                    </div>
                  )}
                  {diagStatus === 'error' && (
                    <div className="flex items-start gap-3 text-red-400 font-black">
                      <AlertCircle size={20} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="uppercase tracking-widest text-sm">Fault Detected</span>
                        <p className="text-[10px] mt-2 font-medium text-red-300 leading-relaxed">{diagError}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white/5 border border-white/5 rounded-[1.5rem] p-6 space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resources</p>
                  <button 
                    onClick={() => setShowCodeModal(true)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all border border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <Code2 size={16} className="text-blue-400" />
                      Get Apps Script Code
                    </div>
                    <Check size={14} className="opacity-40" />
                  </button>
                  <a 
                    href="https://script.google.com/home" 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all border border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-emerald-400" />
                      Open Google Script Dashboard
                    </div>
                    <Check size={14} className="opacity-40" />
                  </a>
                </div>
              </div>
            </div>
            {/* Background Accent */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
          </div>
        </div>

        {/* CONFIG COLUMN */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
                <Globe size={20} className="text-emerald-600" />
                Connectivity
              </h3>
              {saveStatus && <span className="text-[10px] text-emerald-600 font-black animate-pulse">{saveStatus}</span>}
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Apps Script URL</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.scriptUrl}
                  placeholder="https://script.google.com/macros/s/..."
                  onChange={e => setConfig({...config, scriptUrl: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Google Sheet ID</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.sheetId}
                  onChange={e => setConfig({...config, sheetId: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Drive Folder ID</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.folderId}
                  onChange={e => setConfig({...config, folderId: e.target.value})}
                />
              </div>

              <button 
                onClick={handleSaveConfig}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 mt-4"
              >
                <Save size={16} />
                Save & Hot Reload
              </button>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-gray-500 leading-relaxed font-bold uppercase tracking-tight">
                  Updating these will refresh the portal for all users currently logged in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SCRIPT CODE MODAL */}
      {showCodeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Backend Script Code</h3>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Copy this to your Google Apps Script editor</p>
              </div>
              <button onClick={() => setShowCodeModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <RefreshCw size={24} className="rotate-45" />
              </button>
            </div>
            <div className="p-8 bg-gray-900 overflow-hidden relative">
              <button 
                onClick={handleCopyCode}
                className="absolute top-12 right-12 bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-all"
              >
                {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
              </button>
              <pre className="text-[11px] font-mono text-blue-200 overflow-auto max-h-[400px] leading-relaxed custom-scrollbar">
                {scriptCode}
              </pre>
            </div>
            <div className="p-8 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-black">1</div>
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Paste into .gs</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-black">2</div>
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Deploy as Web App</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-black">3</div>
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Access: Anyone</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Add Portal User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="e.g. Sandra Dewi" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department</label>
                <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="e.g. Purchasing" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Username</label>
                  <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                  <input required type="password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none font-black text-[10px] uppercase tracking-widest" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as 'admin' | 'user'})}>
                  <option value="user">User (Standard Access)</option>
                  <option value="admin">Administrator (Full Control)</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 font-black text-[10px] text-gray-400 hover:text-gray-600 uppercase tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
