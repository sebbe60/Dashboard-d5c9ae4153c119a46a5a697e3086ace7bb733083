import React from 'react';
import { Clock, Target, Timer, CheckSquare, Settings } from 'lucide-react';

interface NavigationProps {
  activeTab: 'hourly' | 'tasks' | 'pomodoro' | 'settings';
  onTabChange: (tab: 'hourly' | 'tasks' | 'pomodoro' | 'settings') => void;
  settingsIcon: React.ComponentType<any>;
}

export default function Navigation({ activeTab, onTabChange, settingsIcon: SettingsIcon }: NavigationProps) {
  const tabs = [
    { id: 'hourly', label: 'Hourly Focus', icon: Clock },
    { id: 'tasks', label: 'Task Manager', icon: CheckSquare },
    { id: 'pomodoro', label: 'Routine Timer', icon: Timer },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <nav className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
            ${activeTab === id
              ? 'bg-white text-blue-900 shadow-sm'
              : 'text-blue-100 hover:text-white hover:bg-white/10'
            }
          `}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </nav>
  );
}