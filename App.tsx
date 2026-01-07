
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
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
import { Loader2, Database, AlertCircle, CloudOff, Settings, ShieldAlert } from 'lucide-react';

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
    } catch (err: any) {
      console.warn("Cloud connection error:", err);
      if (err.message === 'CORS_OR_PERMISSION_DENIED') {
        setSyncError("Google Sync Blocked: Permission or CORS error.");
      } else {
        setSyncError(`Cloud Sync Failure: ${err.message || 'Unknown network error'}`);
      }
      setIsLoading(false);
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
      {syncError && user && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-[#0f172a] text-white px-8 py-5 rounded-[2.5rem] flex items-center gap-6 shadow-2xl border border-white/10 animate-in slide-in-from-bottom-8 duration-500 max-w-[90vw]">
          <div className="flex items-center gap-4">
            <div className="bg-red-500/20 p-3 rounded-2xl text-red-400">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Connection Interrupted</p>
              <p className="text-sm font-black uppercase tracking-tight">{syncError}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5"
            >
              <CloudOff size={14} /> Retry
            </button>
            {user.role === 'admin' && (
              <Link 
                to="/admin" 
                onClick={() => setSyncError(null)}
                className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"
              >
                <Settings size={14} /> Troubleshoot
              </Link>
            )}
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
