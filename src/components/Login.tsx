import React, { useState } from 'react';

export default function Login({ onLogin, onSwitch, themeColor }: { onLogin: (u: any) => void, onSwitch: () => void, themeColor: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: email, password })
    });
    const data = await res.json();
    if (data.success) {
      onLogin(data.user);
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-[#0B0F1A] rounded-3xl border border-white/10 shadow-2xl">
      <h2 style={{ color: themeColor }} className="text-2xl font-black mb-6 uppercase text-center">Bienvenido</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input 
          type="email" 
          placeholder="Correo Electrónico" 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none"
          onChange={e => setEmail(e.target.value)}
          required 
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none"
          onChange={e => setPassword(e.target.value)}
          required 
        />
        <button 
          type="submit" 
          style={{ backgroundColor: themeColor }}
          className="w-full p-4 rounded-xl text-black font-black uppercase shadow-lg"
        >
          Entrar
        </button>
        <p className="text-center text-xs text-gray-500 cursor-pointer" onClick={onSwitch}>
          ¿No tienes cuenta? Regístrate aquí
        </p>
      </form>
    </div>
  );
}