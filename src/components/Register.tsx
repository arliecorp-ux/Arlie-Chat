import React, { useState } from 'react';

export default function Register({ onSwitch, themeColor }: { onSwitch: () => void, themeColor: string }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    gender: 'femenino', // Valor por defecto
    phone: '',
    birthdate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert("¡Registro exitoso! Ahora inicia sesión.");
        onSwitch();
      }
    } catch (error) {
      console.error("Error en el registro:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-[#0B0F1A] rounded-3xl border border-white/10 shadow-2xl">
      <h2 style={{ color: themeColor }} className="text-2xl font-black mb-6 uppercase text-center">Crear Cuenta</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input 
            placeholder="Nombre" 
            className="p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#00D1FF]"
            onChange={e => setFormData({...formData, first_name: e.target.value})}
            required 
          />
          <input 
            placeholder="Apellido" 
            className="p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#00D1FF]"
            onChange={e => setFormData({...formData, last_name: e.target.value})}
            required 
          />
        </div>

        <select 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none"
          onChange={e => setFormData({...formData, gender: e.target.value})}
          value={formData.gender}
        >
          <option value="femenino">Mujer (Tema Morado)</option>
          <option value="masculino">Hombre (Tema Verde)</option>
        </select>

        <input 
          type="email" 
          placeholder="Correo Electrónico" 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none"
          onChange={e => setFormData({...formData, email: e.target.value})}
          required 
        />

        <input 
          placeholder="WhatsApp (opcional)" 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none"
          onChange={e => setFormData({...formData, phone: e.target.value})}
        />

        <input 
          type="password" 
          placeholder="Contraseña" 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none"
          onChange={e => setFormData({...formData, password: e.target.value})}
          required 
        />

        <button 
          type="submit" 
          style={{ backgroundColor: themeColor }}
          className="w-full p-4 rounded-xl text-black font-black uppercase transition-transform active:scale-95"
        >
          Registrarse
        </button>

        <p className="text-center text-xs text-gray-500 cursor-pointer hover:text-white" onClick={onSwitch}>
          ¿Ya tienes cuenta? Inicia sesión aquí
        </p>
      </form>
    </div>
  );
}