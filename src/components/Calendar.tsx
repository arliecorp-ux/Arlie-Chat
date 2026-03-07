import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  availability: any[];
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
}

export const Calendar: React.FC<CalendarProps> = ({ availability, onDateSelect, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  const getDayStatus = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = availability.find(a => a.date === dateStr);
    
    if (!dayData || dayData.total === 0) return 'none';
    const available = dayData.total - dayData.booked;
    if (available === 0) return 'full';
    if (available <= 2) return 'low';
    return 'high';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high': return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500';
      case 'low': return 'bg-amber-500/20 border-amber-500/50 text-amber-500';
      case 'full': return 'bg-white/5 border-white/10 text-white/20';
      default: return 'bg-white/5 border-white/5 text-white/40';
    }
  };

  const renderDays = () => {
    const dayElements = [];
    // Empty slots for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      dayElements.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }

    for (let d = 1; d <= days; d++) {
      const status = getDayStatus(d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;

      dayElements.push(
        <button
          key={d}
          onClick={() => onDateSelect?.(dateStr)}
          className={`h-10 w-10 rounded-xl border flex items-center justify-center text-xs font-bold transition-all ${getStatusColor(status)} ${
            isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-primary-dark' : ''
          } hover:scale-110 active:scale-95`}
        >
          {d}
        </button>
      );
    }
    return dayElements;
  };

  return (
    <div className="glass-card p-6 w-full max-w-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg">{monthNames[month]} {year}</h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
          <div key={d} className="h-10 w-10 flex items-center justify-center text-[10px] font-bold text-white/20 uppercase tracking-widest">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {renderDays()}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-[10px] uppercase tracking-widest font-bold">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
          <span className="text-white/40">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
          <span className="text-white/40">Poca Disp.</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white/5 border border-white/10" />
          <span className="text-white/40">Sin Disp.</span>
        </div>
      </div>
    </div>
  );
};
