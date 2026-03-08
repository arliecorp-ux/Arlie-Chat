import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Key, Bell, Calendar, FileText, Users } from 'lucide-react';

// Importamos los sub-módulos (los crearemos a continuación)
import Stats from './Stats';
import KeyManager from './KeyManager';
import Alerts from './Alerts';
import Agenda from './Agenda';
import Reports from './Reports';

export default function AdminDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('stats');

  return (
    <div className="flex flex-col h-full bg-[#02060C]">
      {/* Menú de pestañas superior del Admin */}
      <div className="flex overflow-x-auto bg-white/5 border-b border-white/10 p-2 gap-2 scrollbar-hide">
        <TabBtn id="stats" label="Estadísticas" icon={<BarChart3 size={18}/>} active={activeTab} onClick={setActiveTab} />
        <TabBtn id="keys" label="Claves" icon={<Key size={18}/>} active={activeTab} onClick={setActiveTab} />
        <TabBtn id="alerts" label="Alertas" icon={<Bell size={18}/>} active={activeTab} onClick={setActiveTab} />
        <TabBtn id="agenda" label="Agenda" icon={<Calendar size={18}/>} active={activeTab} onClick={setActiveTab} />
        <TabBtn id="reports" label="Reportes" icon={<FileText size={18}/>} active={activeTab} onClick={setActiveTab} />
      </div>

      {/* Área de Contenido Dinámico */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'stats' && <Stats />}
            {activeTab === 'keys' && <KeyManager />}
            {activeTab === 'alerts' && <Alerts />}
            {activeTab === 'agenda' && <Agenda />}
            {activeTab === 'reports' && <Reports />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabBtn({ id, label, icon, active, onClick }: any) {
  const isActive = active === id;
  return (
    <button 
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
        isActive ? 'bg-[#00D1FF] text-black font-bold' : 'text-white/40 hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-xs uppercase tracking-widest">{label}</span>
    </button>
  );
}