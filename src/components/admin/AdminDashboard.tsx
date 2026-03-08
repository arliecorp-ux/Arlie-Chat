import React, { useState } from 'react';
import { Key, Users, Loader2 } from 'lucide-react';
import KeyManager from './KeyManager';

export default function AdminDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('keys');

  // Si no hay usuario o datos cargando, mostramos loader en lugar de crashear
  if (!user || !user.first_name) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#02060C] text-[#00D1FF]">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Cargando Staff...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#02060C]">
      <header className="p-6 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-xl font-black italic text-[#00D1FF] tracking-tighter">ARLIE STAFF</h2>
        <div className="text-[10px] font-bold text-white/40 uppercase">Admin: {user.first_name}</div>
      </header>
      
      <div className="flex p-2 gap-2 border-b border-white/10">
        <button 
          onClick={() => setActiveTab('keys')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'keys' ? 'bg-[#00D1FF] text-black shadow-[0_0_15px_#00D1FF60]' : 'text-white/20'}`}
        >
          <Key size={16} className="inline mr-2"/> Claves
        </button>
      </div>

      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === 'keys' && <KeyManager />}
      </main>
    </div>
  );
}