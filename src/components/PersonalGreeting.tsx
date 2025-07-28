import React, { useState, useEffect } from 'react';
import { Sun, Moon, Sunrise, Sunset, Star, Clock } from 'lucide-react';

interface PersonalGreetingProps {
  nickname?: string;
}

const PersonalGreeting: React.FC<PersonalGreetingProps> = ({ nickname = 'Friend' }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return { text: 'Good night', period: 'night' };
    if (hour < 12) return { text: 'Good morning', period: 'morning' };
    if (hour < 17) return { text: 'Good afternoon', period: 'afternoon' };
    if (hour < 21) return { text: 'Good evening', period: 'evening' };
    return { text: 'Good night', period: 'night' };
  };

  // Get time period icon
  const getTimeIcon = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 7) return { icon: Sunrise, color: 'text-orange-400', bg: 'from-orange-500/20 to-yellow-500/20' };
    if (hour >= 7 && hour < 17) return { icon: Sun, color: 'text-yellow-400', bg: 'from-yellow-500/20 to-orange-500/20' };
    if (hour >= 17 && hour < 19) return { icon: Sunset, color: 'text-orange-500', bg: 'from-orange-500/20 to-red-500/20' };
    if (hour >= 19 && hour < 22) return { icon: Moon, color: 'text-blue-300', bg: 'from-blue-500/20 to-purple-500/20' };
    return { icon: Star, color: 'text-purple-300', bg: 'from-purple-500/20 to-indigo-500/20' };
  };

  // Get week number
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Get week start and end dates
  const getWeekDates = () => {
    const today = new Date(currentTime);
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as first day
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    };
    
    return `${formatDate(monday)} - ${formatDate(sunday)}`;
  };

  // Get moon phase
  const getMoonPhase = () => {
    const year = currentTime.getFullYear();
    const month = currentTime.getMonth() + 1;
    const day = currentTime.getDate();
    
    // Simplified moon phase calculation
    const c = Math.floor((year - 1900) / 100);
    const e = 2 * (year - 1900 - 100 * c);
    const f = Math.floor((month - 14) / 12);
    const jd = Math.floor(365.25 * (year + 4800 + f)) + Math.floor(30.6001 * (month - 1 - 12 * f)) + day - 32045;
    const daysSinceNewMoon = (jd - 2451549.5) % 29.53;
    
    const phase = daysSinceNewMoon / 29.53;
    
    if (phase < 0.0625 || phase >= 0.9375) {
      return { name: 'New Moon', icon: '🌑', description: 'New beginnings' };
    } else if (phase < 0.1875) {
      return { name: 'Waxing Crescent', icon: '🌒', description: 'Growing energy' };
    } else if (phase < 0.3125) {
      return { name: 'First Quarter', icon: '🌓', description: 'Taking action' };
    } else if (phase < 0.4375) {
      return { name: 'Waxing Gibbous', icon: '🌔', description: 'Building momentum' };
    } else if (phase < 0.5625) {
      return { name: 'Full Moon', icon: '🌕', description: 'Peak energy' };
    } else if (phase < 0.6875) {
      return { name: 'Waning Gibbous', icon: '🌖', description: 'Releasing' };
    } else if (phase < 0.8125) {
      return { name: 'Last Quarter', icon: '🌗', description: 'Letting go' };
    } else {
      return { name: 'Waning Crescent', icon: '🌘', description: 'Rest & reflect' };
    }
  };

  const greeting = getGreeting();
  const timeIconData = getTimeIcon();
  const TimeIcon = timeIconData.icon;
  const moonPhase = getMoonPhase();
  const weekNumber = getWeekNumber(currentTime);
  const weekDates = getWeekDates();

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl">
      {/* Top Row - Greeting and Time */}
      <div className="flex items-center justify-between mb-6">
        {/* Personal Greeting */}
        <div className="flex items-center space-x-4">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${timeIconData.bg} border border-white/20 flex items-center justify-center shadow-lg`}>
            <TimeIcon className={`w-4 h-4 ${timeIconData.color}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              {greeting.text}, {nickname}!
            </h2>
            <p className="text-blue-200 text-xs capitalize leading-tight">
              Hope you're having a wonderful {greeting.period}
            </p>
          </div>
        </div>
        
        {/* Time Display */}
        <div className="flex items-center space-x-2 bg-white/5 rounded-lg px-2 py-1 border border-white/10">
          <Clock className="w-4 h-4 text-blue-300" />
          <div className="text-base font-mono font-bold text-white tracking-wider">
            {currentTime.toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </div>
        </div>
      </div>

      {/* Compact Bottom Row - Single Line */}
      <div className="flex items-center justify-between text-sm text-blue-200">
        <div className="flex items-center space-x-4">
          <span className="font-medium">
            {currentTime.toLocaleDateString('en-GB', { 
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </span>
          <span>Week {weekNumber}</span>
          <span>{moonPhase.icon} {moonPhase.name}</span>
        </div>
      </div>
    </div>
  );
};

export default PersonalGreeting;