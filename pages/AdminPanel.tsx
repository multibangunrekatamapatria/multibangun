
import React, { useState, useEffect } from 'react';
import { getUsers, saveUser, deleteUser } from '../services/userService';
import { User } from '../types';
import { UserPlus, Trash2, Shield, Users, Database, Globe, Save, ExternalLink, CheckCircle } from 'lucide-react';
import { SYSTEM_CONFIG } from '../constants';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
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
    setSaveStatus('Settings updated globally!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const isDefault = (key: keyof typeof SYSTEM_CONFIG.GOOGLE) => {
    const val = localStorage.getItem(`mrp_google_${key.toLowerCase() === 'scripturl' ? 'script_url' : key.toLowerCase().includes('sheet') ? 'sheet_id' : 'folder_id'}`);
    return !val || val === SYSTEM_CONFIG.GOOGLE[key];
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Control Center</h1>
          <p className="text-sm text-gray-500">Manage portal users and company-wide integrations.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <UserPlus size={18} />
          Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2 font-bold text-gray-900">
              <Users size={20} className="text-blue-600" />
              User Access Management
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Login Details</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{u.fullName}</div>
                        <div className="text-xs text-gray-400">{u.department || 'No Dept Set'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600 font-mono">User: {u.username}</div>
                        <div className="text-xs text-gray-400 font-mono">Pass: ****</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${u.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.username !== 'admin' ? (
                          <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-600 p-2 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <Shield size={16} className="text-gray-300 ml-auto mr-2" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Globe size={18} className="text-emerald-600" />
                Google Integration
              </h3>
              {saveStatus && <span className="text-[10px] text-emerald-600 font-bold animate-pulse">{saveStatus}</span>}
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Google Apps Script URL</label>
                  {isDefault('SCRIPT_URL') && <span className="text-[8px] font-bold text-blue-500 uppercase">System Active</span>}
                </div>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.scriptUrl}
                  onChange={e => setConfig({...config, scriptUrl: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Master Sheet ID</label>
                  {isDefault('SHEET_ID') && <span className="text-[8px] font-bold text-blue-500 uppercase">System Active</span>}
                </div>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.sheetId}
                  onChange={e => setConfig({...config, sheetId: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Archive Folder ID</label>
                  {isDefault('FOLDER_ID') && <span className="text-[8px] font-bold text-blue-500 uppercase">System Active</span>}
                </div>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.folderId}
                  onChange={e => setConfig({...config, folderId: e.target.value})}
                />
              </div>

              <button 
                onClick={handleSaveConfig}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all"
              >
                <Save size={16} />
                Update Connection
              </button>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
                  <strong>Status:</strong> All users are currently using the default company IDs provided by the Admin. Data sync is active.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-100">
            <Database size={32} className="mb-4 opacity-50" />
            <h3 className="font-bold text-lg mb-1">Central Sync</h3>
            <p className="text-xs text-blue-100 mb-4">Letter numbering and file archiving are synchronized with your company's Google Workspace.</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-blue-200">
                <span>Connectivity</span>
                <span className="text-emerald-400">Stable</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1">
                <div className="bg-emerald-400 h-1 rounded-full w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900">Add Portal User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Sandra Dewi" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Department</label>
                <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Purchasing" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
                  <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                  <input required type="password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as 'admin' | 'user'})}>
                  <option value="user">User (Standard Access)</option>
                  <option value="admin">Administrator (Full Control)</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 font-bold text-gray-400 hover:text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
