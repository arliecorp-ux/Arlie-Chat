import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import AdminDashboard from './components/admin/AdminDashboard';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'login' | 'register' | 'app'>('login');

  // Lógica de colores según género
  const getThemeColor = () => {
    if (!user) return '#00D1FF';
    if (user.role === 'admin') return '#00D1FF';
    return user.gender === 'mujer' ? '#A855F7' : '#2EDBA7';
  };

  const themeColor = getThemeColor();

  const handleLogin = (userData: any) => {
    setUser(userData);
    setView('app');
  };

  return (
    <div className="h-screen w-full bg-[#02060C] text-white overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        {view === 'login' && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Login onLogin={handleLogin} onSwitch={() => setView('register')} />
          </motion.div>
        )}

        {view === 'register' && (
          <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Register onSwitch={() => setView('login')} />
          </motion.div>
        )}

        {view === 'app' && user && (
          <motion.div key="app" className="flex-1 flex flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {user.role === 'admin' ? (
              <AdminDashboard user={user} />
            ) : (
              <Chat user={user} themeColor={themeColor} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}