
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
  Info
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
      window.location.reload();
    }, 1500);
  };

  const runDiagnostics = async () => {
    setDiagStatus('testing');
    setDiagError(null);
    try {
      const ok = await pingCloud();
      if (ok) {
        setDiagStatus('success');
      } else {
        throw new Error("Pinging script returned no response.");
      }
    } catch (err: any) {
      setDiagStatus('error');
      setDiagError("Connection Blocked. This is usually due to missing authorization in Google Apps Script. Ensure you clicked 'Authorize Access' after Deploying.");
    }
  };

  const scriptCode = `/**
 * PT MRP - GOOGLE APPS SCRIPT MASTER (v2.0)
 * 
 * 1. Create a Google Sheet, copy its ID from the URL.
 * 2. Extensions -> Apps Script.
 * 3. Paste this code and SAVE.
 * 4. Deploy -> New Deployment.
 * 5. Type: 'Web App'.
 * 6. EXECUTE AS: 'Me' (Your email).
 * 7. WHO HAS ACCESS: 'Anyone'.
 * 8. !!! IMPORTANT !!! After clicking Deploy, click 'Authorize Access'.
 *    Choose your account -> Advanced -> Go to PT MRP (unsafe).
 */

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'ping') {
    return ContentService.createTextOutput("pong").setMimeType(ContentService.MimeType.TEXT);
  }

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
  try {
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
    
    // Additional actions (delete/update) can be added here
    
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
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
          <p className="text-sm text-gray-500 font-medium">Manage security and cloud infrastructure.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg"
        >
          <UserPlus size={18} />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* USER TABLE */}
          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center gap-3 font-black text-gray-900 uppercase tracking-tight">
              <Users size={24} className="text-blue-600" />
              Portal Access
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Full Name</th>
                    <th className="px-8 py-4">ID</th>
                    <th className="px-8 py-4">Role</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="text-sm font-black text-gray-900">{u.fullName}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">{u.department}</div>
                      </td>
                      <td className="px-8 py-5 font-mono text-xs">{u.username}</td>
                      <td className="px-8 py-5">
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {u.username !== 'admin' && (
                          <button onClick={() => handleDelete(u.id)} className="text-gray-300 hover:text-red-600 p-2">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DIAGNOSTICS */}
          <div className="bg-[#0f172a] rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xl flex items-center gap-3 uppercase tracking-tighter">
                  <Activity size={24} className="text-emerald-400" />
                  Cloud Diagnostics
                </h3>
                <button 
                  onClick={runDiagnostics}
                  disabled={diagStatus === 'testing'}
                  className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/5 transition-all"
                >
                  {diagStatus === 'testing' ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
                  Test Script Connection
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/5 rounded-[1.5rem] p-8">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Handshake Status</p>
                  {diagStatus === 'idle' && <p className="text-sm text-gray-500 italic">Ready to test...</p>}
                  {diagStatus === 'testing' && <p className="text-sm text-blue-400 animate-pulse font-bold">Pinging Apps Script...</p>}
                  {diagStatus === 'success' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-emerald-400 font-black">
                        <CheckCircle size={24} />
                        <span className="uppercase tracking-widest text-lg">Connected</span>
                      </div>
                      <p className="text-xs text-gray-400">Your browser successfully communicated with the Google Sheet backend.</p>
                    </div>
                  )}
                  {diagStatus === 'error' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-red-400 font-black">
                        <AlertCircle size={24} />
                        <span className="uppercase tracking-widest text-lg">Blocked</span>
                      </div>
                      <p className="text-[11px] text-red-200 leading-relaxed font-medium bg-red-500/10 p-4 rounded-xl border border-red-500/20">{diagError}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-blue-500/10 border border-blue-500/10 rounded-[1.5rem] flex items-start gap-4">
                    <Info size={24} className="text-blue-400 shrink-0" />
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Authorization Tip</p>
                      <p className="text-[11px] text-blue-100/70 leading-relaxed">
                        If tests fail, open your Google Apps Script, click **Deploy** again, choose **Edit Deployment**, and make sure you clicked "Authorize Access" in the popup.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowCodeModal(true)}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-5 text-sm font-bold flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Code2 size={20} className="text-blue-400" />
                      View Backend Script
                    </div>
                    <Check size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONFIG */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-200 shadow-sm h-fit sticky top-8">
          <h3 className="font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight mb-8">
            <Globe size={24} className="text-blue-600" />
            Infrastructure
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Web App URL</label>
              <input 
                type="text" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                value={config.scriptUrl}
                placeholder="https://script.google.com/macros/s/.../exec"
                onChange={e => setConfig({...config, scriptUrl: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sheet ID</label>
              <input 
                type="text" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                value={config.sheetId}
                onChange={e => setConfig({...config, sheetId: e.target.value})}
              />
            </div>

            <button 
              onClick={handleSaveConfig}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 mt-4"
            >
              <Save size={18} />
              Update Infrastructure
            </button>
            
            {saveStatus && <p className="text-center text-[10px] font-black text-emerald-600 uppercase tracking-widest animate-pulse">{saveStatus}</p>}
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
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Copy this exactly into your .gs file</p>
              </div>
              <button onClick={() => setShowCodeModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <RefreshCw size={24} className="rotate-45" />
              </button>
            </div>
            <div className="p-8 bg-gray-900 relative">
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
            <div className="p-8 bg-gray-50 border-t border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Correct Deployment Settings</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Type</p>
                  <p className="text-[10px] font-black text-blue-600 uppercase">Web App</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-200 text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Execute As</p>
                  <p className="text-[10px] font-black text-blue-600 uppercase">Me</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-200 text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Access</p>
                  <p className="text-[10px] font-black text-blue-600 uppercase">Anyone</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">New User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="Full Name" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
              <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="Department" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="Username" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                <input required type="password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none font-black text-[10px] uppercase tracking-widest" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as 'admin' | 'user'})}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 font-black text-[10px] text-gray-400 uppercase">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
