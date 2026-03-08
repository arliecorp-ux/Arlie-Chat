import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import AdminDashboard from './components/admin/AdminDashboard';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'login' | 'register' | 'app'>('login');

  // Lógica de colores unificada con la base de datos
  const getThemeColor = () => {
    if (!user) return '#00D1FF'; // Azul inicial (Login/Registro)
    if (user.role === 'admin') return '#00D1FF'; // Azul para Admin
    
    // IMPORTANTE: Debe coincidir con los valores del servidor ('femenino' / 'masculino')
    if (user.gender === 'femenino' || user.gender === 'mujer') return '#A855F7'; // Morado
    if (user.gender === 'masculino' || user.gender === 'hombre') return '#22C55E'; // Verde
    
    return '#00D1FF'; // Azul por defecto
  };

  const themeColor = getThemeColor();

  const handleLogin = (userData: any) => {
    console.log(">>> Usuario logueado con género:", userData.gender);
    setUser(userData);
    setView('app');
  };

  return (
    <div className="h-screen w-full bg-[#02060C] text-white overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        {view === 'login' && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <Login onLogin={handleLogin} onSwitch={() => setView('register')} />
          </motion.div>
        )}

        {view === 'register' && (
          <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <Register onSwitch={() => setView('login')} />
          </motion.div>
        )}

        {view === 'app' && user && (
          <motion.div key="app" className="flex-1 flex flex-col overflow-hidden h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {user.role === 'admin' ? (
              <AdminDashboard user={user} />
            ) : (
              // Pasamos el themeColor al Chat para que las burbujas y bordes cambien
              <Chat user={user} themeColor={themeColor} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}