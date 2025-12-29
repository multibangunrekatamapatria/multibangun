
import React, { useState, useEffect } from 'react';
import { getUsers, saveUser, deleteUser } from '../services/userService';
import { User } from '../types';
import { UserPlus, Trash2, Shield, Users, Settings, Database, HardDrive } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '', role: 'user' as const, department: '' });

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

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Control Center</h1>
          <p className="text-sm text-gray-500">Manage access and system integrations.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <UserPlus size={18} />
          Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2 font-bold text-gray-900">
            <Users size={20} className="text-blue-600" />
            Portal Users
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400">
              <tr>
                <th className="px-6 py-3">Full Name</th>
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{u.fullName}</div>
                    <div className="text-xs text-gray-400">{u.department}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.username}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${u.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.username !== 'admin' && (
                      <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-600 p-2 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Database size={18} className="text-emerald-600" />
              Integrations
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Google Sheets</span>
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                </div>
                <p className="text-xs text-gray-600">Syncing to: <span className="font-mono text-blue-600">MRP_Database_v1</span></p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Google Drive</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                </div>
                <p className="text-xs text-gray-600">Storage: <span className="font-mono text-blue-600">/MRP/Letters/2025</span></p>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100">
            <Shield size={32} className="mb-4 opacity-50" />
            <h3 className="font-bold text-lg mb-1">Security Audit</h3>
            <p className="text-xs text-indigo-100 mb-4">All generated letter numbers are logged with IP and user timestamps.</p>
            <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all border border-white/20">
              Download Access Logs
            </button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
            <h3 className="text-xl font-bold">Register New Portal User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
                <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Username</label>
                  <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Password</label>
                  <input required type="password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Role</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as 'admin' | 'user'})}>
                  <option value="user">User (Standard Access)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 font-bold text-gray-500">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
