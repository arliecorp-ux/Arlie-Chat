import React, { useState, useEffect } from 'react';
import { Key, Users, Loader2 } from 'lucide-react';
import KeyManager from './KeyManager';
import UserRequests from './UserRequests';

export default function AdminDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<'keys' | 'users'>('keys');

  // GUARDIA DE SEGURIDAD: Evita el pantallazo blanco si no hay usuario
  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#02060C] text-white">
        <Loader2 className="animate-spin text-[#00D1FF] mb-4" size={40} />
        <p className="font-black italic text-xs uppercase tracking-widest">Cargando ArlIE Staff...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#02060C]">
      <header className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h2 className="text-xl font-black italic text-[#00D1FF]">ARLIE STAFF</h2>
        <span className="text-[10px] font-bold text-white/40 uppercase">Admin: {user.first_name}</span>
      </header>

      <nav className="flex p-2 gap-2 border-b border-white/10">
        <button onClick={() => setActiveTab('keys')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'keys' ? 'bg-[#00D1FF] text-black' : 'text-white/20'}`}>
          <Key size={16} className="inline mr-2"/> Claves
        </button>
        <button onClick={() => setActiveTab('users')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'users' ? 'bg-[#00D1FF] text-black' : 'text-white/20'}`}>
          <Users size={16} className="inline mr-2"/> Solicitudes
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === 'keys' ? <KeyManager /> : <UserRequests />}
      </main>
    </div>
  );
}