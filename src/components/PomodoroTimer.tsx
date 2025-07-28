import React, { useState, useEffect, useCallback } from 'react';
import { Timer, Play, Pause, RotateCcw, Coffee, Zap, Settings, CheckSquare } from 'lucide-react';
import { Task, PomodoroSession } from '../types';

interface PomodoroTimerProps {
  tasks: Task[];
  onAddSession: (session: Omit<PomodoroSession, 'id'>) => void;
  sessions: PomodoroSession[];
}

const presets = [
  { name: 'Power Sprint', work: 5, break: 15 },
  { name: 'Flow State', work: 5, break: 20 },
  { name: 'Deep Dive', work: 5, break: 25 },
];

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ tasks, onAddSession, sessions }) => {
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(() => {
    const saved = localStorage.getItem('pomodoro-current-session');
    return saved ? JSON.parse(saved) : null;
  });
  const [showSessionLog, setShowSessionLog] = useState(false);
  const [sessionLog, setSessionLog] = useState<Array<{
    type: 'work' | 'break';
    startTime: Date;
    duration: number;
  }>>(() => {
    const saved = localStorage.getItem('focus-engine-session-log');
    const log = saved ? JSON.parse(saved) : [];
    // Filter to only today's entries
    const today = new Date().toDateString();
    return log.filter((entry: any) => new Date(entry.startTime).toDateString() === today);
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isWorkTime, setIsWorkTime] = useState(true);
  const [phaseStartTime, setPhaseStartTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('pomodoro-phase-start-time');
    return saved ? new Date(saved) : null;
  });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [soundSettings, setSoundSettings] = useState(() => {
    const saved = localStorage.getItem('pomodoro-sound-settings');
    return saved ? JSON.parse(saved) : { type: 'pling', duration: 'single', customSound: null };
  });
  const [currentAudio, setCurrentAudio] = useState<{ stop: () => void } | null>(null);
  const [selectedSoundFile, setSelectedSoundFile] = useState<File | null>(null);
  const [isUploadingSound, setIsUploadingSound] = useState(false);

  // Initialize timer state from localStorage on mount
  useEffect(() => {
    // Request notification permission on component mount
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Enable audio context for cross-tab audio (user interaction required)
    const enableAudio = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      audioContext.close();
      
      // Remove the listener after first interaction
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
    
    // Add listeners for user interaction to enable audio
    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    
    const savedSession = localStorage.getItem('pomodoro-current-session');
    const savedPhaseStartTime = localStorage.getItem('pomodoro-phase-start-time');
    const savedIsActive = localStorage.getItem('pomodoro-is-active');
    const savedIsWorkTime = localStorage.getItem('pomodoro-is-work-time');
    
    if (savedSession && savedPhaseStartTime && savedIsActive && savedIsWorkTime) {
      const session = JSON.parse(savedSession);
      const startTime = new Date(savedPhaseStartTime);
      const active = JSON.parse(savedIsActive);
      const workTime = JSON.parse(savedIsWorkTime);
      
      setCurrentSession(session);
      setPhaseStartTime(startTime);
      setIsActive(active);
      setIsWorkTime(workTime);
      
      if (active) {
        // Calculate how much time should be left based on real time elapsed
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const totalPhaseTime = workTime ? session.workMinutes * 60 : session.breakMinutes * 60;
        const remainingTime = Math.max(0, totalPhaseTime - elapsedSeconds);
        
        setTimeLeft(remainingTime);
        
        // If time has already elapsed, trigger phase switch
        if (remainingTime <= 0) {
          setTimeout(() => switchPhase(), 100);
        }
      }
    }
    
    // Cleanup function
    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
  }, []);

  // Save pomodoro state to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro-current-session', JSON.stringify(currentSession));
  }, [currentSession]);

  useEffect(() => {
    localStorage.setItem('pomodoro-is-active', JSON.stringify(isActive));
  }, [isActive]);

  useEffect(() => {
    localStorage.setItem('pomodoro-is-work-time', JSON.stringify(isWorkTime));
  }, [isWorkTime]);

  useEffect(() => {
    if (phaseStartTime) {
      localStorage.setItem('pomodoro-phase-start-time', phaseStartTime.toISOString());
    }
  }, [phaseStartTime]);

  // Save sound settings to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro-sound-settings', JSON.stringify(soundSettings));
  }, [soundSettings]);

  // Save session log to localStorage
  useEffect(() => {
    localStorage.setItem('focus-engine-session-log', JSON.stringify(sessionLog));
  }, [sessionLog]);

  const handleSoundFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedSoundFile(file);
    }
  };

  const handleUploadSound = () => {
    if (selectedSoundFile) {
      setIsUploadingSound(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result) {
          setSoundSettings(prev => ({ ...prev, customSound: result as string }));
          setSelectedSoundFile(null);
          setIsUploadingSound(false);
        }
      };
      reader.readAsDataURL(selectedSoundFile);
    }
  };

  const completeSession = useCallback(() => {
    if (!currentSession) return;
    
    playNotificationSound();
    
    // Update the session with end time
    const updatedSession = {
      ...currentSession,
      endTime: new Date(),
      isActive: false
    };
    
    // Clear current session
    setCurrentSession(null);
    setIsActive(false);
    setTimeLeft(0);
    setIsWorkTime(true);
    
    // Clear localStorage
    localStorage.removeItem('pomodoro-current-session');
    localStorage.removeItem('pomodoro-time-left');
    localStorage.removeItem('pomodoro-is-active');
    localStorage.removeItem('pomodoro-is-work-time');
    
    if (Notification.permission === 'granted') {
      new Notification('Session Complete!', {
        body: `Great job! You completed ${updatedSession.completedCycles} cycles.`,
        icon: '/vite.svg'
      });
    }
  }, [currentSession]);

  const playNotificationSound = useCallback(() => {
    // Stop any existing sound
    if (currentAudio) {
      currentAudio.stop();
    }

    // Force audio context to be active for cross-tab playback
    const enableAudioContext = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      return audioContext;
    };
    let audioController: { stop: () => void };
    
    if (soundSettings.type === 'bleep') {
      // Create a simple bleep sound
      const audioContext = enableAudioContext();
      let isPlaying = true;
      
      const createBleep = (startTime: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, startTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.5, startTime); // Louder for cross-tab
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.5);
      };
      
      const playBleepSequence = () => {
        if (!isPlaying) return;
        
        createBleep(audioContext.currentTime);
        
        // Schedule next bleep if looping or duration-based
        if (soundSettings.duration === 'loop' || parseInt(soundSettings.duration) > 1) {
          setTimeout(() => {
            if (isPlaying) {
              playBleepSequence();
            }
          }, 1000); // Repeat every 1 second
        }
      };
      
      playBleepSequence();
      
      // Handle duration-based stopping
      if (soundSettings.duration !== 'single' && soundSettings.duration !== 'loop') {
        const duration = parseInt(soundSettings.duration) * 1000;
        setTimeout(() => {
          isPlaying = false;
        }, duration);
      } else if (soundSettings.duration === 'single') {
        setTimeout(() => {
          isPlaying = false;
        }, 500); // Single bleep lasts 0.5 seconds
      }
      
      audioController = {
        stop: () => {
          isPlaying = false;
          if (audioContext.state !== 'closed') {
            audioContext.close();
          }
        }
      };
    } else if (soundSettings.type === 'alarm') {
      // Create a loud alarm sound with multiple tones
      const audioContext = enableAudioContext();
      let isPlaying = true;
      
      const createAlarmBeep = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'square'; // Harsher sound for alarm
        
        gainNode.gain.setValueAtTime(0.8, startTime); // Even louder for cross-tab
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const playAlarmSequence = () => {
        if (!isPlaying) return;
        
        // Create urgent alarm pattern: high-low-high-low
        createAlarmBeep(1000, audioContext.currentTime, 0.2);
        createAlarmBeep(800, audioContext.currentTime + 0.25, 0.2);
        createAlarmBeep(1000, audioContext.currentTime + 0.5, 0.2);
        createAlarmBeep(800, audioContext.currentTime + 0.75, 0.2);
        
        // Schedule next sequence if looping
        if (soundSettings.duration === 'loop' || parseInt(soundSettings.duration) > 1) {
          setTimeout(() => {
            if (isPlaying) {
              playAlarmSequence();
            }
          }, 1200); // Repeat every 1.2 seconds
        }
      };
      
      playAlarmSequence();
      
      // Handle duration-based stopping
      if (soundSettings.duration !== 'single' && soundSettings.duration !== 'loop') {
        const duration = parseInt(soundSettings.duration) * 1000;
        setTimeout(() => {
          isPlaying = false;
        }, duration);
      } else if (soundSettings.duration === 'single') {
        setTimeout(() => {
          isPlaying = false;
        }, 1000); // Single alarm sequence lasts 1 second
      }
      
      audioController = {
        stop: () => {
          isPlaying = false;
          if (audioContext.state !== 'closed') {
            audioContext.close();
          }
        }
      };
    } else if (soundSettings.type === 'custom' && soundSettings.customSound) {
      // Handle custom uploaded sound
      const audio = new Audio(soundSettings.customSound);
      audio.volume = 0.8; // Louder for cross-tab
      let isPlaying = true;
      let playInterval: NodeJS.Timeout | null = null;
      
      const playCustomSound = () => {
        if (!isPlaying) return;
        
        audio.currentTime = 0;
        // Force play even in background tabs
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Fallback if audio fails to play
            console.warn('Custom audio failed to play');
          });
        }
        
        // Schedule next play if looping or duration-based
        if (soundSettings.duration === 'loop') {
          // For loop, wait for audio to end then replay
          audio.onended = () => {
            if (isPlaying) {
              setTimeout(playCustomSound, 100); // Small delay between loops
            }
          };
        } else if (soundSettings.duration !== 'single') {
          // For timed duration, replay every audio duration + small gap
          audio.onloadedmetadata = () => {
            const audioDuration = Math.max(audio.duration * 1000, 1000); // At least 1 second
            playInterval = setInterval(() => {
              if (isPlaying) {
                audio.currentTime = 0;
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                  playPromise.catch(() => {});
                }
              }
            }, audioDuration + 200); // Small gap between replays
          };
        }
      };
      
      playCustomSound();
      
      // Handle duration-based stopping
      if (soundSettings.duration !== 'single' && soundSettings.duration !== 'loop') {
        const duration = parseInt(soundSettings.duration) * 1000;
        setTimeout(() => {
          isPlaying = false;
          if (playInterval) clearInterval(playInterval);
        }, duration);
      }
      
      audioController = {
        stop: () => {
          isPlaying = false;
          audio.pause();
          audio.currentTime = 0;
          if (playInterval) clearInterval(playInterval);
        }
      };
    } else {
      // Default hotel pling sound
      const audioContext = enableAudioContext();
      let isPlaying = true;
      
      const createPling = (startTime: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, startTime); // C5 note
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.5, startTime); // Louder for cross-tab
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 1);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 1);
      };
      
      const playPlingSequence = () => {
        if (!isPlaying) return;
        
        createPling(audioContext.currentTime);
        
        // Schedule next pling if looping or duration-based
        if (soundSettings.duration === 'loop' || parseInt(soundSettings.duration) > 1) {
          setTimeout(() => {
            if (isPlaying) {
              playPlingSequence();
            }
          }, 1500); // Repeat every 1.5 seconds
        }
      };
      
      playPlingSequence();
      
      // Handle duration-based stopping
      if (soundSettings.duration !== 'single' && soundSettings.duration !== 'loop') {
        const duration = parseInt(soundSettings.duration) * 1000;
        setTimeout(() => {
          isPlaying = false;
        }, duration);
      } else if (soundSettings.duration === 'single') {
        setTimeout(() => {
          isPlaying = false;
        }, 1000); // Single pling lasts 1 second
      }
      
      audioController = {
        stop: () => {
          isPlaying = false;
          if (audioContext.state !== 'closed') {
            audioContext.close();
          }
        }
      };
    }

    setCurrentAudio(audioController);
  }, [soundSettings, currentAudio]);

  const startNewSession = useCallback((workMinutes: number, breakMinutes: number) => {
    const session: Omit<PomodoroSession, 'id'> = {
      workMinutes,
      breakMinutes,
      cycles: 999, // Set high number for continuous mode
      completedCycles: 0,
      startTime: new Date(),
      tasks: selectedTasks,
      isActive: true
    };
    
    onAddSession(session);
    const newSession = { ...session, id: Date.now().toString() };
    const now = new Date();
    
    setCurrentSession(newSession);
    setPhaseStartTime(now);
    setTimeLeft(workMinutes * 60);
    setIsWorkTime(true);
    setIsActive(true);
  }, [selectedTasks, onAddSession]);

  const switchPhase = useCallback(() => {
    if (!currentSession) return;
    
    const now = new Date();
    
    if (isWorkTime) {
      // Work time finished, start break
      setSessionLog(prev => [...prev, {
        type: 'work',
        startTime: now,
        duration: currentSession.workMinutes
      }]);
      
      setIsWorkTime(false);
      setPhaseStartTime(now);
      setTimeLeft(currentSession.breakMinutes * 60);
      
      // Play sound immediately when phase switches
      setTimeout(() => playNotificationSound(), 100);
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('Break Time!', {
          body: `Take a ${currentSession.breakMinutes} minute break. You've earned it!`,
          icon: '/vite.svg'
        });
      }
    } else {
      // Break finished, check if we should start another cycle or complete session
      setSessionLog(prev => [...prev, {
        type: 'break',
        startTime: now,
        duration: currentSession.breakMinutes
      }]);
      
      // Start new work cycle
      setCurrentSession(prev => prev ? { ...prev, completedCycles: prev.completedCycles + 1 } : null);
      setIsWorkTime(true);
      setPhaseStartTime(now);
      setTimeLeft(currentSession.workMinutes * 60);
      
      // Play sound immediately when phase switches
      setTimeout(() => playNotificationSound(), 100);
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('Back to Work!', {
          body: 'Starting your next work session. Keep the momentum going!',
          icon: '/vite.svg'
        });
      }
    }
  }, [currentSession, isWorkTime, playNotificationSound, setSessionLog]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && currentSession && phaseStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - phaseStartTime.getTime()) / 1000);
        const totalPhaseTime = isWorkTime ? currentSession.workMinutes * 60 : currentSession.breakMinutes * 60;
        const remainingTime = Math.max(0, totalPhaseTime - elapsedSeconds);
        
        setTimeLeft(remainingTime);
        
        if (remainingTime <= 0) {
          switchPhase();
        }
      }, 1000);
    } else if (isActive && timeLeft > 0) {
      // Fallback for edge cases where phaseStartTime might not be set
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            switchPhase();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, currentSession, phaseStartTime, isWorkTime, switchPhase]);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!currentSession) return 0;
    const totalTime = isWorkTime ? currentSession.workMinutes * 60 : currentSession.breakMinutes * 60;
    return timeLeft > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  };

  const resetTimer = () => {
    // Stop any playing sound
    if (currentAudio) {
      currentAudio.stop();
      setCurrentAudio(null);
    }
    
    // Clear localStorage when resetting
    localStorage.removeItem('pomodoro-current-session');
    localStorage.removeItem('pomodoro-phase-start-time');
    localStorage.removeItem('pomodoro-is-active');
    localStorage.removeItem('pomodoro-is-work-time');
    
    setCurrentSession(null);
    setPhaseStartTime(null);
    setIsActive(false);
    setTimeLeft(0);
    setIsWorkTime(true);
  };

  const availableTasks = tasks.filter(t => !t.completed);
  const completedToday = sessions.filter(s => 
    new Date(s.startTime).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Main Timer */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isWorkTime 
                ? 'bg-gradient-to-r from-red-500 to-pink-600' 
                : 'bg-gradient-to-r from-green-500 to-teal-600'
            } ${isActive ? 'animate-pulse' : ''}`}>
              {isWorkTime ? <Zap className="w-6 h-6 text-white" /> : <Coffee className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {currentSession 
                  ? isWorkTime 
                    ? 'Work Time' 
                    : 'Break Time'
                  : 'Routine Timer'
                }
              </h2>
            </div>
          </div>
        </div>

        {/* Timer Display */}
        <div className="relative w-56 h-56 mx-auto mb-8">
          <svg className="transform -rotate-90 w-56 h-56" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={isWorkTime ? "url(#workGradient)" : "url(#breakGradient)"}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${getProgress() * 2.827} ${282.7 - getProgress() * 2.827}`}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="workGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
              <linearGradient id="breakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#14B8A6" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-mono font-bold text-white mb-2">
                {formatTime(timeLeft)}
              </div>
              <div className="text-blue-200 text-sm">
                {Math.floor(getProgress())}% complete
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {!currentSession ? (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 border border-white/20"
            >
              <Settings className="w-5 h-5" />
              <span>Setup Session</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsActive(!isActive)}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105
                  ${isActive 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25' 
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25'
                  }
                `}
              >
                {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{isActive ? 'Pause' : 'Resume'}</span>
              </button>
              
              <button
                onClick={resetTimer}
                className="flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 border border-white/20"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Reset</span>
              </button>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white mb-1">{completedToday}</div>
            <div className="text-blue-200 text-xs leading-tight">Today's Sessions</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white">
              {sessionLog.filter(s => s.type === 'work').length}
            </div>
            <div className="text-blue-200 text-xs leading-tight mt-1">Work Sessions</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white">
              {sessionLog.filter(s => s.type === 'work').reduce((total, s) => total + s.duration, 0)}
            </div>
            <div className="text-blue-200 text-xs leading-tight mt-1">Minutes Focused</div>
          </div>
        </div>
      </div>

      {/* Expandable Session Log */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
        <button
          onClick={() => setShowSessionLog(!showSessionLog)}
          className="w-full p-4 flex items-center justify-between text-white hover:bg-white/5 transition-colors rounded-2xl"
        >
          <span className="font-medium">Today's Focus Log</span>
          <svg 
            className={`w-5 h-5 transition-transform ${showSessionLog ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showSessionLog && (
          <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
            {sessionLog.length === 0 ? (
              <div className="text-center py-4 text-blue-200">
                <p>No focus sessions logged today yet.</p>
              </div>
            ) : (
              [...sessionLog].reverse().map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      entry.type === 'work' ? 'bg-red-400' : 'bg-green-400'
                    }`} />
                    <span className="text-white font-medium capitalize">
                      {entry.type} Session
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm">
                      {new Date(entry.startTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className="text-blue-200 text-xs">
                      {entry.duration}m duration
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {/* Setup Panel */}
      {showSettings && !currentSession && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl space-y-6">
          <h3 className="text-xl font-bold text-white">Setup Your Session</h3>
          
          {/* Presets */}
          <div>
            <h4 className="text-white font-medium mb-3">Quick Presets</h4>
            <div className="grid grid-cols-3 gap-3">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => startNewSession(preset.work, preset.break)}
                  className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all duration-200 transform hover:scale-105 text-center min-h-[80px] flex flex-col justify-center"
                >
                  <div className="font-medium text-sm leading-tight mb-1 break-words">{preset.name}</div>
                  <div className="text-xs text-blue-200 whitespace-nowrap">{preset.work}m/{preset.break}m</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Settings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white font-medium mb-2 text-sm">Work Minutes</label>
              <input
                type="number"
                min="1"
                max="120"
                value={customWork}
                onChange={(e) => setCustomWork(parseInt(e.target.value) || 25)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2 text-sm">Break Minutes</label>
              <input
                type="number"
                min="1"
                max="60"
                value={customBreak}
                onChange={(e) => setCustomBreak(parseInt(e.target.value) || 5)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Sound Settings */}
          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Sound Settings</h4>
            <div className="space-y-4">
              {/* Custom Sound Upload */}
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Custom Sound</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleSoundFileSelect}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-purple-500 file:text-white hover:file:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  {selectedSoundFile && (
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-xs">
                      <span className="text-blue-200 text-sm">
                        {selectedSoundFile.name} ({(selectedSoundFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      <button
                        type="button"
                        onClick={handleUploadSound}
                        disabled={isUploadingSound}
                        className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs transition-all duration-200"
                      >
                        {isUploadingSound ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  )}
                  {soundSettings.customSound && (
                    <div className="p-2 bg-green-500/20 border border-green-500/30 rounded-lg text-xs">
                      <span className="text-green-400">✓ Custom sound uploaded</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Sound Type</label>
                <select
                  value={soundSettings.type}
                  onChange={(e) => setSoundSettings(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-gray-800 [&>option]:text-white text-sm"
                >
                  <option value="pling">Hotel Pling</option>
                  <option value="bleep">Simple Bleep</option>
                  <option value="alarm">Loud Alarm</option>
                  {soundSettings.customSound && (
                    <option value="custom">Custom Sound</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Sound Duration</label>
                <select
                  value={soundSettings.duration}
                  onChange={(e) => setSoundSettings(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-gray-800 [&>option]:text-white text-sm"
                >
                  <option value="single">Single Sound</option>
                  <option value="3">3 Seconds</option>
                  <option value="5">5 Seconds</option>
                  <option value="10">10 Seconds</option>
                  <option value="loop">Loop Until Dismissed</option>
                </select>
              </div>
              </div>
            </div>
            <button
              type="button"
              onClick={playNotificationSound}
              className="mt-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 text-xs"
            >
              Test Sound
            </button>
          </div>

          {/* Task Selection */}
          {availableTasks.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-3 text-sm">Select Tasks for This Session</h4>
              <div className="grid grid-cols-1 gap-2 max-h-24 overflow-y-auto">
                {availableTasks.map((task) => (
                  <label key={task.id} className="flex items-center space-x-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTasks([...selectedTasks, task.id]);
                        } else {
                          setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-500 rounded"
                    />
                    <span className="text-white text-xs">{task.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => startNewSession(customWork, customBreak)}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg py-2 px-4 font-medium transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
          >
            Start Custom Session
          </button>
          <div className="text-center text-blue-200 text-xs mt-2">
            {customWork}m work / {customBreak}m break × continuous cycles
          </div>
        </div>
      )}

      {/* Session History */}
      {sessions.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">Recent Sessions</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {sessions.slice(-5).map((session) => (
              <div key={session.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Timer className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-medium">
                      {session.workMinutes}m / {session.breakMinutes}m
                    </span>
                  </div>
                  <span className="text-blue-200 text-sm">
                    {new Date(session.startTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200">
                    {session.completedCycles} work sessions completed
                  </span>
                  {session.tasks.length > 0 && (
                    <span className="text-green-400">
                      {session.tasks.length} tasks
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;