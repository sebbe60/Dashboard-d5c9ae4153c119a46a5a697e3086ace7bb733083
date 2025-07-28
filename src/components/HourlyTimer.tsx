import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Play, Pause, RotateCcw, Bell, X, CheckCircle, Settings, CheckSquare, Plus } from 'lucide-react';
import TaskManager from './TaskManager';
import { Task } from '../types';

interface HourlyTimerProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

const HourlyTimer: React.FC<HourlyTimerProps> = ({ tasks, onAddTask, onUpdateTask, onDeleteTask }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [hoursTracked, setHoursTracked] = useState(() => {
    const saved = localStorage.getItem('hour-app-hours-tracked-today');
    const savedDate = localStorage.getItem('hour-app-last-date');
    const today = new Date().toDateString();
    
    // Reset if it's a new day
    if (savedDate !== today) {
      localStorage.setItem('hour-app-last-date', today);
      localStorage.setItem('hour-app-hours-tracked-today', '0');
      return 0;
    }
    
    return saved ? parseInt(saved) : 0;
  });
  const [showAlarm, setShowAlarm] = useState(false);
  const [alarmAudio, setAlarmAudio] = useState<{ stop: () => void } | null>(null);
  const [currentQuote, setCurrentQuote] = useState('');

  // Generate contextual quotes
  const generateQuote = useCallback(() => {
    const settings = JSON.parse(localStorage.getItem('hour-app-hourly-popup-settings') || '{}');
    
    if (settings.useAI && settings.geminiApiKey) {
      generateAIQuote();
      return;
    }
    
    const hour = new Date().getHours();
    const dayProgress = Math.round((hour / 24) * 100);
    
    const quotes = {
      motivational: [
        "Every hour is a new opportunity to make progress toward your dreams.",
        "You're building something amazing, one hour at a time.",
        "This hour is yours to shape. Make it count.",
        "Small consistent actions in each hour create extraordinary results.",
        "You have the power to make this next hour your best yet."
      ],
      'time-focused': [
        `It's ${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}. You've completed ${dayProgress}% of today — how's it going?`,
        `${hour}:00 - A fresh slate awaits. What will you accomplish this hour?`,
        `Time check: ${dayProgress}% of today is done. The remaining hours are yours to optimize.`,
        `Hour ${hour} of 24. Each one is a building block of your success.`,
        `${hour >= 12 ? 'Afternoon' : 'Morning'} momentum: You're ${dayProgress}% through today's journey.`
      ],
      productivity: [
        "Focus is your superpower. Use this hour to demonstrate it.",
        "One focused hour can accomplish what scattered days cannot.",
        "This hour: Pick one important thing and give it your full attention.",
        "Productivity isn't about being busy — it's about being intentional with each hour.",
        "The most successful people treat each hour as their most valuable resource."
      ]
    };
    
    const selectedQuotes = quotes[settings.quoteStyle] || quotes.motivational;
    const randomQuote = selectedQuotes[Math.floor(Math.random() * selectedQuotes.length)];
    setCurrentQuote(randomQuote);
  }, []);

  // Generate AI-powered quote using Gemini
  const generateAIQuote = useCallback(async () => {
    const settings = JSON.parse(localStorage.getItem('hour-app-hourly-popup-settings') || '{}');
    
    try {
      const hour = new Date().getHours();
      const dayProgress = Math.round((hour / 24) * 100);
      const hoursLeft = getHoursLeftToday();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      
      const prompt = `Generate a brief, inspiring hourly reminder for someone using a productivity app. Context:
      - Current time: ${hour}:00 (${timeOfDay})
      - Day progress: ${dayProgress}% complete
      - Hours remaining today: ${hoursLeft}
      - Style: ${settings.quoteStyle || 'motivational'}
      
      IMPORTANT: Write as if you're speaking directly to the person in a friendly, conversational tone. Do not use quotation marks, rigid time formats like "4 PM:", or formal structures. Just speak naturally about their progress and encourage them. Keep it to 1-2 sentences maximum.
      
      Examples of the natural tone:
      - You're already 67% through the day - that's solid progress! These next 8 hours are yours to make count.
      - Nice work getting this far into the afternoon! You've still got plenty of time to accomplish something meaningful.
      - The day's flying by and you're doing great. Let's make these remaining hours really shine.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${settings.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiQuote = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiQuote) {
          setCurrentQuote(aiQuote.replace(/"/g, '').trim());
          return;
        }
      }
    } catch (error) {
      console.warn('AI quote generation failed, falling back to static quotes:', error);
    }
    
    // Fallback to static quotes if AI fails
    const staticQuotes = {
      'motivational': [
        "Every hour is a new opportunity to make progress toward your dreams.",
        "You're building something amazing, one hour at a time.",
        "This hour is yours to shape. Make it count.",
        "Small consistent actions in each hour create extraordinary results."
      ],
      'time-focused': [
        `You've completed ${dayProgress}% of today — how's it going?`,
        `${dayProgress}% of today is done. The remaining hours are yours to optimize.`,
        `Hour ${hour} of 24. Each one is a building block of your success.`,
        `${hour >= 12 ? 'Afternoon' : 'Morning'} momentum: You're ${dayProgress}% through today's journey.`
      ],
      'productivity': [
        "Focus is your superpower. Use this hour to demonstrate it.",
        "One focused hour can accomplish what scattered days cannot.",
        "This hour: Pick one important thing and give it your full attention.",
        "The most successful people treat each hour as their most valuable resource."
      ]
    };
    
    const selectedQuotes = staticQuotes[settings.quoteStyle] || staticQuotes.motivational;
    setCurrentQuote(selectedQuotes[Math.floor(Math.random() * selectedQuotes.length)]);
    
  }, []);

  // Calculate hours left today
  const getHoursLeftToday = () => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    return Math.ceil((endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60));
  };

  // Calculate day progress
  const getDayProgress = () => {
    const hour = new Date().getHours();
    return Math.round((hour / 24) * 100);
  };

  const calculateTimeToNextHour = useCallback(() => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    return Math.floor((nextHour.getTime() - now.getTime()) / 1000);
  }, []);

  // Save hours tracked to localStorage
  useEffect(() => {
    localStorage.setItem('hour-app-hours-tracked-today', hoursTracked.toString());
  }, [hoursTracked]);

  // Track hours when component mounts and every hour
  useEffect(() => {
    const trackCurrentHour = () => {
      const currentHourNum = new Date().getHours();
      const trackedHours = JSON.parse(localStorage.getItem('hour-app-tracked-hours-list') || '[]');
      const today = new Date().toDateString();
      
      // Filter to today's hours only
      const todayHours = trackedHours.filter((entry: any) => 
        new Date(entry.date).toDateString() === today
      );
      
      // Check if current hour is already tracked
      const hourAlreadyTracked = todayHours.some((entry: any) => entry.hour === currentHourNum);
      
      if (!hourAlreadyTracked) {
        const newEntry = { hour: currentHourNum, date: new Date() };
        const updatedHours = [...trackedHours.filter((entry: any) => 
          new Date(entry.date).toDateString() === today
        ), newEntry];
        
        localStorage.setItem('hour-app-tracked-hours-list', JSON.stringify(updatedHours));
        setHoursTracked(updatedHours.length);
      }
    };
    
    // Track current hour immediately
    trackCurrentHour();
    
    // Track every time we cross into a new hour
    const interval = setInterval(() => {
      const newHour = new Date().getHours();
      if (newHour !== currentHour) {
        setCurrentHour(newHour);
        trackCurrentHour();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [currentHour]);

  const playNotificationSound = useCallback(() => {
    // Create a pleasant chime sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.3); // E5
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.6); // A4
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  }, []);

  const playAlarmSound = useCallback(() => {
    // Stop any existing alarm
    if (alarmAudio) {
      alarmAudio.stop();
    }

    // Create looping alarm sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    let isPlaying = true;
    
    const playAlarmSequence = () => {
      if (!isPlaying) return;
      
      const playBeep = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      // Play alarm sequence
      playBeep(880, audioContext.currentTime, 0.3);
      playBeep(880, audioContext.currentTime + 0.4, 0.3);
      playBeep(880, audioContext.currentTime + 0.8, 0.3);
      playBeep(1100, audioContext.currentTime + 1.2, 0.5);
      
      // Schedule next sequence
      setTimeout(() => {
        if (isPlaying) {
          playAlarmSequence();
        }
      }, 2000); // Repeat every 2 seconds
    };
    
    playAlarmSequence();
    
    // Return stop function
    const stopAlarm = () => {
      isPlaying = false;
    };
    
    setAlarmAudio({ stop: stopAlarm });
  }, [alarmAudio]);

  const resetTimer = useCallback(() => {
    const newTimeLeft = calculateTimeToNextHour();
    setTimeLeft(newTimeLeft);
    setCurrentHour(new Date().getHours());
    
    // Show alarm modal and play sound when hour completes
    if (isActive) {
      // Prepare content for the popup
      generateQuote();
      
      playAlarmSound();
      setShowAlarm(true);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('Hour Complete!', {
          body: 'Time for a new hour of focused work. What will you accomplish?',
          icon: '/vite.svg'
        });
      }
      
      // Trigger AI chat hourly message
      window.dispatchEvent(new CustomEvent('hourly-ai-chat'));
    }
  }, [isActive, calculateTimeToNextHour, generateQuote, playAlarmSound]);

  const dismissAlarm = () => {
    // Stop any playing alarm sound immediately
    if (alarmAudio) {
      alarmAudio.stop();
      setAlarmAudio(null);
    }
    setShowAlarm(false);
  };

  useEffect(() => {
    setTimeLeft(calculateTimeToNextHour());
    
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Cleanup any existing alarm when component unmounts
    return () => {
      if (alarmAudio) {
        alarmAudio.stop();
        setAlarmAudio(null);
      }
    };
  }, [calculateTimeToNextHour, alarmAudio]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            resetTimer();
            return calculateTimeToNextHour();
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, resetTimer, calculateTimeToNextHour]);

  // Listen for preview popup events from settings
  useEffect(() => {
    const handlePreview = () => {
      generateQuote();
      playNotificationSound();
      setShowAlarm(true);
    };
    
    window.addEventListener('preview-hourly-popup', handlePreview);
    return () => window.removeEventListener('preview-hourly-popup', handlePreview);
  }, [generateQuote, playNotificationSound]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getNextHour = () => {
    const next = (currentHour + 1) % 24;
    return next === 0 ? 12 : next > 12 ? next - 12 : next;
  };

  const getAmPm = () => {
    const next = (currentHour + 1) % 24;
    return next >= 12 ? 'PM' : 'AM';
  };

  const progress = timeLeft > 0 ? ((3600 - timeLeft) / 3600) * 100 : 0;

  return (
    <>
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className={`w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}>
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Hourly Focus Timer</h2>
              <p className="text-blue-200 text-xs">Until {getNextHour()}:00 {getAmPm()}</p>
            </div>
          </div>
        </div>

        {/* Circular Progress Ring */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <svg className="transform -rotate-90 w-48 h-48" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.827} ${282.7 - progress * 2.827}`}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-white mb-2">
                {formatTime(timeLeft)}
              </div>
              <div className="text-blue-200 text-sm">
                {Math.floor(progress)}% complete
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 text-center">
          <p className="text-blue-200 text-sm">
            Automatically tracking your hourly progress
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white mb-1">{hoursTracked}</div>
            <div className="text-blue-200 text-xs leading-tight">Hours Active<br />Today</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="flex items-center justify-center text-2xl text-white">
              <Bell className="w-6 h-6 text-green-400 animate-pulse" />
            </div>
            <div className="text-blue-200 text-xs leading-tight mt-1">
              Always<br />Active
            </div>
          </div>
        </div>
      </div>

      {/* Alarm Modal */}
      {showAlarm && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking outside
            if (e.target === e.currentTarget) {
              dismissAlarm();
            }
          }}
        >
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl max-w-lg w-full">
            {/* Close button in top right */}
            <button
              onClick={dismissAlarm}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Hour Complete! 🎉</h3>
              
              {/* Time & Progress Info */}
              {(() => {
                const settings = JSON.parse(localStorage.getItem('hour-app-hourly-popup-settings') || '{}');
                return (settings.showHoursLeft || settings.showDayProgress);
              })() && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {(() => {
                    const settings = JSON.parse(localStorage.getItem('hour-app-hourly-popup-settings') || '{}');
                    return settings.showHoursLeft;
                  })() && (
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="text-2xl font-bold text-white">{getHoursLeftToday()}</div>
                      <div className="text-blue-200 text-sm">Hours Left Today</div>
                    </div>
                  )}
                  {(() => {
                    const settings = JSON.parse(localStorage.getItem('hour-app-hourly-popup-settings') || '{}');
                    return settings.showDayProgress;
                  })() && (
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="text-2xl font-bold text-white">{getDayProgress()}%</div>
                      <div className="text-blue-200 text-sm">Day Complete</div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Task Manager */}
              <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckSquare className="w-5 h-5 text-blue-400" />
                  <h4 className="text-white font-medium">Quick Tasks</h4>
                </div>
                <TaskManager
                  tasks={tasks}
                  onAddTask={onAddTask}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                  showQuickAdd={true}
                />
              </div>
              
              {/* Quote */}
              {(() => {
                const settings = JSON.parse(localStorage.getItem('hour-app-hourly-popup-settings') || '{}');
                return settings.showQuote && currentQuote;
              })() && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-6 border border-purple-500/30">
                  <p className="text-white italic leading-relaxed">
                    {currentQuote}
                  </p>
                  {(() => {
                    const settings = JSON.parse(localStorage.getItem('hour-app-hourly-popup-settings') || '{}');
                    return settings.useAI && settings.geminiApiKey;
                  })() && (
                    <div className="mt-2 flex items-center justify-center space-x-1">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-purple-300 text-xs">Generated by AI</span>
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-blue-200 mb-6">
                Ready to make the next hour count?
              </p>
              
              <button
                onClick={dismissAlarm}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Start Next Hour
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HourlyTimer;