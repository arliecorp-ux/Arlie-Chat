import React, { useState } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import Chat from './components/Chat';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'login' | 'register' | 'chat'>('login');

  // Lógica de colores basada en el género guardado en Firestore
  const themeColor = !user ? '#00D1FF' : 
                    user.gender === 'femenino' ? '#A855F7' : 
                    user.gender === 'masculino' ? '#22C55E' : '#00D1FF';

  return (
    <div className="h-screen w-full bg-[#02060C] text-white flex flex-col overflow-hidden transition-colors duration-500" 
         style={{ borderTop: `6px solid ${themeColor}` }}>
      
      {view === 'login' && (
        <Login 
          onLogin={(u: any) => { setUser(u); setView('chat'); }} 
          onSwitch={() => setView('register')} 
          themeColor={themeColor}
        />
      )}
      
      {view === 'register' && (
        <Register 
          onSwitch={() => setView('login')} 
          themeColor={themeColor}
        />
      )}
      
      {view === 'chat' && user && (
        <Chat user={user} themeColor={themeColor} />
      )}
    </div>
  );
}