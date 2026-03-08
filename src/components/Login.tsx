import React, { useState } from 'react';
import { LogIn, UserPlus, User as UserIcon, Venus, Mars } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any) => void;
  onSwitch: () => void;
}

export default function Login({ onLogin, onSwitch }: LoginProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'mujer' | 'hombre' | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Lógica de color dinámica
  const getThemeColor = () => {
    if (gender === 'mujer') return '#A855F7'; // Morado Vibrante
    if (gender === 'hombre') return '#2EDBA7'; // Verde ArlIE
    return '#00D1FF'; // Azul Impacto (Default)
  };

  const themeColor = getThemeColor();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gender) {
      setError('POR FAVOR SELECCIONA TU GÉNERO');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, gender }),
      });

      const data = await response.json();

      if (data.success) {
        // Guardamos el género en el objeto usuario para que App.tsx sepa qué color usar
        onLogin({ ...data.user, gender });
      } else {
        setError(data.error || 'CREDENCIALES INCORRECTAS');
      }
    } catch (err) {
      setError('ERROR DE CONEXIÓN CON ARLIE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#02060C] transition-colors duration-700" 
         style={{ backgroundColor: `${themeColor}05` }}>
      
      <div className="w-full max-w-md space-y-8 bg-white/5 p-8 rounded-3xl border transition-all duration-500 backdrop-blur-xl"
           style={{ borderColor: `${themeColor}33`, boxShadow: `0 0 40px ${themeColor}10` }}>
        
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-black font-black text-3xl mx-auto transition-all duration-500 shadow-lg"
               style={{ backgroundColor: themeColor, boxShadow: `0 0 20px ${themeColor}40` }}>
            A
          </div>
          <h2 className="mt-6 text-3xl font-black text-white tracking-tight italic">ArlIE Chat</h2>
          <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mt-2 font-bold">Identidad Escolar Inteligente</p>
        </div>

        {/* SELECCIÓN DE GÉNERO - IMPACTO VISUAL */}
        <div className="flex gap-4 justify-center py-2">
          <button 
            type="button"
            onClick={() => setGender('mujer')}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${gender === 'mujer' ? 'bg-purple-500/20 border-purple-500' : 'bg-white/5 border-transparent text-white/20'}`}
          >
            <Venus size={24} className={gender === 'mujer' ? 'text-purple-500' : ''} />
            <span className="text-[10px] font-bold uppercase">Mujer</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setGender('hombre')}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${gender === 'hombre' ? 'bg-[#2EDBA7]/20 border-[#2EDBA7]' : 'bg-white/5 border-transparent text-white/20'}`}
          >
            <Mars size={24} className={gender === 'hombre' ? 'text-[#2EDBA7]' : ''} />
            <span className="text-[10px] font-bold uppercase">Hombre</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="USUARIO O CORREO" 
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none transition-all focus:ring-1"
            style={{ focusBorderColor: themeColor }}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="CONTRASEÑA" 
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && <p className="text-red-400 text-[10px] text-center font-black tracking-widest animate-pulse">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full text-black font-black py-4 rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg"
            style={{ backgroundColor: themeColor, boxShadow: `0 10px 20px ${themeColor}30` }}
          >
            {loading ? 'CONECTANDO...' : <><LogIn size={20}/> ENTRAR</>}
          </button>
        </form>

        <button onClick={onSwitch} className="w-full text-white/30 text-[10px] hover:text-white transition-colors uppercase font-bold tracking-widest text-center">
          ¿No tienes cuenta? Regístrate aquí
        </button>
      </div>
    </div>
  );
}