import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Smile, Meh, Frown, Save, History, Calendar } from 'lucide-react';
import { User } from '../types';

export default function Diary({ user }: { user: User }) {
  const [entry, setEntry] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const moods = [
    { label: 'Feliz', icon: <Smile className="text-green-400" />, value: 'happy' },
    { label: 'Neutral', icon: <Meh className="text-yellow-400" />, value: 'neutral' },
    { label: 'Triste', icon: <Frown className="text-blue-400" />, value: 'sad' },
  ];

  useEffect(() => {
    fetchHistory();
  }, [user.id]);

  const fetchHistory = async () => {
    const res = await fetch(`/api/diary/${user.id}`);
    const data = await res.json();
    setHistory(data);
  };

  const handleSave = async () => {
    if (!entry.trim() || !mood) {
      alert('Por favor selecciona un estado de ánimo y escribe tu reflexión.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, content: entry, mood })
      });

      if (res.ok) {
        setEntry('');
        setMood(null);
        fetchHistory();
      }
    } catch (error) {
      console.error('Error saving diary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString('es-MX', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Diario de Reflexión</h2>
        <p className="text-white/40">Un espacio seguro para tus pensamientos</p>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-bold text-white/60">¿Cómo te sientes hoy?</label>
          <div className="flex gap-4">
            {moods.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={`flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  mood === m.value ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {m.icon}
                <span className="text-xs font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-white/60">Escribe tu reflexión del día</label>
          <textarea 
            className="input-field w-full min-h-[200px] resize-none"
            placeholder="Hoy me di cuenta de que..."
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Save size={20} />
          {loading ? 'Guardando...' : 'Guardar Reflexión'}
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold flex items-center gap-2 text-white/60">
          <History size={20} />
          Entradas Recientes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.length === 0 ? (
            <div className="md:col-span-2 text-center p-8 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <p className="text-white/20 text-sm">Aún no tienes reflexiones guardadas.</p>
            </div>
          ) : (
            history.map((item) => (
              <DiaryCard 
                key={item.id}
                date={formatTimestamp(item.timestamp)} 
                mood={item.mood} 
                content={item.content} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DiaryCard({ date, content }: any) {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Calendar size={12} />
          {date}
        </div>
        <div className="w-2 h-2 rounded-full bg-primary" />
      </div>
      <p className="text-sm text-white/80 line-clamp-3 leading-relaxed">"{content}"</p>
    </div>
  );
}
