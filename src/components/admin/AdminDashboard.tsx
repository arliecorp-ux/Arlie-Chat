import React, { useState } from 'react';
import { BarChart3, Key, Users, Bell } from 'lucide-react';
import KeyManager from './KeyManager';
import UserRequests from './UserRequests';

export default function AdminDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('keys');

  return (
    <div className="flex flex-col h-full bg-[#02060C]">
      <header className="p-6 border-b border-white/10 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black italic text-[#00D1FF]">Panel ArlIE Staff</h2>
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Bienvenido, {user?.first_name || 'Admin'}</p>
        </div>
        <div className="bg-[#00D1FF]/10 text-[#00D1FF] px-3 py-1 rounded-full text-[10px] font-black uppercase">
          Administrador
        </div>
      </header>

      <nav className="flex bg-white/5 p-2 gap-2 border-b border-white/10 overflow-x-auto">
        <button onClick={() => setActiveTab('keys')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === 'keys' ? 'bg-[#00D1FF] text-black font-bold' : 'text-white/40'}`}>
          <Key size={18} /> <span className="text-[10px] uppercase">Claves</span>
        </button>
        <button onClick={() => setActiveTab('users')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-[#00D1FF] text-black font-bold' : 'text-white/40'}`}>
          <Users size={18} /> <span className="text-[10px] uppercase">Solicitudes</span>
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === 'keys' && <KeyManager />}
        {activeTab === 'users' && <UserRequests />}
      </main>
    </div>
  );
}