import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, MoreVertical, 
  CheckCircle, XCircle, Clock, Mail, Phone, 
  ChevronRight, UserCheck, MessageSquare
} from 'lucide-react';

export default function UserRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState('pendiente');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/admin/users?status=${filter}`);
      const data = await res.json();
      setRequests(data);
    } catch (e) {
      console.error("Error cargando solicitudes");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return 'text-yellow-400 bg-yellow-400/10';
      case 'activada': return 'text-green-400 bg-green-400/10';
      case 'expirada': return 'text-red-400 bg-red-400/10';
      default: return 'text-white/40 bg-white/5';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-white italic">Solicitudes de Acceso</h3>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Gestión de nuevos ingresos ArlIE</p>
        </div>

        {/* BUSCADOR RÁPIDO */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:border-[#00D1FF] outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* FILTROS POR ESTATUS */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit">
        {['pendiente', 'activada', 'expirada', 'todos'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${filter === s ? 'bg-[#00D1FF] text-black shadow-lg shadow-[#00D1FF]/20' : 'text-white/40 hover:text-white'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* LISTA DE SOLICITUDES */}
      <div className="grid grid-cols-1 gap-3">
        {requests
          .filter(r => r.first_name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((req) => (
          <div 
            key={req.email}
            onClick={() => setSelectedUser(req)}
            className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${req.gender === 'mujer' ? 'bg-purple-500/20 text-purple-500' : 'bg-[#2EDBA7]/20 text-[#2EDBA7]'}`}>
                {req.first_name[0]}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{req.first_name} {req.last_name}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-white/40 flex items-center gap-1"><Mail size={10}/> {req.email}</span>
                  <span className="text-[10px] text-white/40 flex items-center gap-1"><Phone size={10}/> {req.phone}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStatusColor(req.status)}`}>
                {req.status}
              </div>
              <ChevronRight className="text-white/10 group-hover:text-[#00D1FF] transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE DETALLE / ACCIÓN */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#0A192F] border border-white/10 w-full max-w-lg rounded-3xl p-8 space-y-6 relative animate-in zoom-in duration-300">
            <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 text-white/20 hover:text-white"><XCircle /></button>
            
            <div className="text-center">
              <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black mb-4 ${selectedUser.gender === 'mujer' ? 'bg-purple-500/20 text-purple-500 shadow-[0_0_30px_#A855F730]' : 'bg-[#2EDBA7]/20 text-[#2EDBA7] shadow-[0_0_30px_#2EDBA730]'}`}>
                {selectedUser.first_name[0]}
              </div>
              <h3 className="text-2xl font-black text-white italic">{selectedUser.first_name} {selectedUser.last_name}</h3>
              <p className="text-[#00D1FF] text-[10px] font-bold uppercase tracking-widest">@{selectedUser.username}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div>
                <p className="text-[9px] text-white/20 font-bold uppercase">WhatsApp</p>
                <p className="text-sm font-bold text-white">{selectedUser.phone}</p>
              </div>
              <div>
                <p className="text-[9px] text-white/20 font-bold uppercase">Fecha Registro</p>
                <p className="text-sm font-bold text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-[10px] text-white/40 text-center font-bold uppercase tracking-widest">Acciones Disponibles</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  className="bg-[#00D1FF] text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                  onClick={() => {/* Aquí conectaremos con la generación de clave */}}
                >
                  <UserCheck size={18}/> ASIGNAR CLAVE
                </button>
                <button className="bg-white/5 text-white/60 font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20 hover:text-red-400 transition-all">
                  <XCircle size={18}/> RECHAZAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}