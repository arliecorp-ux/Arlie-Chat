import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, User, Mail, Phone, Calendar, Lock, ShieldCheck, ShieldAlert } from 'lucide-react';

interface RegisterProps {
  onRegister: () => void;
  onSwitch: () => void;
}

export default function Register({ onRegister, onSwitch }: RegisterProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    birthdate: '',
    password: '',
    acceptEula: false
  });

  const generateUsername = (first: string, last: string) => {
    const cleanName = first.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
    const cleanLastName = last.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
    if (!cleanName && !cleanLastName) return '';
    return `${cleanName}_${cleanLastName}`;
  };

  const handleFirstNameChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      firstName: val,
      username: generateUsername(val, prev.lastName)
    }));
  };

  const handleLastNameChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      lastName: val,
      username: generateUsername(prev.firstName, val)
    }));
  };

  const [showEula, setShowEula] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.acceptEula) {
      setError('Debes aceptar la Cláusula de Exención de Responsabilidad (EULA) para continuar.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert(`¡Registro exitoso! Tu usuario generado es: ${data.username}. Por favor, espera a que el administrador te asigne una clave de activación.`);
        onRegister();
      } else {
        setError(data.error || 'Error al registrar usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión con el servidor. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-8 w-full max-w-lg space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold">Crear Cuenta</h2>
        <p className="text-white/40 text-sm">Únete a la comunidad de bienestar ArlIE</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-medium flex items-center gap-2"
          >
            <ShieldAlert size={14} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-white/40 ml-1">Nombre</label>
          <input 
            type="text" 
            className="input-field w-full" 
            required 
            value={formData.firstName}
            onChange={(e) => handleFirstNameChange(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-white/40 ml-1">Apellido</label>
          <input 
            type="text" 
            className="input-field w-full" 
            required 
            value={formData.lastName}
            onChange={(e) => handleLastNameChange(e.target.value)}
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs text-white/40 ml-1">Usuario Sugerido</label>
          <input 
            type="text" 
            className="input-field w-full bg-white/5 text-primary font-bold" 
            readOnly
            value={formData.username}
            placeholder="Se generará automáticamente"
          />
          <p className="text-[10px] text-white/30 ml-1">Este será tu nombre de usuario para ingresar.</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-white/40 ml-1">Correo Electrónico</label>
          <input 
            type="email" 
            className="input-field w-full" 
            required 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <p className="text-[10px] text-white/30 ml-1">
            ¿No tienes correo? <a href="https://accounts.google.com/signup" target="_blank" rel="noreferrer" className="text-primary hover:underline">Crea uno en Google</a>
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-white/40 ml-1">WhatsApp</label>
          <input 
            type="tel" 
            className="input-field w-full" 
            required 
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-white/40 ml-1">Fecha de Nacimiento (DD/MM/AAAA)</label>
          <input 
            type="text" 
            placeholder="Ej: 15/05/1990"
            className="input-field w-full" 
            required 
            value={formData.birthdate}
            onChange={(e) => {
              let val = e.target.value.replace(/\D/g, '');
              if (val.length > 8) val = val.slice(0, 8);
              if (val.length > 4) val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4);
              else if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
              setFormData({...formData, birthdate: val});
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-white/40 ml-1">Contraseña</label>
          <input 
            type="password" 
            className="input-field w-full" 
            required 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
        </div>

        <div className="md:col-span-2 flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
          <input 
            type="checkbox" 
            className="mt-1 accent-primary" 
            checked={formData.acceptEula}
            onChange={(e) => setFormData({...formData, acceptEula: e.target.checked})}
          />
          <p className="text-xs text-white/60 leading-relaxed">
            Acepto la <button type="button" onClick={() => setShowEula(true)} className="text-primary hover:underline">Cláusula de Exención de Responsabilidad (EULA)</button>. Entiendo que ArlIE no sustituye a profesionales de la salud.
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary md:col-span-2 flex items-center justify-center gap-2">
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>

      <button onClick={onSwitch} className="w-full text-center text-white/40 text-sm hover:text-white transition-colors">
        ¿Ya tienes cuenta? Inicia sesión
      </button>

      {showEula && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card p-8 max-w-2xl max-h-[80vh] overflow-y-auto space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-primary" />
              Código de Ética y EULA
            </h3>
            <div className="text-sm text-white/70 space-y-4">
              <p><strong>1. No Sustitución:</strong> ArlIE Chat es una herramienta de apoyo emocional basada en IA y no sustituye la atención de psicólogos, psiquiatras o médicos profesionales.</p>
              <p><strong>2. Responsabilidad:</strong> El usuario es el único responsable de la información proporcionada y de las decisiones tomadas basándose en las interacciones con la IA.</p>
              <p><strong>3. Deslinde:</strong> ArlIE y sus desarrolladores se deslindan de cualquier responsabilidad legal derivada del mal uso de la plataforma o de interpretaciones erróneas del contenido generado.</p>
              <p><strong>4. Código de Ética:</strong> Queda estrictamente prohibido el uso de la plataforma para fines ilegales, acoso o generación de contenido violento. El mal uso conlleva sanciones legales.</p>
            </div>
            <button onClick={() => setShowEula(false)} className="btn-primary w-full">Entendido</button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
