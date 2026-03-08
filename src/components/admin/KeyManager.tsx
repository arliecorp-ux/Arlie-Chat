import React, { useState, useEffect } from 'react';
import { Key, Clock, AlertTriangle, ShieldCheck, Calendar, MessageCircle } from 'lucide-react';

export default function KeyManager() {
  const [keys, setKeys] = useState<any[]>([]);
  const [filter, setFilter] = useState('activada');

  useEffect(() => {
    const fetchKeys = async () => {
      const res = await fetch(`/api/admin/keys?status=${filter}`);
      const data = await res.json();
      setKeys(data);
    };
    fetchKeys();
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-black text-white italic">Control de Licencias</h3>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Ciclo de vida de 3 meses</p>
        </div>
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
          {['activada', 'expirada', 'todas'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${filter === f ? 'bg-[#00D1FF] text-black' : 'text-white/40'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {keys.map((k) => (
          <div key={k.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
            {/* Indicador visual de tiempo restante */}
            <div 
              className="absolute bottom-0 left-0 h-1 transition-all duration-1000" 
              style={{ 
                width: `${(k.daysLeft / 90) * 100}%`, 
                backgroundColor: k.daysLeft <= 15 ? '#EF4444' : '#00D1FF' 
              }} 
            />

            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-black text-[#00D1FF] tracking-tighter uppercase">Clave ArlIE</span>
                <h4 className="text-lg font-black text-white tracking-widest">{k.id}</h4>
                <p className="text-[10px] text-white/40 font-bold">{k.assigned_to}</p>
              </div>
              
              <div className="text-right">
                <div className={`flex items-center gap-1 font-black text-sm ${k.daysLeft <= 15 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  <Clock size={14} />
                  {k.daysLeft} DÍAS
                </div>
                <p className="text-[9px] text-white/20 uppercase font-bold">Restantes</p>
              </div>
            </div>

            {/* Muestra el mensaje de advertencia que el sistema envió */}
            {k.systemNote && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-3 mb-2">
                <AlertTriangle size={16} className="text-red-500 shrink-0" />
                <p className="text-[10px] text-red-200 font-bold leading-tight">
                  <span className="block text-red-500 uppercase tracking-tighter">Mensaje de Sistema:</span>
                  "{k.systemNote}"
                </p>
              </div>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
              <span className="text-[9px] text-white/20 font-bold uppercase italic">Activada: {new Date(k.activated_at).toLocaleDateString()}</span>
              <button className="flex items-center gap-2 text-[10px] font-black text-[#00D1FF] hover:scale-105 transition-all">
                RENOVAR LICENCIA <Calendar size={12}/>
              </button>
            </div>
          </div>
        ))}

        {keys.length === 0 && (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-white/20 font-bold uppercase tracking-widest text-xs">No hay claves en este estatus</p>
          </div>
        )}
      </div>
    </div>
  );
}