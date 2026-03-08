import React, { useState } from 'react';

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    gender: 'masculino' // Valor inicial
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (response.ok) window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <h2 className="text-[#00D1FF] text-2xl font-black text-center uppercase">Crear Cuenta</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Nombre" className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white" 
            onChange={e => setFormData({...formData, first_name: e.target.value})} required />
          <input placeholder="Apellido" className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white" 
            onChange={e => setFormData({...formData, last_name: e.target.value})} required />
        </div>

        <select 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white"
          onChange={e => setFormData({...formData, gender: e.target.value})}
        >
          <option value="masculino">Hombre (Verde)</option>
          <option value="femenino">Mujer (Morado)</option>
          <option value="otro">Otro (Azul)</option>
        </select>

        <input type="email" placeholder="Correo" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white" 
          onChange={e => setFormData({...formData, email: e.target.value})} required />
        
        <input type="password" placeholder="Contraseña" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white" 
          onChange={e => setFormData({...formData, password: e.target.value})} required />

        <button className="w-full bg-[#00D1FF] p-4 rounded-2xl font-black uppercase text-black">Registrarse</button>
      </form>
    </div>
  );
}