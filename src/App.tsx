import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  User, 
  Calendar, 
  Heart, 
  Shield, 
  LogOut, 
  Menu, 
  X, 
  PhoneCall, 
  Target, 
  BookOpen,
  Settings,
  Bell,
  Plus,
  Phone,
  ShieldAlert,
  Stethoscope,
  LifeBuoy
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { User as UserType, ChatMessage } from './types';

// Components
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import AdminDashboard from './components/AdminDashboard';
import CalmZone from './components/CalmZone';
import Goals from './components/Goals';
import Diary from './components/Diary';
import { UrgentHelpModal } from './components/UrgentHelpModal';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'chat' | 'admin' | 'calm' | 'goals' | 'diary'>('login');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [showDirectory, setShowDirectory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isRenamingHeader, setIsRenamingHeader] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, sessionId]);

  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === sessionId);
      if (session) setCurrentSession(session);
    }
  }, [sessionId, sessions]);

  const fetchSessions = async () => {
    if (!user) return;
    const res = await fetch(`/api/chat-sessions/${user.id}`);
    const data = await res.json();
    setSessions(data);
    
    // If no session selected, pick the latest one
    if (!sessionId && data.length > 0) {
      setSessionId(data[0].id);
    }
  };

  const handleRenameSession = async (id: number, newTitle: string) => {
    if (!newTitle.trim()) return;
    await fetch(`/api/chat-sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle })
    });
    setEditingSessionId(null);
    setIsRenamingHeader(false);
    fetchSessions();
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('arlie_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      // Verify user exists on server to prevent stale ID issues (e.g. after DB reset)
      fetch(`/api/verify-user/${u.id}`)
        .then(res => {
          if (res.ok) {
            setUser(u);
            setHasAccess(localStorage.getItem('arlie_access') === 'true');
            setView(u.username === 'admin' ? 'admin' : 'chat');
          } else {
            console.warn("Stale user session detected, logging out.");
            handleLogout();
          }
        })
        .catch(err => {
          console.error("Error verifying user:", err);
          // Fallback to local data if server check fails (e.g. offline)
          setUser(u);
          setHasAccess(localStorage.getItem('arlie_access') === 'true');
          setView(u.username === 'admin' ? 'admin' : 'chat');
        });
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    setHasAccess(false);
    localStorage.removeItem('arlie_user');
    localStorage.removeItem('arlie_access');
    setView('login');
  };

  const handleNewChat = async () => {
    if (!user) return;
    const res = await fetch('/api/chat-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, title: `Conversación ${new Date().toLocaleString()}` })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      alert(`Error al crear nueva conversación: ${errorData.error}`);
      return;
    }
    
    const data = await res.json();
    setSessionId(data.id);
    setView('chat');
    setIsMenuOpen(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center p-4">
        {view === 'login' ? (
          <Login onLogin={(u) => {
            setUser(u);
            if (u.username === 'admin') {
              setHasAccess(true);
              localStorage.setItem('arlie_access', 'true');
              setView('admin');
            } else if (u.status === 'active') {
              setHasAccess(true);
              localStorage.setItem('arlie_access', 'true');
              setView('chat');
            } else {
              setHasAccess(false);
              localStorage.setItem('arlie_access', 'false');
              setView('chat'); // Will trigger the activation screen
            }
          }} onSwitch={() => setView('register')} />
        ) : (
          <Register onRegister={() => setView('login')} onSwitch={() => setView('login')} />
        )}
      </div>
    );
  }

  if (!hasAccess && user.username !== 'admin') {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center p-4">
        <div className="glass-card p-8 w-full max-w-md text-center space-y-6">
          <Shield className="w-16 h-16 text-primary mx-auto" />
          <h2 className="text-2xl font-bold">Cuenta Inactiva</h2>
          <p className="text-white/60">
            Tu registro ha sido recibido. Por favor, ingresa la clave de activación que el administrador te envió por WhatsApp o Correo.
          </p>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="ARLIE-XXXXXX" 
              className="input-field w-full text-center uppercase font-mono tracking-widest"
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  const key = (e.target as HTMLInputElement).value;
                  const res = await fetch('/api/verify-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key, userId: user.id })
                  });
                  if (res.ok) {
                    setHasAccess(true);
                    localStorage.setItem('arlie_access', 'true');
                    alert('¡Cuenta activada con éxito!');
                  } else {
                    alert('Clave inválida o no asignada a tu cuenta.');
                  }
                }
              }}
            />
            <p className="text-[10px] text-white/20">Presiona Enter para verificar</p>
          </div>
          <div className="h-px bg-white/5" />
          <button onClick={handleLogout} className="text-primary hover:underline text-sm">Cerrar Sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-dark flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-white/5 bg-primary-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
            <Heart className="text-primary-dark w-6 h-6 fill-primary-dark" />
          </div>
          <div className="overflow-hidden">
            {view === 'chat' && currentSession ? (
              <div className="flex flex-col">
                {isRenamingHeader ? (
                  <input 
                    autoFocus
                    className="bg-transparent border-b border-primary outline-none text-sm font-bold text-white w-full"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleRenameSession(currentSession.id, editingTitle)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameSession(currentSession.id, editingTitle)}
                  />
                ) : (
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={() => {
                    setIsRenamingHeader(true);
                    setEditingTitle(currentSession.title);
                  }}>
                    <h1 className="font-bold text-sm truncate max-w-[150px]">{currentSession.title}</h1>
                    <Settings size={12} className="text-white/20 group-hover:text-primary transition-colors" />
                  </div>
                )}
                <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-semibold">ArlIE Chat</p>
              </div>
            ) : (
              <>
                <h1 className="font-bold text-xl tracking-tight">ArlIE</h1>
                <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-semibold">Bienestar Emocional</p>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="h-full"
          >
            {view === 'chat' && <Chat user={user} sessionId={sessionId} onSessionChange={setSessionId} />}
            {view === 'admin' && <AdminDashboard user={user} />}
            {view === 'calm' && <CalmZone />}
            {view === 'goals' && <Goals user={user} />}
            {view === 'diary' && <Diary user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="p-2 border-t border-white/5 bg-primary-dark/90 backdrop-blur-md flex justify-around items-center">
        <NavButton active={view === 'chat'} icon={<MessageSquare />} label="Chat" onClick={() => setView('chat')} />
        <button 
          onClick={() => setShowHelp(true)}
          className="flex flex-col items-center gap-1 p-2 transition-all duration-300 relative group"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <motion.div 
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-red-500 rounded-full blur-xl -z-10"
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-500/80">Urgente</span>
        </button>
        <NavButton active={view === 'calm'} icon={<Heart />} label="Calma" onClick={() => setView('calm')} />
        <NavButton active={view === 'goals'} icon={<Target />} label="Metas" onClick={() => setView('goals')} />
        <NavButton active={view === 'diary'} icon={<BookOpen />} label="Diario" onClick={() => setView('diary')} />
      </nav>

      {/* Urgent Help Modal */}
      <UrgentHelpModal 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
        userId={user.id} 
      />

      {/* Side Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-primary-dark border-l border-white/10 z-[70] p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold">Menú</h3>
                <button onClick={() => setIsMenuOpen(false)}><X /></button>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto pr-2">
                <MenuItem icon={<Plus className="text-primary" />} label="Nueva Conversación" onClick={handleNewChat} className="bg-primary/5 border border-primary/10" />
                
                <div className="mt-6 mb-2 px-4">
                  <p className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Historial</p>
                </div>
                
                {sessions.map((session) => (
                  <div key={session.id} className="group relative">
                    {editingSessionId === session.id ? (
                      <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl">
                        <input 
                          autoFocus
                          className="bg-transparent border-none outline-none text-sm flex-1"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameSession(session.id, editingTitle)}
                        />
                        <button onClick={() => handleRenameSession(session.id, editingTitle)} className="text-primary"><Plus size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <button 
                          onClick={() => {
                            setSessionId(session.id);
                            setView('chat');
                            setIsMenuOpen(false);
                          }}
                          className={`flex-1 text-left p-3 rounded-xl transition-colors text-sm truncate ${sessionId === session.id ? 'bg-primary/10 text-primary' : 'hover:bg-white/5 text-white/60'}`}
                        >
                          {session.title}
                        </button>
                        <button 
                          onClick={() => {
                            setEditingSessionId(session.id);
                            setEditingTitle(session.title);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-white transition-all"
                        >
                          <Settings size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                <div className="h-px bg-white/10 my-4" />
                {user.username === 'admin' && (
                  <MenuItem 
                    icon={<Shield className="text-primary" />} 
                    label="Panel de Control" 
                    onClick={() => {
                      setView('admin');
                      setIsMenuOpen(false);
                    }} 
                    className="bg-primary/5 border border-primary/10"
                  />
                )}
                <MenuItem icon={<User />} label="Mi Perfil" onClick={() => {}} />
                <MenuItem icon={<Calendar />} label="Mis Citas" onClick={() => {}} />
                <MenuItem icon={<Bell />} label="Notificaciones" onClick={() => {}} />
                <MenuItem 
                  icon={<PhoneCall />} 
                  label="Directorio Local" 
                  onClick={() => setShowDirectory(!showDirectory)} 
                />
                
                <AnimatePresence>
                  {showDirectory && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-4 space-y-1"
                    >
                      <DirectoryItem icon={<ShieldAlert size={14} />} label="911 Emergencias" phone="911" />
                      <DirectoryItem icon={<Shield size={14} />} label="Policía Municipal" phone="4474782121" />
                      <DirectoryItem icon={<Stethoscope size={14} />} label="Hosp. Gral. Maravatío" phone="4474781010" />
                      <DirectoryItem icon={<LifeBuoy size={14} />} label="Línea de la Vida" phone="8009112000" />
                      <DirectoryItem icon={<Heart size={14} />} label="Dr. Simi (Apoyo)" phone="8009113232" />
                      <DirectoryItem icon={<Phone size={14} />} label="Línea del Estado" phone="070" />
                      <DirectoryItem icon={<Phone size={14} />} label="Línea Federación" phone="8000044800" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="h-px bg-white/10 my-4" />
                <MenuItem icon={<PhoneCall />} label="Emergencias" onClick={() => window.open('tel:911')} className="text-red-400" />
              </div>

              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 p-4 text-white/60 hover:text-white transition-colors mt-auto"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ${active ? 'text-primary' : 'text-white/40 hover:text-white/60'}`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      {active && <motion.div layoutId="nav-indicator" className="w-1 h-1 bg-primary rounded-full mt-1" />}
    </button>
  );
}

function MenuItem({ icon, label, onClick, className = "" }: { icon: React.ReactNode, label: string, onClick: () => void, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 w-full p-4 rounded-xl hover:bg-white/5 transition-colors text-left ${className}`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function DirectoryItem({ icon, label, phone }: { icon: React.ReactNode, label: string, phone: string }) {
  return (
    <button 
      onClick={() => window.open(`tel:${phone}`)}
      className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="text-primary/60">{icon}</div>
        <span className="text-xs font-medium text-white/80">{label}</span>
      </div>
      <span className="text-[10px] font-mono text-white/20">{phone}</span>
    </button>
  );
}
