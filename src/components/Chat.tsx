import React, { useState } from 'react';

export default function Chat({ user, themeColor }: { user: any, themeColor: string }) {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', text: input }];
    setMessages(newMessages);
    setInput('');

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input })
    });
    const data = await res.json();
    setMessages([...newMessages, { role: 'ai', text: data.reply }]);
  };

  return (
    <div className="flex flex-col h-full p-4 max-w-2xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-4 rounded-2xl ${m.role === 'user' ? 'bg-zinc-800 ml-12' : 'bg-white/5 mr-12'}`}
               style={{ borderLeft: m.role === 'user' ? `4px solid ${themeColor}` : 'none',
                        borderRight: m.role === 'ai' ? `4px solid ${themeColor}` : 'none' }}>
            <p className="text-sm">{m.text}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 p-4 bg-zinc-900 rounded-xl outline-none border border-white/10"
          placeholder="Escribe un mensaje..."
        />
        <button onClick={handleSend} style={{ backgroundColor: themeColor }} className="p-4 rounded-xl text-black font-bold">
          Enviar
        </button>
      </div>
    </div>
  );
}