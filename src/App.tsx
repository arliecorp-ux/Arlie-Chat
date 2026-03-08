import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Heart, BookOpen, Target, Settings, Shield } from 'lucide-react';

// --- ESTILOS DE IMPACTO AZUL (Inyectados directamente) ---
const blueTheme = `
  :root {
    --primary: #00D1FF;
    --primary-dark: #050A15;
    --accent: #0077FF;
  }
  body {
    background: radial-gradient(circle at center, #0A192F 0%, #02060C 100%) !important;
    color: white;
    margin: 0;
    font-family: 'Inter', sans-serif;
  }
  .nav-active { color: #00D1FF !important; filter: drop-shadow(0 0 8px #00D1FF); }
  .glass-header { background: rgba(10, 25, 47, 0.7); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0, 209, 255, 0.1); }
`;

export default function App() {
  const [user, setUser] = useState<any>(null); // Temporalmente any para probar
  const [view, setView] = useState('login');

  // Si no hay usuario, forzamos un estado de prueba para ver el diseño
  // Borra esta línea después de la prueba:
  // useEffect(() => { setUser({username: 'Estudiante', email: 'admin@arlie.com'}); setView('chat'); }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <style>{blueTheme}</style>
      
      {/* HEADER AZUL */}
      <header className="glass-header p-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00D1FF] rounded-lg flex items-center justify-center text-black font-black">A</div>
          <span className="font-bold text-xl tracking-tight text-white">ArlIE</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-[#00D1FF] font-bold">
          MODO ESCOLAR
        </div>
      </header>

      {/* CONTENIDO (Aquí irían tus componentes) */}
      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-white">Prueba de Diseño Azul</h2>
          <p className="text-blue-200/60 max-w-xs">Si ves este texto y el fondo es azul oscuro, el nuevo diseño de impacto ya funciona.</p>
          <button className="bg-[#00D1FF] text-black font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(0,209,255,0.4)]">
            BOTÓN DE PRUEBA
          </button>
        </div>
      </main>

      {/* NAVEGACIÓN INFERIOR AZUL */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#02060C]/90 backdrop-blur-xl border-t border-blue-900/50 p-3 flex justify-around items-center">
        <NavBtn active={view === 'chat'} icon={<MessageSquare />} label="Chat" />
        <NavBtn active={view === 'calm'} icon={<Heart />} label="Calma" />
        <NavBtn active={view === 'diary'} icon={<BookOpen />} label="Diario" />
        <NavBtn active={true} icon={<Settings />} label="Admin" />
      </nav>
    </div>
  );
}

function NavBtn({ active, icon, label }: any) {
  return (
    <div className={`flex flex-col items-center gap-1 ${active ? 'nav-active' : 'text-white/30'}`}>
      {React.cloneElement(icon, { size: 24 })}
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}