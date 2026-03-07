import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Key, AlertCircle, Calendar as CalendarIcon, RefreshCw, Check, X, Send, Mail, MessageCircle, History, Copy, ExternalLink, ShieldCheck, Clock, UserCheck, UserPlus, UserMinus, Plus, Phone, Video } from 'lucide-react';
import { User } from '../types';
import { Calendar } from './Calendar';

interface AdminUser extends User {
  key_value?: string;
  key_status?: string;
  expires_at?: string;
  key_id?: number;
}

interface AdminDashboardProps {
  user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'alerts' | 'agenda'>('users');
  const [userSubTab, setUserSubTab] = useState<'pending' | 'assigned' | 'active' | 'expired'>('pending');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [historyUser, setHistoryUser] = useState<AdminUser | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);

  const [slots, setSlots] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [newSlotType, setNewSlotType] = useState<'presencial' | 'llamada'>('presencial');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [uRes, aRes, appRes, sRes, sumRes] = await Promise.all([
        fetch('/api/admin/users-detailed'),
        fetch('/api/admin/alerts'),
        fetch('/api/admin/appointments-detailed'),
        fetch('/api/admin/availability-all'),
        fetch('/api/availability/summary')
      ]);
      
      if (uRes.ok) setUsers(await uRes.json());
      if (aRes.ok) setAlerts(await aRes.json());
      if (appRes.ok) setAppointments(await appRes.json());
      if (sRes.ok) setSlots(await sRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
      
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addSlot = async () => {
    if (!newSlotDate || !newSlotTime) return;
    try {
      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminId: user.id, 
          date: newSlotDate, 
          time: newSlotTime,
          type: newSlotType 
        })
      });
      if (res.ok) {
        setNewSlotTime('');
        fetchData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error("Error adding slot:", error);
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

  const deleteSlot = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/availability/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      console.error("Error deleting slot:", error);
    }
  };

  const fetchUserHistory = async (user: AdminUser) => {
    try {
      const res = await fetch(`/api/admin/user-history/${user.id}`);
      if (res.ok) {
        setHistoryData(await res.json());
        setHistoryUser(user);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const assignKey = async (userId: number) => {
    setIsAssigning(true);
    const keyValue = `ARLIE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    console.log(`Intentando asignar clave ${keyValue} al usuario ${userId}`);
    
    try {
      const res = await fetch('/api/admin/assign-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, keyValue })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log("Clave asignada con éxito:", data);
        setGeneratedKey(keyValue);
        await fetchData(); // Recargar datos para que se refleje en la tabla
      } else {
        throw new Error(data.error || "Error desconocido");
      }
    } catch (error: any) {
      console.error("Error en assignKey:", error);
      alert(`Error al asignar clave: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  const getEmotiveMessage = (name: string, key: string) => {
    return `¡Hola ${name}! ✨ Es un gusto saludarte. Soy ArlIE, tu acompañante en este viaje hacia el bienestar emocional. 🌿 Tu clave de acceso exclusiva ha sido generada: *${key}*. Estamos listos para comenzar a sanar juntos. Úsala para activar tu cuenta ahora mismo. ¡Te esperamos con los brazos abiertos! 🤍`;
  };

  const sendWhatsApp = (user: AdminUser, key: string) => {
    const message = encodeURIComponent(getEmotiveMessage(user.first_name, key));
    window.open(`https://wa.me/${user.phone}?text=${message}`, '_blank');
    if (user.key_id) updateKeyStatus(user.key_id, 'sent_whatsapp');
  };

  const sendEmail = (user: AdminUser, key: string) => {
    const subject = encodeURIComponent("Tu Clave de Acceso ArlIE Chat");
    const body = encodeURIComponent(getEmotiveMessage(user.first_name, key));
    window.open(`mailto:${user.email}?subject=${subject}&body=${body}`, '_blank');
    if (user.key_id) updateKeyStatus(user.key_id, 'sent_email');
  };

  const updateKeyStatus = async (keyId: number, status: string) => {
    await fetch('/api/admin/update-key-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyId, status })
    });
    fetchData();
  };

  const resolveAlert = async (alertId: number) => {
    try {
      const res = await fetch('/api/admin/resolve-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  };

  const filteredUsers = users.filter(u => {
    if (userSubTab === 'pending') return u.status === 'inactive' && !u.key_value;
    if (userSubTab === 'assigned') return u.status === 'inactive' && u.key_value;
    if (userSubTab === 'active') return u.status === 'active';
    if (userSubTab === 'expired') {
      if (!u.expires_at) return false;
      return new Date(u.expires_at) < new Date();
    }
    return true;
  });

  const counts = {
    pending: users.filter(u => u.status === 'inactive' && !u.key_value).length,
    assigned: users.filter(u => u.status === 'inactive' && u.key_value).length,
    active: users.filter(u => u.status === 'active').length,
    expired: users.filter(u => u.expires_at && new Date(u.expires_at) < new Date()).length
  };

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Panel de Administración</h2>
          <p className="text-white/40">Gestión de Claves y Usuarios</p>
        </div>
        <div className="flex items-center gap-4">
          {isLoading && <RefreshCw className="animate-spin text-primary" size={20} />}
          <button 
            onClick={fetchData} 
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            title="Actualizar Datos"
          >
            <RefreshCw size={20} className={isLoading ? 'opacity-20' : ''} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/10">
        <TabButton active={activeTab === 'users'} label="Gestión de Usuarios" icon={<Users size={18} />} onClick={() => setActiveTab('users')} />
        <TabButton active={activeTab === 'alerts'} label="Alertas SIAT" icon={<AlertCircle size={18} />} onClick={() => setActiveTab('alerts')} count={alerts.length} />
        <TabButton active={activeTab === 'agenda'} label="Agenda" icon={<Calendar size={18} />} onClick={() => setActiveTab('agenda')} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 bg-white/5 p-1 rounded-xl w-fit">
              <SubTabButton active={userSubTab === 'pending'} label="Registrados" count={counts.pending} onClick={() => setUserSubTab('pending')} icon={<UserPlus size={14} />} />
              <SubTabButton active={userSubTab === 'assigned'} label="Clave Asignada" count={counts.assigned} onClick={() => setUserSubTab('assigned')} icon={<Key size={14} />} />
              <SubTabButton active={userSubTab === 'active'} label="Activos" count={counts.active} onClick={() => setUserSubTab('active')} icon={<UserCheck size={14} />} />
              <SubTabButton active={userSubTab === 'expired'} label="Vencidos" count={counts.expired} onClick={() => setUserSubTab('expired')} icon={<UserMinus size={14} />} />
            </div>

            <div className="glass-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="p-3">Usuario</th>
                    <th className="p-3">Contacto</th>
                    <th className="p-3">Estado Clave</th>
                    <th className="p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <div className="font-bold">{u.first_name} {u.last_name}</div>
                        <div className="text-[10px] text-white/40">@{u.username}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-white/60">
                            <Mail size={10} /> {u.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-white/60">
                            <MessageCircle size={10} /> {u.phone}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                            <Calendar size={10} /> {u.birthdate}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {u.key_value ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-mono">{u.key_value}</code>
                              <button onClick={() => {
                                navigator.clipboard.writeText(u.key_value!);
                                alert("Clave copiada");
                              }} className="text-white/20 hover:text-white"><Copy size={12} /></button>
                            </div>
                            <div className="text-[10px] text-white/40 flex items-center gap-1">
                              <Clock size={10} /> {u.key_status}
                            </div>
                          </div>
                        ) : (
                          <span className="text-white/20 italic text-xs">Sin clave</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {!u.key_value ? (
                            <button 
                              onClick={() => {
                                setSelectedUser(u);
                                setGeneratedKey(null);
                              }}
                              className="btn-primary py-1 px-3 text-[10px] uppercase tracking-wider"
                            >
                              Asignar
                            </button>
                          ) : (
                            <>
                              <button 
                                onClick={() => sendWhatsApp(u, u.key_value!)}
                                className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors"
                                title="Enviar por WhatsApp"
                              >
                                <MessageCircle size={14} />
                              </button>
                              <button 
                                onClick={() => sendEmail(u, u.key_value!)}
                                className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors"
                                title="Enviar por Correo"
                              >
                                <Mail size={14} />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => fetchUserHistory(u)}
                            className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                            title="Ver Historial"
                          >
                            <History size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-white/20 italic">
                        No hay usuarios en esta categoría.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {alerts.map((alert, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`glass-card p-6 border-l-4 ${
                  alert.risk_level === 'high' ? 'border-red-500' : 'border-yellow-500'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <AlertCircle className={alert.risk_level === 'high' ? 'text-red-500' : 'text-yellow-500'} />
                    </div>
                    <div>
                      <h4 className="font-bold">{alert.first_name} {alert.last_name}</h4>
                      <p className="text-xs text-white/40">{new Date(alert.timestamp).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    alert.risk_level === 'high' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    Riesgo {alert.risk_level}
                  </span>
                </div>
                <p className="text-sm bg-black/20 p-4 rounded-xl italic text-white/80">"{alert.message}"</p>
                <div className="mt-4 flex gap-3">
                  <button onClick={() => fetchUserHistory({id: alert.user_id, first_name: alert.first_name} as any)} className="btn-primary py-2 text-xs">Ver Historial</button>
                  <button onClick={() => resolveAlert(alert.id)} className="px-4 py-2 bg-white/5 rounded-xl text-xs hover:bg-white/10">Marcar como Atendido</button>
                </div>
              </motion.div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-20 text-white/20">
                <Check size={48} className="mx-auto mb-4 opacity-20" />
                <p>No hay alertas activas en este momento.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Side: Calendar */}
              <div className="lg:col-span-4 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <CalendarIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Calendario</h3>
                    <p className="text-xs text-white/40">Vista mensual de disponibilidad</p>
                  </div>
                </div>
                <Calendar 
                  availability={summary} 
                  selectedDate={newSlotDate}
                  onDateSelect={setNewSlotDate}
                />
              </div>

              {/* Right Side: Slot Management */}
              <div className="lg:col-span-8 space-y-6">
                <div className="glass-card p-6 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Gestionar Disponibilidad</h3>
                      <p className="text-xs text-white/40">Define los espacios para el {newSlotDate || 'día seleccionado'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 items-end bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex-1 min-w-[150px] space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Hora</label>
                      <input 
                        type="time" 
                        value={newSlotTime}
                        onChange={(e) => setNewSlotTime(e.target.value)}
                        className="input-field w-full" 
                      />
                    </div>
                    <div className="flex-1 min-w-[150px] space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Tipo</label>
                      <select 
                        value={newSlotType}
                        onChange={(e) => setNewSlotType(e.target.value as any)}
                        className="input-field w-full"
                      >
                        <option value="presencial">Presencial</option>
                        <option value="llamada">Llamada</option>
                      </select>
                    </div>
                    <button 
                      onClick={addSlot}
                      disabled={!newSlotDate}
                      className="btn-primary py-3 px-8 text-xs font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} /> Agregar Espacio
                    </button>
                  </div>

                  {!newSlotDate && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs flex items-center gap-2">
                      <AlertCircle size={14} />
                      Selecciona un día en el calendario para agregar espacios.
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {slots.filter(s => !newSlotDate || s.date === newSlotDate).map(slot => (
                      <div 
                        key={slot.id} 
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 relative group transition-all ${
                          slot.is_booked ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {slot.type === 'presencial' ? <Users size={10} className="text-white/40" /> : <Video size={10} className="text-white/40" />}
                          <p className="text-[8px] uppercase font-bold text-white/40">{slot.type}</p>
                        </div>
                        <p className="text-xs font-mono text-primary font-bold">{formatTime(slot.time)}</p>
                        <p className="text-[9px] text-white/40">{slot.date}</p>
                        {slot.is_booked ? (
                          <span className="text-[8px] uppercase font-bold text-primary/60 mt-1">Reservado</span>
                        ) : (
                          <button 
                            onClick={() => deleteSlot(slot.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    {slots.filter(s => !newSlotDate || s.date === newSlotDate).length === 0 && newSlotDate && (
                      <div className="col-span-full py-8 text-center text-white/20 italic text-sm">
                        No hay espacios definidos para este día.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Appointments List */}
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-lg font-bold">Citas Agendadas</h3>
                <p className="text-xs text-white/40">Seguimiento de las citas activas y pasadas</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-white/40">
                    <tr>
                      <th className="p-4">Fecha y Hora</th>
                      <th className="p-4">Tipo</th>
                      <th className="p-4">Usuario</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {appointments.map(app => (
                      <tr key={app.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="font-bold">{app.date}</div>
                          <div className="text-[10px] text-white/40">{formatTime(app.time)}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {app.type === 'presencial' ? <Users size={14} className="text-white/40" /> : <Phone size={14} className="text-white/40" />}
                            <span className="text-[10px] uppercase font-bold">{app.type}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold">{app.first_name} {app.last_name}</div>
                          <div className="text-[10px] text-white/40">@{app.username} • {app.email}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold ${
                            app.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-500' : 
                            app.status === 'scheduled' ? 'bg-amber-500/20 text-amber-500' : 
                            'bg-red-500/20 text-red-500'
                          }`}>
                            {app.status === 'scheduled' ? 'Agendada' : 
                             app.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {app.status === 'scheduled' && (
                              <button 
                                onClick={async () => {
                                  await fetch(`/api/appointments/${app.id}/status`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'confirmed', userId: user.id })
                                  });
                                  fetchData();
                                }}
                                className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors"
                                title="Confirmar Cita"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            {app.status !== 'cancelled' && (
                              <button 
                                onClick={async () => {
                                  if (confirm('¿Estás seguro de cancelar esta cita?')) {
                                    await fetch(`/api/appointments/${app.id}/status`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'cancelled', userId: user.id })
                                    });
                                    fetchData();
                                  }
                                }}
                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                title="Cancelar Cita"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {appointments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-white/20 italic">
                          No hay citas programadas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Historial */}
      <AnimatePresence>
        {historyUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-lg w-full space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Historial de {historyUser.first_name}</h3>
                <button onClick={() => setHistoryUser(null)} className="text-white/40 hover:text-white"><X size={20} /></button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {historyData.map((h, idx) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <code className="text-primary font-mono text-xs">{h.key_value}</code>
                      <span className="text-[10px] text-white/40">{new Date(h.changed_at).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        h.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/60'
                      }`}>
                        {h.status}
                      </span>
                      <p className="text-xs text-white/60">{h.notes}</p>
                    </div>
                  </div>
                ))}
                {historyData.length === 0 && (
                  <p className="text-center py-10 text-white/20 italic">No hay historial para este usuario.</p>
                )}
              </div>
              
              <button 
                onClick={() => setHistoryUser(null)} 
                className="w-full btn-primary py-3 text-xs font-bold uppercase"
              >
                Cerrar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-md w-full space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="text-primary" />
                </div>
                <h3 className="text-xl font-bold">Asignar Clave a {selectedUser.first_name}</h3>
                <p className="text-sm text-white/40">Se generará una clave única de 3 meses de duración.</p>
              </div>
              
              {!generatedKey ? (
                <button 
                  onClick={() => assignKey(selectedUser.id)}
                  disabled={isAssigning}
                  className="btn-primary w-full py-4 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {isAssigning ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      Asignando...
                    </>
                  ) : (
                    'Generar y Asignar'
                  )}
                </button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl text-center space-y-3">
                    <p className="text-[10px] text-primary uppercase font-bold tracking-widest">Clave Generada</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-3xl font-mono font-bold text-white tracking-tighter">{generatedKey}</span>
                      <button onClick={() => navigator.clipboard.writeText(generatedKey)} className="p-2 hover:text-primary"><Copy size={18} /></button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-white/40 text-center">Enviar al usuario:</p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => sendWhatsApp(selectedUser, generatedKey)}
                        className="flex-1 p-4 bg-[#25D366] text-white rounded-2xl flex flex-col items-center gap-2 hover:bg-[#20ba5a] transition-all shadow-lg shadow-green-500/20"
                      >
                        <MessageCircle size={24} fill="currentColor" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp</span>
                      </button>
                      <button 
                        onClick={() => sendEmail(selectedUser, generatedKey)}
                        className="flex-1 p-4 bg-[#0078D4] text-white rounded-2xl flex flex-col items-center gap-2 hover:bg-[#006cc0] transition-all shadow-lg shadow-blue-500/20"
                      >
                        <Mail size={24} fill="currentColor" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Correo</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <button 
                onClick={() => {
                  setSelectedUser(null);
                  setGeneratedKey(null);
                }} 
                className="w-full text-white/20 text-xs hover:text-white transition-colors"
              >
                {generatedKey ? 'Cerrar' : 'Cancelar'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubTabButton({ active, label, count, onClick, icon }: { active: boolean, label: string, count: number, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
        active ? 'bg-primary text-black' : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
      <span className={`px-1.5 py-0.5 rounded-full ${active ? 'bg-black/20' : 'bg-white/10'}`}>
        {count}
      </span>
    </button>
  );
}

function TabButton({ active, label, icon, onClick, count }: { active: boolean, label: string, icon: React.ReactNode, onClick: () => void, count?: number }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${
        active ? 'border-primary text-primary' : 'border-transparent text-white/40 hover:text-white/60'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{count}</span>
      )}
    </button>
  );
}
