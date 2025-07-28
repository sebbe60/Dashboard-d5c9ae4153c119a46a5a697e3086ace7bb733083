export interface Task {
  id: string;
  title: string;
  description?: string;
  importance: 'low' | 'medium' | 'high' | 'urgent';
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  category?: string;
}

export interface PomodoroSession {
  id: string;
  workMinutes: number;
  breakMinutes: number;
  cycles: number;
  completedCycles: number;
  startTime: Date;
  endTime?: Date;
  tasks: string[];
  isActive: boolean;
}

export interface Quote {
  text: string;
  author: string;
  category: 'time' | 'productivity' | 'motivation';
}

export interface WidgetSettings {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  size: 1 | 2 | 3; // 1 = single widget, 2 = half width, 3 = full width
}

export interface ImageGalleryItem {
  id: string;
  url: string;
  name: string;
  addedAt: Date;
}

export interface HourlyPopupSettings {
  enabled: boolean;
  showHoursLeft: boolean;
  showDayProgress: boolean;
  showQuote: boolean;
  quoteStyle: 'motivational' | 'time-focused' | 'productivity';
  aiEnabled: boolean;
  geminiApiKey: string;
}

export interface AIProfileSettings {
  nickname: string;
  weeklyGoals: string;
  dailyFocus: string;
  chatInterval: number; // minutes
  enabled: boolean;
  geminiApiKey: string;
}

export interface AIChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  type: 'greeting' | 'hourly' | 'interval';
}

export interface BackgroundSettings {
  type: 'default' | 'preset' | 'custom';
  presetUrl?: string;
  customUrl?: string;
  opacity: number; // 0-100
  blur: number; // 0-20
}