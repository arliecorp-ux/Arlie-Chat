import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, Plus, CheckCircle2, Circle, Clock, TrendingUp } from 'lucide-react';
import { User } from '../types';

export default function Goals({ user }: { user: User }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [newGoal, setNewGoal] = useState({ title: '', term: 'corto' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, [user.id]);

  const fetchGoals = async () => {
    const res = await fetch(`/api/goals/${user.id}`);
    const data = await res.json();
    setGoals(data);
  };

  const handleAddGoal = async () => {
    if (!newGoal.title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          title: newGoal.title, 
          term: newGoal.term === 'corto' ? 'Corto Plazo' : newGoal.term === 'mediano' ? 'Mediano Plazo' : 'Largo Plazo',
          description: '' 
        })
      });

      if (res.ok) {
        setNewGoal({ title: '', term: 'corto' });
        fetchGoals();
      }
    } catch (error) {
      console.error('Error adding goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGoalStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const deleteGoal = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta meta?')) return;
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (res.ok) fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const inProgressGoals = goals.filter(g => g.status !== 'completed');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto h-full overflow-y-auto pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Mis Metas</h2>
          <p className="text-white/40">Tu plan de acción personalizado</p>
        </div>
        <TrendingUp className="text-primary w-10 h-10" />
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2">
          <Plus className="text-primary" size={20} />
          Definir Nuevo Objetivo
        </h3>
        <div className="flex flex-col md:flex-row gap-3">
          <input 
            type="text" 
            placeholder="¿Qué quieres lograr?" 
            className="input-field flex-1"
            value={newGoal.title}
            onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
          />
          <select 
            className="input-field bg-primary-dark"
            value={newGoal.term}
            onChange={(e) => setNewGoal({...newGoal, term: e.target.value})}
          >
            <option value="corto">Corto Plazo (1 mes)</option>
            <option value="mediano">Mediano Plazo (2 meses)</option>
            <option value="largo">Largo Plazo (3 meses)</option>
          </select>
          <button 
            onClick={handleAddGoal}
            disabled={loading || !newGoal.title.trim()}
            className="btn-primary py-3 px-6 disabled:opacity-50"
          >
            {loading ? '...' : 'Agregar'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <Clock size={14} />
            En Progreso
          </h4>
          <div className="space-y-3">
            {inProgressGoals.length === 0 ? (
              <p className="text-white/20 text-sm italic p-4 border border-dashed border-white/10 rounded-xl text-center">No hay metas activas. ¡Define una nueva!</p>
            ) : (
              inProgressGoals.map(goal => (
                <GoalItem 
                  key={goal.id} 
                  title={goal.title} 
                  term={goal.term} 
                  progress={goal.status === 'completed' ? 100 : 50} 
                  onToggle={() => toggleGoalStatus(goal.id, goal.status)}
                  onDelete={() => deleteGoal(goal.id)}
                />
              ))
            )}
          </div>
        </section>

        {completedGoals.length > 0 && (
          <section className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <CheckCircle2 size={14} />
              Completadas
            </h4>
            <div className="space-y-3 opacity-60">
              {completedGoals.map(goal => (
                <GoalItem 
                  key={goal.id} 
                  title={goal.title} 
                  term={goal.term} 
                  progress={100} 
                  completed 
                  onToggle={() => toggleGoalStatus(goal.id, goal.status)}
                  onDelete={() => deleteGoal(goal.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function GoalItem({ title, term, progress, completed = false, onToggle, onDelete }: any) {
  return (
    <div className="glass-card p-4 flex items-center gap-4 group hover:border-primary/30 transition-colors">
      <button 
        onClick={onToggle}
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${completed ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/20 hover:bg-primary/10 hover:text-primary'}`}
      >
        {completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h5 className={`font-bold truncate ${completed ? 'line-through text-white/40' : ''}`}>{title}</h5>
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all">
            <Plus size={14} className="rotate-45" />
          </button>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] uppercase font-bold text-white/40">{term}</span>
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary"
            />
          </div>
          <span className="text-[10px] font-bold text-primary">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
