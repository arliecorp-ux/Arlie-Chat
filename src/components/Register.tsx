import React, { useState } from 'react';
import { UserPlus, ArrowRight, CheckCircle2, Heart } from 'lucide-react';

export default function Register({ onRegister, onSwitch }: { onRegister: () => void, onSwitch: () => void }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    gender: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const getThemeColor = () => {
    if (formData.gender === 'mujer') return '#A855F7';
    if (formData.gender === 'hombre') return '#2EDBA7';
    return '#00D1FF';
  };

  const color = getThemeColor();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) setSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#02060C]">
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-700">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `${color}20`, border: `2px solid ${color}` }}>
            <CheckCircle2 size={40} style={{ color }} />
          </div>
          <h2 className="text-3xl font-black text-white italic">¡Todo listo, {formData.first_name}!</h2>
          <p className="text-white/60 max-w-sm mx-auto leading-relaxed">
            Te has registrado correctamente. <span style={{ color }} className="font-bold">ArlIE Staff</span> se pondrá en contacto contigo en breve para asignarte tu clave de acceso.
          </p>
          <button onClick={onSwitch} className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/20 hover:text-white transition-colors pt-10">
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#02060C]">
      <div className="w-full max-w-md space-y-8 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white tracking-tighter italic">Únete a ArlIE</h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest mt-2">Solicitud de Acceso Estudiantil</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 justify-center">
            {['mujer', 'hombre'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setFormData({...formData, gender: g})}
                className={`flex-1 py-3 rounded-xl border-2 transition-all text-[10px] font-black uppercase ${formData.gender === g ? 'bg-white/10' : 'border-transparent bg-white/5 text-white/20'}`}
                style={{ borderColor: formData.gender === g ? (g === 'mujer' ? '#A855F7' : '#2EDBA7') : 'transparent' }}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input required placeholder="Nombre" className="input-field" onChange={e => setFormData({...formData, first_name: e.target.value})} />
            <input required placeholder="Apellido" className="input-field" onChange={e => setFormData({...formData, last_name: e.target.value})} />
          </div>
          <input required placeholder="Nombre de Usuario" className="input-field w-full" onChange={e => setFormData({...formData, username: e.target.value})} />
          <input required type="email" placeholder="Correo Institucional" className="input-field w-full" onChange={e => setFormData({...formData, email: e.target.value})} />
          <input required type="tel" placeholder="WhatsApp (10 dígitos)" className="input-field w-full" onChange={e => setFormData({...formData, phone: e.target.value})} />

          <button 
            type="submit" 
            disabled={loading || !formData.gender}
            className="w-full font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-30"
            style={{ backgroundColor: color, color: '#000' }}
          >
            {loading ? 'Procesando...' : <>Enviar Registro <ArrowRight size={18}/></>}
          </button>
        </form>
      </div>
    </div>
  );
}