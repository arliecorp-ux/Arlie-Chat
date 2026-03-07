import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wind, Waves, Sun, Play, Pause, RefreshCw } from 'lucide-react';

const exercises = [
  {
    title: 'Respiración 4-7-8',
    description: 'Inhala 4s, mantén 7s, exhala 8s. Ideal para reducir la ansiedad rápidamente.',
    icon: <Wind className="w-8 h-8" />,
    color: 'bg-blue-500/20 text-blue-400'
  },
  {
    title: 'Técnica 5-4-3-2-1',
    description: 'Enraízate: 5 cosas que ves, 4 que oyes, 3 que sientes, 2 que hueles, 1 que saboreas.',
    icon: <Waves className="w-8 h-8" />,
    color: 'bg-teal-500/20 text-teal-400'
  },
  {
    title: 'Escaneo Corporal',
    description: 'Recorre tu cuerpo mentalmente desde los pies a la cabeza, soltando tensión.',
    icon: <Sun className="w-8 h-8" />,
    color: 'bg-orange-500/20 text-orange-400'
  }
];

export default function CalmZone() {
  const [activeExercise, setActiveExercise] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Zona de Calma</h2>
        <p className="text-white/40 italic">"Respira, estás aquí y ahora."</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {exercises.map((ex, i) => (
          <motion.div 
            key={i}
            whileHover={{ scale: 1.02 }}
            className={`glass-card p-6 flex items-center gap-6 cursor-pointer transition-all ${activeExercise === i ? 'ring-2 ring-primary' : ''}`}
            onClick={() => {
              setActiveExercise(i);
              setIsPlaying(false);
            }}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${ex.color}`}>
              {ex.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{ex.title}</h3>
              <p className="text-sm text-white/60">{ex.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {activeExercise !== null && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 text-center space-y-8 bg-primary/5 border-primary/20"
        >
          <div className="relative w-48 h-48 mx-auto">
            <motion.div 
              animate={{ 
                scale: isPlaying ? [1, 1.3, 1] : 1,
                opacity: isPlaying ? [0.2, 0.5, 0.2] : 0.2
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-primary rounded-full"
            />
            <div className="absolute inset-4 border-2 border-primary/30 rounded-full flex items-center justify-center">
              <h4 className="text-2xl font-bold text-primary">
                {isPlaying ? 'Respira' : 'Listo'}
              </h4>
            </div>
          </div>

          <div className="flex justify-center gap-6">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 bg-primary text-primary-dark rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 transition-transform"
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
            </button>
            <button 
              onClick={() => setIsPlaying(false)}
              className="w-16 h-16 bg-white/5 text-white/60 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <RefreshCw size={24} />
            </button>
          </div>

          <p className="text-sm text-white/40 max-w-sm mx-auto">
            Sigue el ritmo de la animación. Inhala cuando se expande, exhala cuando se contrae.
          </p>
        </motion.div>
      )}
    </div>
  );
}
