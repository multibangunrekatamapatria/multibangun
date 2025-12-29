
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
import { Loader2, CloudOff } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      // 1. Check local session
      const savedUser = localStorage.getItem('mrp_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      // 2. Hydrate from Cloud (Critical for sequence numbering)
      try {
        const cloudData = await fetchLettersFromGoogle();
        if (cloudData && cloudData.length > 0) {
          setLetters(cloudData);
        }
      } catch (err) {
        console.error("Initial sync failed", err);
        setSyncError(true);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
        <div className="relative">
          <Loader2 size={48} className="animate-spin text-blue-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
          </div>
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900 tracking-tight uppercase">Multiportal</p>
          <p className="text-xs text-gray-400 font-medium">Syncing with Google Master Sheet...</p>
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
