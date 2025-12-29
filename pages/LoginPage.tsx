
import React, { useState } from 'react';
import { User } from '../types';
import { KeyRound, User as UserIcon, ShieldCheck, RefreshCw } from 'lucide-react';
import { getUsers } from '../services/userService';
import { SYSTEM_CONFIG } from '../constants';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getUsers();
    
    const foundUser = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );
    
    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  const handleForceReset = () => {
    if (window.confirm('This will clear all local settings and reset default passwords. Continue?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-blue-50 p-8 text-center border-b border-blue-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 text-white rounded-2xl mb-4 shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <ShieldCheck size={40} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{SYSTEM_CONFIG.PORTAL_NAME}</h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">by {SYSTEM_CONFIG.FULL_COMPANY_NAME}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 animate-shake">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block ml-1">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-12 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block ml-1">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-12 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5"
            >
              Sign In to Portal
            </button>

            <div className="text-center pt-2">
              <button 
                type="button"
                onClick={handleForceReset}
                className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 mx-auto transition-colors"
              >
                <RefreshCw size={12} />
                Login issues? Click to reset application.
              </button>
            </div>
          </form>
          
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-center gap-4 text-xs text-gray-400 font-medium uppercase tracking-wider">
            <span>Secure Access</span>
            <span>•</span>
            <span>Authorized Only</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
