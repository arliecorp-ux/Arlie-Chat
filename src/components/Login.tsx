import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, ArrowRight, ShieldAlert, Heart, ArrowLeft } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginProps {
  onLogin: (user: UserType) => void;
  onSwitch: () => void;
}

export default function Login({ onLogin, onSwitch }: LoginProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: isAdminMode ? 'admin' : identifier, 
          password 
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('arlie_user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.error || 'Credenciales inválidas');
      }
    } catch (error) {
      setError('Error al conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoDoubleClick = () => {
    setIsAdminMode(true);
    setIdentifier('admin');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-10 w-full max-w-md space-y-8 relative overflow-hidden"
    >
      {/* Decorative Glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 blur-3xl rounded-full" />
      
      <div className="text-center space-y-4 relative">
        {/* Heart Logo in Green Square */}
        <motion.div 
          onDoubleClick={handleLogoDoubleClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-20 h-20 bg-primary rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-primary/30 cursor-pointer select-none group"
        >
          <Heart className="text-white w-10 h-10 transition-transform group-hover:scale-110" strokeWidth={2.5} />
        </motion.div>

        <div className="select-none">
          <div className="text-5xl font-black tracking-tighter italic flex justify-center items-baseline gap-1">
            <span className="text-white">Arl</span>
            <span className="text-primary drop-shadow-[0_0_15px_rgba(46,219,167,0.5)]">IE</span>
          </div>
          <p className="text-primary/60 text-[9px] font-bold uppercase tracking-[0.4em] mt-2">
            Algoritmo de Bienestar Emocional
          </p>
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
          {isAdminMode && !error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center gap-2 text-red-400 text-xs font-bold uppercase animate-pulse pt-2"
            >
              <ShieldAlert size={14} />
              Acceso de Administrador
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {!isAdminMode && (
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Usuario o correo" 
                className="input-field w-full pl-14"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          )}
          
          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
            <input 
              type="password" 
              placeholder={isAdminMode ? "Contraseña Maestra" : "Contraseña"} 
              className="input-field w-full pl-14"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          {isAdminMode ? (
            <button 
              type="button" 
              onClick={() => {
                setIsAdminMode(false);
                setError(null);
              }}
              className="flex items-center gap-2 text-xs text-white/40 hover:text-primary transition-colors"
            >
              <ArrowLeft size={14} />
              Regresar
            </button>
          ) : (
            <button 
              type="button" 
              onClick={() => setShowForgotModal(true)}
              className="text-xs text-white/40 hover:text-primary transition-colors ml-auto"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-3 group"
        >
          {isLoading ? 'Verificando...' : isAdminMode ? 'Acceder como Admin' : 'Ingresar'}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>

      {!isAdminMode && (
        <div className="text-center">
          <p className="text-white/40 text-sm">
            ¿Aún no tienes cuenta?{' '}
            <button onClick={onSwitch} className="text-primary font-bold hover:underline">Regístrate aquí</button>
          </p>
        </div>
      )}

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card p-8 max-w-md w-full space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Lock className="text-primary w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Recuperar Acceso</h3>
                <p className="text-white/60 text-sm">
                  Por seguridad, la recuperación de contraseña debe ser gestionada por un administrador.
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-left space-y-3">
                <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Pasos a seguir:</p>
                <ul className="text-sm text-white/70 space-y-2">
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">1.</span>
                    Contacta a soporte vía WhatsApp.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">2.</span>
                    Proporciona tu nombre de usuario o correo.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">3.</span>
                    Se te asignará una contraseña temporal.
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => setShowForgotModal(false)} 
                className="btn-primary w-full"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
