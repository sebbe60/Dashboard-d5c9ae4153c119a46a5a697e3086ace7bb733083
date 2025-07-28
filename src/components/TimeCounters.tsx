import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Zap, Target } from 'lucide-react';

const TimeCounters: React.FC = () => {
  const [counters, setCounters] = useState({
    hoursLeftToday: 0,
    hoursLeftThisWeek: 0,
    hoursLeftThisMonth: 0,
    hoursLeftThisYear: 0
  });

  useEffect(() => {
    const updateCounters = () => {
      const now = new Date();
      
      // Hours left today
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const hoursLeftToday = Math.ceil((endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      // Hours left this week (until Sunday 23:59)
      const endOfWeek = new Date(now);
      const daysUntilSunday = (7 - now.getDay()) % 7;
      endOfWeek.setDate(now.getDate() + daysUntilSunday);
      endOfWeek.setHours(23, 59, 59, 999);
      const hoursLeftThisWeek = Math.ceil((endOfWeek.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      // Hours left this month
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const hoursLeftThisMonth = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      // Hours left this year
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      const hoursLeftThisYear = Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      setCounters({
        hoursLeftToday,
        hoursLeftThisWeek,
        hoursLeftThisMonth,
        hoursLeftThisYear
      });
    };

    updateCounters();
    const interval = setInterval(updateCounters, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const counterData = [
    {
      label: 'Hours Left Today',
      value: counters.hoursLeftToday,
      icon: Clock,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30'
    },
    {
      label: 'Hours Left This Week',
      value: counters.hoursLeftThisWeek,
      icon: Calendar,
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-500/20',
      border: 'border-green-500/30'
    },
    {
      label: 'Hours Left This Month',
      value: counters.hoursLeftThisMonth,
      icon: Target,
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/30'
    },
    {
      label: 'Hours Left This Year',
      value: counters.hoursLeftThisYear,
      icon: Zap,
      gradient: 'from-orange-500 to-red-500',
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/30'
    }
  ];

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl mb-8">
      <h2 className="text-xl font-bold text-white mb-6 text-center">Time Remaining</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {counterData.map((counter) => {
          const Icon = counter.icon;
          return (
            <div
              key={counter.label}
              className={`${counter.bg} ${counter.border} border rounded-xl p-4 text-center transition-all duration-200 hover:scale-105 hover:shadow-lg`}
            >
              <div className={`w-10 h-10 bg-gradient-to-r ${counter.gradient} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {counter.value.toLocaleString()}
              </div>
              <div className="text-xs text-blue-200 leading-tight">
                {counter.label}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-center">
        <p className="text-blue-200 text-sm">
          Make every hour count. Time is your most valuable resource.
        </p>
      </div>
    </div>
  );
};

export default TimeCounters;