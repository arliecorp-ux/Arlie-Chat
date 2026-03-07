import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, User as UserIcon, Calendar as CalendarIcon, 
  Heart, Shield, LogOut, Menu, X, Settings
} from 'lucide-react';
import { User as UserType } from './types';

// Components
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import AdminDashboard from './components/AdminDashboard';
import CalmZone from './components/CalmZone';
import Goals from './components/Goals';
import Diary from './components/Diary';

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'chat' | 'admin' | 'calm' | 'goals' | 'diary'>('login');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Efecto para verificar si hay sesión (Opcional)
  useEffect(() => {
    if (user?.email === 'admin@arlie.com') { // Ajusta según tu correo de admin
       // setView('admin'); 
    }
  }, [user]);

  if (!user) {
    return view === 'login' ? 
      <Login onLogin={setUser} onSwitch={() => setView('register')} /> : 
      <Register onRegister={() => setView('login')} onSwitch={() => setView('login')} />;
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      {/* HEADER */}
      <header className="p-4 flex justify-between items-center border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-black font-bold">A</div>
          <span className="font-bold tracking-tighter text-xl">ArlIE</span>
        </div>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
          <Menu className="w-6 h-6 text-primary" />
        </button>
      </header>

      {/* MAIN VIEW */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {view === 'chat' && <Chat user={user} />}
          {view === 'admin' && <AdminDashboard user={user} />}
          {view === 'calm' && <CalmZone />}
          {view === 'goals' && <Goals user={user} />}
          {view === 'diary' && <Diary user={user} />}
        </AnimatePresence>
      </main>

      {/* NAVIGATION BAR (Botones inferiores que no saldrán negros) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-2 flex justify-around items-center z-50">
        <NavButton active={view === 'chat'} icon={<MessageSquare />} label="Chat" onClick={() => setView('chat')} />
        <NavButton active={view === 'calm'} icon={<Heart />} label="Calma" onClick={() => setView('calm')} />
        <NavButton active={view === 'goals'} icon={<Shield />} label="Metas" onClick={() => setView('goals')} />
        <NavButton active={view === 'admin' && user.email?.includes('admin')} icon={<Settings />} label="Admin" onClick={() => setView('admin')} />
      </nav>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 transition-all ${active ? 'text-primary' : 'text-white/40'}`}>
      {React.cloneElement(icon, { className: 'w-6 h-6' })}
      <span className="text-[10px] uppercase font-bold">{label}</span>
    </button>
  );
}