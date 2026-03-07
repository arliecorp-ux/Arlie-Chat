import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function Chat({ user }: { user: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', content: data.reply, timestamp: new Date().toISOString() }]);
    } catch (e) {
      console.error("Error chat:", e);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-black rounded-tr-none' : 'bg-white/5 border border-white/10 text-white rounded-tl-none'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-primary text-xs animate-pulse">ArlIE está escribiendo...</div>}
        <div ref={scrollRef} />
      </div>
      <div className="flex gap-2">
        <input className="input-field flex-1" value={input} onChange={e => setInput(e.target.value)} placeholder="¿Cómo te sientes hoy?" />
        <button onClick={handleSend} className="btn-primary !py-2 !px-4"><Send size={20}/></button>
      </div>
    </div>
  );
}