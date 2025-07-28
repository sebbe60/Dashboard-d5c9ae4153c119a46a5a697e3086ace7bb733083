import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Sparkles, Clock, User, Target, Calendar } from 'lucide-react';
import { AIChatMessage, AIProfileSettings } from '../types';

interface AIChatWidgetProps {
  profileSettings: AIProfileSettings;
}

const AIChatWidget: React.FC<AIChatWidgetProps> = ({ profileSettings }) => {
  const [messages, setMessages] = useState<AIChatMessage[]>(() => {
    const saved = localStorage.getItem('ai-chat-messages');
    const savedDate = localStorage.getItem('ai-chat-last-date');
    const today = new Date().toDateString();
    
    // Reset messages if it's a new day
    if (savedDate !== today) {
      localStorage.setItem('ai-chat-last-date', today);
      localStorage.removeItem('ai-chat-messages');
      return [];
    }
    
    return saved ? JSON.parse(saved).map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    })) : [];
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastIntervalMessage, setLastIntervalMessage] = useState(() => {
    const saved = localStorage.getItem('ai-chat-last-interval');
    return saved ? new Date(saved) : null;
  });
  const [lastGreeting, setLastGreeting] = useState(() => {
    const saved = localStorage.getItem('ai-chat-last-greeting');
    return saved ? new Date(saved) : null;
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [nextCheckInTime, setNextCheckInTime] = useState<Date | null>(null);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('ai-chat-messages', JSON.stringify(messages));
  }, [messages]);

  // Save last interval time
  useEffect(() => {
    if (lastIntervalMessage) {
      localStorage.setItem('ai-chat-last-interval', lastIntervalMessage.toISOString());
    }
  }, [lastIntervalMessage]);

  // Save last greeting time
  useEffect(() => {
    if (lastGreeting) {
      localStorage.setItem('ai-chat-last-greeting', lastGreeting.toISOString());
    }
  }, [lastGreeting]);

  // Calculate next check-in time
  useEffect(() => {
    if (profileSettings.enabled && profileSettings.chatInterval > 0 && lastIntervalMessage) {
      const nextTime = new Date(lastIntervalMessage.getTime() + (profileSettings.chatInterval * 60 * 1000));
      setNextCheckInTime(nextTime);
    } else if (profileSettings.enabled && profileSettings.chatInterval > 0 && !lastIntervalMessage) {
      // If no previous message, next check-in is interval minutes from now
      const nextTime = new Date(Date.now() + (profileSettings.chatInterval * 60 * 1000));
      setNextCheckInTime(nextTime);
    } else {
      setNextCheckInTime(null);
    }
  }, [profileSettings.enabled, profileSettings.chatInterval, lastIntervalMessage]);

  const generateAIMessage = useCallback(async (type: 'greeting' | 'hourly' | 'interval') => {
    if (!profileSettings.enabled || !profileSettings.geminiApiKey) return;
    
    setIsGenerating(true);
    
    try {
      const hour = new Date().getHours();
      const dayProgress = Math.round((hour / 24) * 100);
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      
      let prompt = '';
      
      if (type === 'greeting') {
        prompt = `You're an AI productivity coach. Write a warm, personalized greeting for ${profileSettings.nickname || 'the user'} as they start their day/session.

Context:
- Name/Nickname: ${profileSettings.nickname || 'User'}
- Weekly Goals: ${profileSettings.weeklyGoals || 'Not specified'}
- Today's Focus: ${profileSettings.dailyFocus || 'Not specified'}
- Current time: ${timeOfDay} (${hour}:00)

Write a friendly, encouraging greeting that:
- Uses their nickname naturally
- References their goals/focus if provided
- Feels personal and motivating
- Is 1-2 sentences max
- Sounds conversational, not formal

Don't use quotation marks or rigid formatting. Just speak naturally as their AI coach.`;
      } else if (type === 'hourly') {
        prompt = `You're ${profileSettings.nickname || 'the user'}'s personal AI productivity coach. Write an hourly check-in message.

Context:
- Name/Nickname: ${profileSettings.nickname || 'User'}
- Weekly Goals: ${profileSettings.weeklyGoals || 'Not specified'}
- Today's Focus: ${profileSettings.dailyFocus || 'Not specified'}
- Current time: ${timeOfDay} (${hour}:00)
- Day progress: ${dayProgress}% complete

Write a brief, encouraging hourly check-in that:
- Uses their nickname naturally
- References their current focus/goals
- Acknowledges the time and progress
- Offers gentle motivation or a tip
- Is 1-2 sentences max
- Feels personal and supportive

Don't use quotation marks or rigid formatting. Just speak naturally as their supportive AI coach.`;
      } else {
        prompt = `You're ${profileSettings.nickname || 'the user'}'s personal AI productivity coach. Write a periodic check-in message.

Context:
- Name/Nickname: ${profileSettings.nickname || 'User'}
- Weekly Goals: ${profileSettings.weeklyGoals || 'Not specified'}
- Today's Focus: ${profileSettings.dailyFocus || 'Not specified'}
- Current time: ${timeOfDay} (${hour}:00)
- Day progress: ${dayProgress}% complete

Write a supportive check-in message that:
- Uses their nickname naturally
- References their goals and current focus
- Offers encouragement or a productivity tip
- Feels timely and relevant
- Is 1-2 sentences max
- Sounds like a caring coach

Don't use quotation marks or rigid formatting. Just speak naturally as their AI productivity partner.`;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${profileSettings.geminiApiKey}`, {
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
        const aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiContent) {
          const newMessage: AIChatMessage = {
            id: Date.now().toString(),
            content: aiContent.replace(/"/g, '').trim(),
            timestamp: new Date(),
            type
          };
          
          setMessages(prev => [...prev, newMessage]);
          
          if (type === 'interval') {
            setLastIntervalMessage(new Date());
            // Update next check-in time
            const nextTime = new Date(Date.now() + (profileSettings.chatInterval * 60 * 1000));
            setNextCheckInTime(nextTime);
          } else if (type === 'greeting') {
          // Update next check-in time
          const nextTime = new Date(Date.now() + (profileSettings.chatInterval * 60 * 1000));
          setNextCheckInTime(nextTime);
            setLastGreeting(new Date());
          }
        }
      }
    } catch (error) {
      console.warn('AI message generation failed:', error);
      
      // Fallback messages
      const fallbackMessages = {
        greeting: `Hey ${profileSettings.nickname || 'there'}! Ready to tackle your goals today?`,
        hourly: `${profileSettings.nickname || 'Hey'}, you're ${dayProgress}% through the day. Keep that momentum going!`,
        interval: `Hope you're making great progress on your focus areas, ${profileSettings.nickname || 'friend'}!`
      };
      
      const newMessage: AIChatMessage = {
        id: Date.now().toString(),
        content: fallbackMessages[type],
        timestamp: new Date(),
        type
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      if (type === 'interval') {
        setLastIntervalMessage(new Date());
      } else if (type === 'greeting') {
        setLastGreeting(new Date());
      }
    } finally {
      setIsGenerating(false);
    }
  }, [profileSettings]);

  // Generate greeting on first load or when settings change
  useEffect(() => {
    if (!isInitialized && profileSettings.enabled && profileSettings.geminiApiKey) {
      const now = new Date();
      const shouldSendGreeting = !lastGreeting || 
        (now.getTime() - lastGreeting.getTime()) > (24 * 60 * 60 * 1000); // 24 hours
      
      if (shouldSendGreeting && messages.length === 0) {
        generateAIMessage('greeting');
      }
      setIsInitialized(true);
    }
  }, [profileSettings.enabled, profileSettings.geminiApiKey, isInitialized, lastGreeting, messages.length, generateAIMessage]);

  // Check for interval messages
  useEffect(() => {
    if (!profileSettings.enabled || !profileSettings.geminiApiKey || profileSettings.chatInterval <= 0) return;
    if (!isInitialized) return; // Don't run until initialized
    
    const checkInterval = () => {
      const now = new Date();
      const intervalMs = profileSettings.chatInterval * 60 * 1000; // Convert minutes to milliseconds
      
      if (!lastIntervalMessage || (now.getTime() - lastIntervalMessage.getTime()) >= intervalMs) {
        generateAIMessage('interval');
      }
    };
    
    // Wait a bit before starting interval checks to avoid conflicts with greeting
    const timeout = setTimeout(() => {
      checkInterval();
      
      // Then check every minute
      const interval = setInterval(checkInterval, 60000);
      
      return () => clearInterval(interval);
    }, 5000); // Wait 5 seconds after initialization
    
    return () => clearTimeout(timeout);
  }, [profileSettings, lastIntervalMessage, isInitialized, generateAIMessage]);

  // Listen for hourly triggers
  useEffect(() => {
    const handleHourlyTrigger = () => {
      if (profileSettings.enabled && profileSettings.geminiApiKey) {
        generateAIMessage('hourly');
      }
    };
    
    window.addEventListener('hourly-ai-chat', handleHourlyTrigger);
    return () => window.removeEventListener('hourly-ai-chat', handleHourlyTrigger);
  }, [profileSettings, generateAIMessage]);

  if (!profileSettings.enabled) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">AI Chat Disabled</h3>
          <p className="text-blue-200 text-sm">
            Enable AI Chat in Settings to get personalized coaching messages
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-purple-500/30 shadow-lg">
            <img 
              src="/7904424933cc535b666f2de669973530.gif" 
              alt="AI Coach" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Coach</h2>
            <p className="text-blue-200 text-sm">
              {profileSettings.nickname ? `Coaching ${profileSettings.nickname}` : 'Personal AI Coach'}
            </p>
          </div>
        </div>
        
        {isGenerating && (
          <div className="flex items-center space-x-2 text-purple-300">
            <div className="w-4 h-4 rounded-full overflow-hidden border border-purple-400/50">
              <img 
                src="/7904424933cc535b666f2de669973530.gif" 
                alt="AI Thinking" 
                className="w-full h-full object-cover opacity-75"
              />
            </div>
            <span className="text-sm">Thinking...</span>
          </div>
        )}
      </div>

      {/* Profile Summary */}
      {(profileSettings.weeklyGoals || profileSettings.dailyFocus) && (
        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="space-y-3">
            {profileSettings.weeklyGoals && (
              <div className="flex items-start space-x-3">
                <Target className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white text-sm font-medium">Weekly Goals</div>
                  <div className="text-blue-200 text-xs">{profileSettings.weeklyGoals}</div>
                </div>
              </div>
            )}
            {profileSettings.dailyFocus && (
              <div className="flex items-start space-x-3">
                <Calendar className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white text-sm font-medium">Today's Focus</div>
                  <div className="text-blue-200 text-xs">{profileSettings.dailyFocus}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {messages.length === 0 && !isGenerating ? (
          <div className="text-center py-8 text-blue-200">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Your AI coach will appear here with personalized messages</p>
          </div>
        ) : (
          [...messages].reverse().map((message) => (
            <div key={message.id} className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full overflow-hidden border border-purple-400/50">
                    <img 
                      src="/7904424933cc535b666f2de669973530.gif" 
                      alt="AI Coach" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-purple-300 text-sm font-medium">AI Coach</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-purple-300">
                  {message.type === 'greeting' && <User className="w-3 h-3" />}
                  {message.type === 'hourly' && <Clock className="w-3 h-3" />}
                  {message.type === 'interval' && <MessageCircle className="w-3 h-3" />}
                  <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <p className="text-white leading-relaxed">{message.content}</p>
            </div>
          ))
        )}
        
        {isGenerating && (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="text-purple-300 text-sm">AI Coach is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Next Message Info */}
      {profileSettings.chatInterval > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-blue-200">
            <span>
              Next check-in: {nextCheckInTime ? nextCheckInTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }) : 'Calculating...'}
            </span>
            <span>{messages.length} messages today</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatWidget;