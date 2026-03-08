import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminDashboard({ user }: { user: any }) {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/keys')
      .then(res => res.json())
      .then(data => {
        setKeys(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // SEGURIDAD: Evita el pantallazo negro si no hay datos todavía
  if (loading || !user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#02060C] text-[#00D1FF]">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-black text-xs uppercase tracking-widest">Cargando Staff...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#02060C] min-h-screen text-white">
      <h1 className="text-2xl font-black italic mb-6">PANEL DE CONTROL ARLIE</h1>
      <div className="grid gap-4">
        {keys.length > 0 ? (
          keys.map((key) => (
            <div key={key.id} className="p-4 border border-white/10 rounded-2xl bg-white/5">
              <p className="text-[10px] uppercase font-bold text-white/40">Clave ID: {key.id}</p>
              <p className="text-sm font-bold">{key.value}</p>
            </div>
          ))
        ) : (
          <p className="opacity-40">No hay claves registradas.</p>
        )}
      </div>
    </div>
  );
}