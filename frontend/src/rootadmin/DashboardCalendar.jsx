import React, { useState } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, addDays, eachDayOfInterval 
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DashboardCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Logic to calculate the days to display
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-1">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Days of the Week Header */}
      <div className="grid grid-cols-7 bg-slate-50/50 py-2 border-b border-slate-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-[10px] font-bold text-center text-slate-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(day)}
              className={`
                relative h-12 flex flex-col items-center justify-center transition-all border-r border-b border-slate-50
                ${!isCurrentMonth ? 'text-slate-300 bg-slate-50/30' : 'text-slate-600 hover:bg-indigo-50/50'}
                ${isSelected ? 'bg-indigo-50 !text-indigo-600 font-bold' : ''}
              `}
            >
              <span className={`text-sm ${isToday && !isSelected ? 'text-indigo-500 font-semibold' : ''}`}>
                {format(day, 'd')}
              </span>
              
              {/* Event Indicator Dot - Ready for your DB data */}
              <div className="flex gap-0.5 mt-1">
                {isCurrentMonth && (
                  <span className={`h-1 w-1 rounded-full ${isSelected ? 'bg-indigo-400' : 'bg-slate-300'}`}></span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Selected: <span className="font-medium text-slate-700">{format(selectedDate, 'PPP')}</span>
        </p>
      </div>
    </div>
  );
};

export default DashboardCalendar;