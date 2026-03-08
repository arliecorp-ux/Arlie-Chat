import React, { useState } from 'react';

export default function Register({ onSwitch }: { onSwitch: () => void }) {
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', password: '', gender: 'femenino'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (response.ok) onSwitch();
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-[#0B0F1A] rounded-3xl border border-white/10">
      <h2 className="text-[#00D1FF] text-center font-black uppercase mb-6">Registro ArlIE</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Nombre" className="p-4 bg-white/5 rounded-xl text-white outline-none" 
            onChange={e => setFormData({...formData, first_name: e.target.value})} required />
          <input placeholder="Apellido" className="p-4 bg-white/5 rounded-xl text-white outline-none" 
            onChange={e => setFormData({...formData, last_name: e.target.value})} required />
        </div>
        <select 
          className="w-full p-4 bg-[#161B26] border border-white/10 rounded-xl text-white"
          onChange={e => setFormData({...formData, gender: e.target.value})}
          value={formData.gender}
        >
          <option value="femenino">Mujer (Color Morado)</option>
          <option value="masculino">Hombre (Color Verde)</option>
        </select>
        <input type="email" placeholder="Email" className="w-full p-4 bg-white/5 rounded-xl text-white" 
          onChange={e => setFormData({...formData, email: e.target.value})} required />
        <input type="password" placeholder="Contraseña" className="w-full p-4 bg-white/5 rounded-xl text-white" 
          onChange={e => setFormData({...formData, password: e.target.value})} required />
        <button type="submit" className="w-full bg-[#00D1FF] p-4 rounded-xl font-black text-black uppercase">Registrarse</button>
      </form>
    </div>
  );
}