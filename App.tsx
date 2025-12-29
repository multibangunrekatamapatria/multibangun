
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('mrp_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
