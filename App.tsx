
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
import { Loader2, CloudOff, Database } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<'syncing' | 'online' | 'error'>('syncing');

  useEffect(() => {
    const initApp = async () => {
      // 1. Check local session
      const savedUser = localStorage.getItem('mrp_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      // 2. Hydrate from Cloud (Critical for sequence numbering in Incognito)
      try {
        const cloudData = await fetchLettersFromGoogle();
        if (cloudData && cloudData.length > 0) {
          setLetters(cloudData);
          setCloudStatus('online');
        } else {
          // If fetched but empty, might be a new sheet
          setCloudStatus('online');
        }
      } catch (err) {
        console.error("Initial cloud sync failed", err);
        setCloudStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

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
        <div className="w-full max-w-sm bg-white p-10 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center gap-6">
          <div className="relative">
            <Loader2 size={48} className="animate-spin text-blue-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Database size={18} className="text-blue-200" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="font-black text-gray-900 text-xl tracking-tight uppercase">Multiportal Sync</h2>
            <p className="text-sm text-gray-500 font-medium">Downloading latest sequence from Master Sheet...</p>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full w-2/3 animate-[progress_2s_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
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
