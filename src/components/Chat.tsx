import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function Chat({ user }: { user: any }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Hablamos con NUESTRO servidor, no con Google
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, gender: user?.gender || 'estudiante' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'arlie', content: data.reply }]);
    } catch (e) {
      console.error("Error ArlIE");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#02060C]">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[80%] text-sm ${m.role === 'user' ? 'bg-white/10 text-white' : 'border border-white/10 text-white'}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-6 border-t border-white/10">
        <div className="relative">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none"
            placeholder="Escribe lo que sientes..."
          />
          <button onClick={sendMessage} className="absolute right-3 top-2 p-2 bg-[#00D1FF] rounded-xl text-black">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}