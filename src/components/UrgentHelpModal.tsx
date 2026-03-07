import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Phone, Calendar as CalendarIcon, X, Heart, CheckCircle, Trash2, Clock, Users, Video } from 'lucide-react';
import { Calendar } from './Calendar';

interface Slot {
  id: number;
  date: string;
  time: string;
  type: string;
  is_booked: number;
}

interface Appointment {
  id: number;
  slot_id: number;
  status: string;
  date: string;
  time: string;
  type: string;
}

export function UrgentHelpModal({ isOpen, onClose, userId }: { isOpen: boolean, onClose: () => void, userId: number }) {
  const [view, setView] = useState<'main' | 'emergency' | 'calm' | 'schedule' | 'my-appointments'>('main');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSlots();
      fetchMyAppointments();
    }
  }, [isOpen]);

  const fetchSlots = async () => {
    try {
      const [slotsRes, sumRes] = await Promise.all([
        fetch('/api/availability'),
        fetch('/api/availability/summary')
      ]);
      setSlots(await slotsRes.json());
      setSummary(await sumRes.json());
    } catch (err) {
      console.error("Error fetching slots:", err);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const fetchMyAppointments = async () => {
    try {
      const res = await fetch(`/api/appointments/${userId}`);
      const data = await res.json();
      setMyAppointments(data);
    } catch (err) {
      console.error("Error fetching my appointments:", err);
    }
  };

  const handleBook = async (slotId: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, slotId })
      });
      if (res.ok) {
        await fetchSlots();
        await fetchMyAppointments();
        setView('my-appointments');
      }
    } catch (err) {
      console.error("Error booking:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId: number, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, userId })
      });
      if (res.ok) {
        fetchSlots();
        fetchMyAppointments();
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1A1A1A] w-full max-w-md rounded-3xl border border-white/10 overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
              <AlertCircle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Ayuda Urgente</h2>
              <p className="text-xs text-white/40">Estamos aquí para apoyarte</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {view === 'main' && (
              <motion.div 
                key="main"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-4"
              >
                <button 
                  onClick={() => setView('emergency')}
                  className="w-full p-4 bg-red-500 hover:bg-red-600 rounded-2xl flex items-center gap-4 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    <Phone size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white uppercase tracking-wider">Peligro Inmediato</p>
                    <p className="text-xs text-white/80">Llamar al 911 ahora mismo</p>
                  </div>
                </button>

                <button 
                  onClick={() => setView('schedule')}
                  className="w-full p-4 bg-amber-500 hover:bg-amber-600 rounded-2xl flex items-center gap-4 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    <Calendar size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white uppercase tracking-wider">Agendar Cita</p>
                    <p className="text-xs text-white/80">Presencial con Arlie Agente de Cambio</p>
                  </div>
                </button>

                <button 
                  onClick={() => setView('my-appointments')}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-4 transition-colors border border-white/10"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white/60">
                    <Clock size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white uppercase tracking-wider">Mis Citas</p>
                    <p className="text-xs text-white/40">Ver y gestionar mis horarios</p>
                  </div>
                </button>
              </motion.div>
            )}

            {view === 'emergency' && (
              <motion.div 
                key="emergency"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mx-auto animate-pulse">
                  <Phone size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Llamando al 911...</h3>
                  <p className="text-sm text-white/60">Si tu vida está en peligro, por favor mantén la calma mientras llega la ayuda.</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <a 
                    href="tel:911"
                    className="w-full py-4 bg-red-500 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                  >
                    <Phone size={18} /> LLAMAR AHORA
                  </a>
                  <button 
                    onClick={() => setView('calm')}
                    className="w-full py-4 bg-white/5 rounded-xl text-white/60 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Heart size={18} /> Opción de Calma
                  </button>
                </div>
                <button onClick={() => setView('main')} className="text-xs text-white/20 hover:text-white/40">Volver</button>
              </motion.div>
            )}

            {view === 'calm' && (
              <motion.div 
                key="calm"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="text-center space-y-6"
              >
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                  <Heart size={48} className="animate-pulse" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">Respira Profundo</h3>
                  <div className="space-y-2 text-sm text-white/60">
                    <p>1. Inhala suavemente por la nariz (4 segundos)</p>
                    <p>2. Mantén el aire (4 segundos)</p>
                    <p>3. Exhala lentamente por la boca (4 segundos)</p>
                  </div>
                </div>
                <button 
                  onClick={() => setView('emergency')}
                  className="w-full py-4 bg-white/5 rounded-xl text-white/60 hover:bg-white/10 transition-colors"
                >
                  Volver a Emergencia
                </button>
              </motion.div>
            )}

            {view === 'schedule' && (
              <motion.div 
                key="schedule"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Selecciona una Fecha</h3>
                  <Calendar 
                    availability={summary} 
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                  />
                </div>

                {selectedDate && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Horarios para el {selectedDate}</h3>
                    <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {slots.filter(s => s.date === selectedDate).length === 0 ? (
                        <p className="text-center py-8 text-white/20 text-sm italic">No hay horarios disponibles para este día.</p>
                      ) : (
                        slots.filter(s => s.date === selectedDate).map((slot) => (
                          <button
                            key={slot.id}
                            disabled={loading}
                            onClick={() => handleBook(slot.id)}
                            className="w-full p-4 bg-white/5 hover:bg-primary/20 rounded-xl border border-white/10 flex justify-between items-center transition-all group"
                          >
                            <div className="text-left">
                              <div className="flex items-center gap-2 mb-1">
                                {slot.type === 'presencial' ? <Users size={12} className="text-white/40" /> : <Video size={12} className="text-white/40" />}
                                <p className="text-[10px] uppercase font-bold text-white/40">{slot.type}</p>
                              </div>
                              <p className="text-white font-bold text-lg">{formatTime(slot.time)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-primary group-hover:text-white transition-colors">
                              <CheckCircle size={20} />
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
                
                <button onClick={() => setView('main')} className="w-full py-2 text-xs text-white/20 hover:text-white/40">Volver</button>
              </motion.div>
            )}

            {view === 'my-appointments' && (
              <motion.div 
                key="my-appointments"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Mis Citas Agendadas</h3>
                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {myAppointments.length === 0 ? (
                    <p className="text-center py-8 text-white/20 text-sm italic">Aún no has agendado ninguna cita.</p>
                  ) : (
                    myAppointments.map((app) => (
                      <div key={app.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {app.type === 'presencial' ? <Users size={10} className="text-white/40" /> : <Video size={10} className="text-white/40" />}
                              <p className="text-[8px] uppercase font-bold text-white/40">{app.type}</p>
                            </div>
                            <p className="text-white font-medium">{app.date}</p>
                            <p className="text-white/40 text-xs">{formatTime(app.time)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold ${
                            app.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-500' :
                            app.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                            'bg-amber-500/20 text-amber-500'
                          }`}>
                            {app.status === 'scheduled' ? 'Agendada' : 
                             app.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          {app.status === 'scheduled' && (
                            <button 
                              onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                              className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 rounded-lg text-xs font-bold transition-colors"
                            >
                              Confirmar
                            </button>
                          )}
                          {app.status !== 'cancelled' && (
                            <button 
                              onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                              className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                            >
                              <Trash2 size={12} /> Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button onClick={() => setView('main')} className="w-full py-2 text-xs text-white/20 hover:text-white/40">Volver</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
