
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import LetterArchive from './pages/LetterArchive';
import POManagement from './pages/POManagement';
import TugasRequest from './pages/TugasRequest';
import PPUManagement from './pages/PPUManagement';
import AdminPanel from './pages/AdminPanel';
import Layout from './components/Layout';
import { User } from './types';
import { fetchLettersFromGoogle } from './services/googleService';
import { setLetters } from './services/dbService';
import { Loader2, Database, AlertCircle, CloudOff, HelpCircle, ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const initApp = async () => {
    setIsLoading(true);
    setSyncError(null);
    
    const savedUser = localStorage.getItem('mrp_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    try {
      const cloudData = await fetchLettersFromGoogle();
      if (cloudData && Array.isArray(cloudData)) {
        setLetters(cloudData);
      }
      setIsLoading(false);
    } catch (err) {
      console.warn("Cloud connection error:", err);
      // Detailed diagnostics for "Failed to fetch"
      setSyncError("Cloud Sync Failure: Connection to Google Master Sheet was blocked.");
      setTimeout(() => setIsLoading(false), 1500);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
    localStorage.setItem('mrp_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mrp_user');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center gap-8 text-center">
          <div className="relative">
            <Loader2 size={64} className="animate-spin text-blue-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Database size={24} className="text-blue-200" />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="font-black text-gray-900 text-2xl tracking-tighter uppercase">Initializing Portal</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] leading-relaxed">Connecting to PT MRP Central Cloud Database...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      {syncError && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-6 py-6 flex flex-col md:flex-row items-center justify-center gap-6 shadow-2xl animate-in slide-in-from-top duration-700">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <ShieldAlert size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Critical Connection Fault</p>
              <p className="text-base font-black uppercase tracking-tight">Sync Failure: Google Apps Script returned 'Failed to fetch'.</p>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">Check Deployment -> "Who has access" must be set to "Anyone"</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="bg-white text-red-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"
            >
              <CloudOff size={16} /> Retry Connection
            </button>
            <a 
              href="https://script.google.com" 
              target="_blank" 
              rel="noreferrer"
              className="bg-red-800 hover:bg-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-red-400/30"
            >
              <HelpCircle size={16} /> Verify Deployment
            </a>
          </div>
        </div>
      )}
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/" 
          element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Dashboard />} />
          <Route path="letters" element={<LetterArchive />} />
          <Route path="po" element={<POManagement />} />
          <Route path="tugas" element={<TugasRequest />} />
          <Route path="ppu" element={<PPUManagement />} />
          {user?.role === 'admin' && <Route path="admin" element={<AdminPanel />} />}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
