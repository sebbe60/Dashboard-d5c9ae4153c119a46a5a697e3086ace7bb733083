import React, { useState } from 'react';
import { Settings as SettingsIcon, GripVertical, Eye, EyeOff, RotateCcw, Clock, Sparkles, TestTube, MessageCircle, User, Target, Calendar, Image, Upload, Palette } from 'lucide-react';
import { WidgetSettings, HourlyPopupSettings, AIProfileSettings, BackgroundSettings } from '../types';

interface SettingsProps {
  widgetSettings: WidgetSettings[];
  onUpdateWidgetSettings: (settings: WidgetSettings[]) => void;
  hourlyPopupSettings: HourlyPopupSettings;
  onUpdateHourlyPopupSettings: (settings: HourlyPopupSettings) => void;
  aiProfileSettings: AIProfileSettings;
  onUpdateAIProfileSettings: (settings: AIProfileSettings) => void;
  backgroundSettings: BackgroundSettings;
  onUpdateBackgroundSettings: (settings: BackgroundSettings) => void;
  testAIConnection: () => void;
  testingAI: boolean;
}

const Settings: React.FC<SettingsProps> = ({ 
  widgetSettings, 
  onUpdateWidgetSettings,
  hourlyPopupSettings,
  onUpdateHourlyPopupSettings,
  aiProfileSettings,
  onUpdateAIProfileSettings,
  backgroundSettings,
  onUpdateBackgroundSettings,
  testAIConnection,
  testingAI
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [selectedBackgroundFile, setSelectedBackgroundFile] = useState<File | null>(null);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);

  // Preset backgrounds
  const presetBackgrounds = [
    {
      name: 'Mountain Landscape',
      url: 'https://cdn.wallpapersafari.com/57/80/LQTts9.jpg',
      thumbnail: 'https://cdn.wallpapersafari.com/57/80/LQTts9.jpg'
    },
    {
      name: 'Ocean Waves',
      url: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1920',
      thumbnail: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Forest Path',
      url: 'https://images.pexels.com/photos/1496373/pexels-photo-1496373.jpeg?auto=compress&cs=tinysrgb&w=1920',
      thumbnail: 'https://images.pexels.com/photos/1496373/pexels-photo-1496373.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'City Skyline',
      url: 'https://images.pexels.com/photos/374870/pexels-photo-374870.jpeg?auto=compress&cs=tinysrgb&w=1920',
      thumbnail: 'https://images.pexels.com/photos/374870/pexels-photo-374870.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Desert Sunset',
      url: 'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=1920',
      thumbnail: 'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Northern Lights',
      url: 'https://images.pexels.com/photos/1933239/pexels-photo-1933239.jpeg?auto=compress&cs=tinysrgb&w=1920',
      thumbnail: 'https://images.pexels.com/photos/1933239/pexels-photo-1933239.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedItem(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      return;
    }

    const newSettings = [...widgetSettings];
    const draggedIndex = newSettings.findIndex(w => w.id === draggedItem);
    const targetIndex = newSettings.findIndex(w => w.id === targetId);
    
    // Swap the order values
    const draggedOrder = newSettings[draggedIndex].order;
    newSettings[draggedIndex].order = newSettings[targetIndex].order;
    newSettings[targetIndex].order = draggedOrder;
    
    // Sort by order to maintain consistency
    newSettings.sort((a, b) => a.order - b.order);
    
    onUpdateWidgetSettings(newSettings);
    setDraggedItem(null);
  };

  const toggleWidget = (widgetId: string) => {
    const newSettings = widgetSettings.map(widget =>
      widget.id === widgetId 
        ? { ...widget, enabled: !widget.enabled }
        : widget
    );
    onUpdateWidgetSettings(newSettings);
  };

  const resetToDefaults = () => {
    const defaultSettings: WidgetSettings[] = [
      { id: 'quote', name: 'Inspirational Quote', enabled: true, order: 0, size: 3 },
      { id: 'personal-greeting', name: 'Personal Greeting', enabled: true, order: 1, size: 1 },
      { id: 'hourly-timer', name: 'Hourly Focus Timer', enabled: true, order: 2, size: 1 },
      { id: 'pomodoro', name: 'Pomodoro Timer', enabled: true, order: 3, size: 1 },
      { id: 'image-gallery', name: 'Image Gallery', enabled: true, order: 4, size: 1 },
      { id: 'ai-chat', name: 'AI Chat Coach', enabled: true, order: 5, size: 1 },
      { id: 'time-counters', name: 'Hours Left Counters', enabled: true, order: 6, size: 3 },
    ];
    onUpdateWidgetSettings(defaultSettings);
  };

  const handleBackgroundFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB.');
        return;
      }
      
      setSelectedBackgroundFile(file);
    }
  };

  const handleUploadBackground = () => {
    if (!selectedBackgroundFile) return;
    
    setIsUploadingBackground(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onUpdateBackgroundSettings({
          ...backgroundSettings,
          type: 'custom',
          customUrl: result
        });
        setSelectedBackgroundFile(null);
      }
      setIsUploadingBackground(false);
    };
    
    reader.onerror = () => {
      setIsUploadingBackground(false);
      alert('Error reading file. Please try again.');
    };
    
    reader.readAsDataURL(selectedBackgroundFile);
  };

  const sortedWidgets = [...widgetSettings].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Dashboard Settings</h2>
              <p className="text-blue-200 text-sm">Customize your widget layout and preferences</p>
            </div>
          </div>
          
          <button
            onClick={resetToDefaults}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 border border-white/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Widget Management</h3>
            <p className="text-blue-200 text-sm mb-6">
              Drag and drop to reorder widgets. Toggle visibility with the eye icon. 
              Widgets marked as "Full Width" will take up the entire row.
            </p>
          </div>

          <div className="space-y-3">
            {sortedWidgets.map((widget) => (
              <div
                key={widget.id}
                draggable
                onDragStart={(e) => handleDragStart(e, widget.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, widget.id)}
                className={`
                  group p-4 rounded-xl border transition-all duration-200 cursor-move
                  ${widget.enabled 
                    ? 'bg-white/10 border-white/20 hover:bg-white/15' 
                    : 'bg-white/5 border-white/10 opacity-60'
                  }
                  ${draggedItem === widget.id ? 'scale-105 shadow-lg' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-blue-200">
                      <GripVertical className="w-5 h-5" />
                      <span className="text-sm font-medium">#{widget.order + 1}</span>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-medium">{widget.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-blue-200">
                        <span>Size: {widget.size === 1 ? 'Single' : 'Full Width'}</span>
                        <span>•</span>
                        <span className={widget.enabled ? 'text-green-400' : 'text-red-400'}>
                          {widget.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleWidget(widget.id)}
                    className={`
                      p-2 rounded-lg transition-all duration-200 transform hover:scale-110
                      ${widget.enabled 
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }
                    `}
                  >
                    {widget.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <h4 className="text-white font-medium mb-2">Layout Information</h4>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• Maximum 3 widgets per row</li>
              <li>• Single widgets (size 1) can fit 3 across</li>
              <li>• Full width widgets (size 3) take up the entire row</li>
              <li>• Drag and drop to reorder widgets</li>
              <li>• Disabled widgets won't appear on your dashboard</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hourly Popup Settings */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Hourly Popup Settings</h2>
            <p className="text-blue-200 text-sm">Customize what appears in your hourly notifications</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Content Options */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Popup Content</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={hourlyPopupSettings.showHoursLeft}
                  onChange={(e) => onUpdateHourlyPopupSettings({...hourlyPopupSettings, showHoursLeft: e.target.checked})}
                  className="w-4 h-4 text-blue-500 rounded"
                />
                <span className="text-white">Hours Left Today</span>
              </label>
              
              <label className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={hourlyPopupSettings.showDayProgress}
                  onChange={(e) => onUpdateHourlyPopupSettings({...hourlyPopupSettings, showDayProgress: e.target.checked})}
                  className="w-4 h-4 text-blue-500 rounded"
                />
                <span className="text-white">Day Progress</span>
              </label>
              
              <label className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer col-span-2">
                <input
                  type="checkbox"
                  checked={hourlyPopupSettings.showQuote}
                  onChange={(e) => onUpdateHourlyPopupSettings({...hourlyPopupSettings, showQuote: e.target.checked})}
                  className="w-4 h-4 text-blue-500 rounded"
                />
                <span className="text-white">Inspirational Quotes</span>
              </label>
            </div>
          </div>

          {/* AI Integration */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">AI-Powered Content</h3>
                <p className="text-blue-200 text-sm">Generate personalized hourly reminders with Gemini AI</p>
              </div>
            </div>

            <div className="space-y-6">
              <label className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hourlyPopupSettings.useAI}
                  onChange={(e) => onUpdateHourlyPopupSettings({...hourlyPopupSettings, useAI: e.target.checked})}
                  className="w-5 h-5 text-purple-500 rounded"
                />
                <div>
                  <span className="text-white font-medium">Enable AI-Generated Content</span>
                  <p className="text-purple-200 text-sm">Get fresh, contextual quotes and reminders every hour</p>
                </div>
              </label>

              {hourlyPopupSettings.useAI && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Gemini API Key</label>
                    <div className="flex space-x-2">
                      <input
                        type="password"
                        placeholder="Enter your Gemini API key..."
                        value={hourlyPopupSettings.geminiApiKey}
                        onChange={(e) => onUpdateHourlyPopupSettings({...hourlyPopupSettings, geminiApiKey: e.target.value})}
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={testAIConnection}
                        disabled={testingAI || !hourlyPopupSettings.geminiApiKey}
                        className="flex items-center space-x-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                      >
                        <TestTube className="w-4 h-4" />
                        <span>{testingAI ? 'Testing...' : 'Test'}</span>
                      </button>
                    </div>
                    <p className="text-blue-200 text-sm mt-2">
                      Get your free API key from{' '}
                      <a 
                        href="https://makersuite.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 underline"
                      >
                        Google AI Studio
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quote Style (for both AI and static) */}
          {hourlyPopupSettings.showQuote && (
            <div>
              <label className="block text-white font-medium mb-3">
                {hourlyPopupSettings.useAI ? 'AI Content Style' : 'Quote Style'}
              </label>
              <select
                value={hourlyPopupSettings.quoteStyle}
                onChange={(e) => onUpdateHourlyPopupSettings({...hourlyPopupSettings, quoteStyle: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-gray-800 [&>option]:text-white"
              >
                <option value="motivational">Motivational & Inspiring</option>
                <option value="time-focused">Time-Focused & Contextual</option>
                <option value="productivity">Productivity & Focus Tips</option>
              </select>
              <p className="text-blue-200 text-sm mt-2">
                {hourlyPopupSettings.useAI 
                  ? 'AI will generate content matching this style with current time context'
                  : 'Choose from curated static quotes in this style'
                }
              </p>
            </div>
          )}

          {/* Preview Button */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => {
                // Generate AI quote if enabled, otherwise show static preview
                const generatePreviewContent = async () => {
                  let quoteContent = '';
                  
                  if (hourlyPopupSettings.showQuote) {
                    if (hourlyPopupSettings.useAI && hourlyPopupSettings.geminiApiKey) {
                      try {
                        const hour = new Date().getHours();
                        const dayProgress = Math.round((hour / 24) * 100);
                        const hoursLeft = Math.ceil((new Date().setHours(23,59,59,999) - Date.now()) / (1000 * 60 * 60));
                        const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
                        
                        const prompt = `Generate a brief, inspiring hourly reminder for someone using a productivity app. Context:
                        - Current time: ${hour}:00 (${timeOfDay})
                        - Day progress: ${dayProgress}% complete
                        - Hours remaining today: ${hoursLeft}
                        - Style: ${hourlyPopupSettings.quoteStyle || 'motivational'}
                        
                        IMPORTANT: Write as if you're speaking directly to the person in a friendly, conversational tone. Do not use quotation marks, rigid time formats like "4 PM:", or formal structures. Just speak naturally about their progress and encourage them. Keep it to 1-2 sentences maximum.
                        
                        Examples of the natural tone:
                        - You're already 67% through the day - that's solid progress! These next 8 hours are yours to make count.
                        - Nice work getting this far into the afternoon! You've still got plenty of time to accomplish something meaningful.
                        - The day's flying by and you're doing great. Let's make these remaining hours really shine.`;

                        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${hourlyPopupSettings.geminiApiKey}`, {
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
                            quoteContent = aiQuote.replace(/"/g, '').trim();
                          } else {
                            quoteContent = 'AI generated content will appear here during actual hourly popups.';
                          }
                        } else {
                          quoteContent = 'AI connection failed. Fallback quotes will be used.';
                        }
                      } catch (error) {
                        // Fallback to static quotes when AI fails
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
                        
                        const selectedQuotes = staticQuotes[hourlyPopupSettings.quoteStyle] || staticQuotes.motivational;
                        quoteContent = selectedQuotes[Math.floor(Math.random() * selectedQuotes.length)];
                      }
                    } else {
                      // Static quote based on style
                      const staticQuotes = {
                        'time-focused': `It's ${new Date().getHours() > 12 ? new Date().getHours() - 12 : new Date().getHours()}${new Date().getHours() >= 12 ? 'PM' : 'AM'}. You've completed ${Math.round((new Date().getHours() / 24) * 100)}% of today — how's it going?`,
                        'productivity': 'Focus is your superpower. Use this hour to demonstrate it.',
                        'motivational': 'Every hour is a new opportunity to make progress toward your dreams.'
                      };
                      quoteContent = staticQuotes[hourlyPopupSettings.quoteStyle] || staticQuotes.motivational;
                    }
                  }
                  
                  return quoteContent;
                };
                
                // Show loading state if AI is enabled
                if (hourlyPopupSettings.useAI && hourlyPopupSettings.geminiApiKey && hourlyPopupSettings.showQuote) {
                  // Create loading popup first
                  const loadingPopup = document.createElement('div');
                  loadingPopup.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4';
                  loadingPopup.innerHTML = `
                    <div class="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl max-w-lg w-full">
                      <div class="text-center">
                        <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4a2 2 0 100-4m6 4a2 2 0 100-4m0 4a2 2 0 100 4m0-4a2 2 0 100-4"></path>
                          </svg>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">Generating AI Content...</h3>
                        <p class="text-blue-200">Creating your personalized hourly reminder</p>
                      </div>
                    </div>
                  `;
                  document.body.appendChild(loadingPopup);
                  
                  // Generate content and show actual popup
                  generatePreviewContent().then(quoteContent => {
                    document.body.removeChild(loadingPopup);
                    showPreviewPopup(quoteContent);
                  });
                } else {
                  // Show static preview immediately
                  generatePreviewContent().then(quoteContent => {
                    showPreviewPopup(quoteContent);
                  });
                }
                
                function showPreviewPopup(quoteContent) {
                const mockPopup = document.createElement('div');
                mockPopup.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4';
                mockPopup.innerHTML = `
                  <div class="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl max-w-lg w-full">
                    <div class="text-center">
                      <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <h3 class="text-2xl font-bold text-white mb-2">Hour Complete! 🎉</h3>
                      
                      ${hourlyPopupSettings.showHoursLeft || hourlyPopupSettings.showDayProgress ? `
                        <div class="grid grid-cols-2 gap-4 mb-6">
                          ${hourlyPopupSettings.showHoursLeft ? `
                            <div class="bg-white/5 rounded-xl p-3 border border-white/10">
                              <div class="text-2xl font-bold text-white">${Math.ceil((new Date().setHours(23,59,59,999) - Date.now()) / (1000 * 60 * 60))}</div>
                              <div class="text-blue-200 text-sm">Hours Left Today</div>
                            </div>
                          ` : ''}
                          ${hourlyPopupSettings.showDayProgress ? `
                            <div class="bg-white/5 rounded-xl p-3 border border-white/10">
                              <div class="text-2xl font-bold text-white">${Math.round((new Date().getHours() / 24) * 100)}%</div>
                              <div class="text-blue-200 text-sm">Day Complete</div>
                            </div>
                          ` : ''}
                        </div>
                      ` : ''}
                      
                      ${hourlyPopupSettings.showWeather ? `
                        <div class="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                          <div class="flex items-center justify-center space-x-3">
                            <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="5"></circle>
                              <line x1="12" y1="1" x2="12" y2="3"></line>
                              <line x1="12" y1="21" x2="12" y2="23"></line>
                              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                              <line x1="1" y1="12" x2="3" y2="12"></line>
                              <line x1="21" y1="12" x2="23" y2="12"></line>
                              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </svg>
                            <div class="text-white">
                              <span class="font-bold">22°C</span>
                              <span class="text-blue-200 ml-2">Sunny</span>
                            </div>
                          </div>
                        </div>
                      ` : ''}
                      
                      ${hourlyPopupSettings.showQuote ? `
                        <div class="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-6 border border-purple-500/30">
                          <p class="text-white italic leading-relaxed">
                            "${quoteContent}"
                          </p>
                          ${hourlyPopupSettings.useAI && hourlyPopupSettings.geminiApiKey ? `
                            <div class="mt-2 flex items-center justify-center space-x-1">
                              <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                              </svg>
                              <span class="text-purple-300 text-xs">Generated by AI</span>
                            </div>
                          ` : ''}
                        </div>
                      ` : ''}
                      
                      <p class="text-blue-200 mb-6">Ready to make the next hour count?</p>
                      
                      <button class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg">
                        Start Next Hour
                      </button>
                    </div>
                  </div>
                `;
                
                // Add click handler to close popup
                mockPopup.addEventListener('click', (e) => {
                  if (e.target === mockPopup) {
                    document.body.removeChild(mockPopup);
                  }
                });
                
                // Add close button functionality
                const closeButton = mockPopup.querySelector('button');
                if (closeButton) {
                  closeButton.addEventListener('click', () => {
                    document.body.removeChild(mockPopup);
                  });
                }
                
                document.body.appendChild(mockPopup);
                }
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl py-3 px-4 font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Preview Hourly Popup
            </button>
          </div>
        </div>
      </div>

      {/* AI Chat Profile Settings */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">AI Chat Coach</h2>
            <p className="text-blue-200 text-sm">Personal AI assistant that knows your goals and checks in with you</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Enable AI Chat */}
          <div>
            <label className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20 cursor-pointer">
              <input
                type="checkbox"
                checked={aiProfileSettings.enabled}
                onChange={(e) => onUpdateAIProfileSettings({...aiProfileSettings, enabled: e.target.checked})}
                className="w-5 h-5 text-purple-500 rounded"
              />
              <div>
                <span className="text-white font-medium">Enable AI Chat Coach</span>
                <p className="text-purple-200 text-sm">Get personalized coaching messages based on your goals</p>
              </div>
            </label>
          </div>

          {aiProfileSettings.enabled && (
            <>
              {/* API Key */}
              <div>
                <label className="block text-white font-medium mb-2">Gemini API Key</label>
                <div className="flex space-x-2">
                  <input
                    type="password"
                    placeholder="Enter your Gemini API key..."
                    value={aiProfileSettings.geminiApiKey}
                    onChange={(e) => onUpdateAIProfileSettings({...aiProfileSettings, geminiApiKey: e.target.value})}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={testAIConnection}
                    disabled={testingAI || !aiProfileSettings.geminiApiKey}
                    className="flex items-center space-x-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    <TestTube className="w-4 h-4" />
                    <span>{testingAI ? 'Testing...' : 'Test'}</span>
                  </button>
                </div>
                <p className="text-blue-200 text-sm mt-2">
                  Get your free API key from{' '}
                  <a 
                    href="https://makersuite.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              {/* Personal Profile */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Profile</span>
                </h3>
                
                <div>
                  <label className="block text-white font-medium mb-2">Nickname</label>
                  <input
                    type="text"
                    placeholder="What should I call you?"
                    value={aiProfileSettings.nickname}
                    onChange={(e) => onUpdateAIProfileSettings({...aiProfileSettings, nickname: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-blue-200 text-sm mt-1">The AI will use this name when talking to you</p>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2 flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Weekly Goals</span>
                  </label>
                  <textarea
                    placeholder="What are your main goals for this week? (e.g., finish project proposal, exercise 3 times, learn React hooks)"
                    value={aiProfileSettings.weeklyGoals}
                    onChange={(e) => onUpdateAIProfileSettings({...aiProfileSettings, weeklyGoals: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <p className="text-blue-200 text-sm mt-1">Your AI coach will reference these goals in conversations</p>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2 flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Today's Focus</span>
                  </label>
                  <textarea
                    placeholder="What's your main focus for today? (e.g., complete client presentation, deep work on coding, important meetings)"
                    value={aiProfileSettings.dailyFocus}
                    onChange={(e) => onUpdateAIProfileSettings({...aiProfileSettings, dailyFocus: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={2}
                  />
                  <p className="text-blue-200 text-sm mt-1">Update this daily to keep your AI coach in sync with your current priorities</p>
                </div>
              </div>

              {/* Chat Settings */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Chat Frequency</span>
                </h3>
                
                <div>
                  <label className="block text-white font-medium mb-2">Check-in Interval</label>
                  <select
                    value={aiProfileSettings.chatInterval}
                    onChange={(e) => onUpdateAIProfileSettings({...aiProfileSettings, chatInterval: parseInt(e.target.value)})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-gray-800 [&>option]:text-white"
                  >
                    <option value={0}>Only on page refresh</option>
                    <option value={15}>Every 15 minutes</option>
                    <option value={30}>Every 30 minutes</option>
                    <option value={60}>Every hour</option>
                    <option value={120}>Every 2 hours</option>
                    <option value={240}>Every 4 hours</option>
                  </select>
                  <p className="text-blue-200 text-sm mt-1">
                    How often should your AI coach check in with personalized messages?
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Background Settings */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Background Settings</h2>
            <p className="text-blue-200 text-sm">Customize your dashboard background</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Background Type Selection */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Background Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => onUpdateBackgroundSettings({...backgroundSettings, type: 'default'})}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  backgroundSettings.type === 'default'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="w-full h-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-lg mb-3"></div>
                <div className="text-white font-medium">Default Gradient</div>
                <div className="text-blue-200 text-sm">Original blue gradient</div>
              </button>
              
              <button
                onClick={() => onUpdateBackgroundSettings({...backgroundSettings, type: 'preset'})}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  backgroundSettings.type === 'preset'
                    ? 'border-pink-500 bg-pink-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="w-full h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg mb-3 flex items-center justify-center">
                  <Image className="w-8 h-8 text-white" />
                </div>
                <div className="text-white font-medium">Preset Images</div>
                <div className="text-blue-200 text-sm">Choose from curated backgrounds</div>
              </button>
              
              <button
                onClick={() => onUpdateBackgroundSettings({...backgroundSettings, type: 'custom'})}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  backgroundSettings.type === 'custom'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="w-full h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg mb-3 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div className="text-white font-medium">Custom Upload</div>
                <div className="text-blue-200 text-sm">Upload your own image</div>
              </button>
            </div>
          </div>

          {/* Preset Backgrounds */}
          {backgroundSettings.type === 'preset' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Choose Preset Background</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {presetBackgrounds.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => onUpdateBackgroundSettings({
                      ...backgroundSettings,
                      presetUrl: preset.url
                    })}
                    className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                      backgroundSettings.presetUrl === preset.url
                        ? 'border-pink-500 ring-2 ring-pink-500/50'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="aspect-video">
                      <img
                        src={preset.thumbnail}
                        alt={preset.name}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=400';
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                      <div className="text-white font-medium text-sm">{preset.name}</div>
                    </div>
                    {backgroundSettings.presetUrl === preset.url && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Upload */}
          {backgroundSettings.type === 'custom' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Upload Custom Background</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Select Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundFileSelect}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-500 file:text-white hover:file:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {selectedBackgroundFile && (
                    <div className="mt-2 flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white text-sm font-medium">{selectedBackgroundFile.name}</p>
                        <p className="text-blue-200 text-xs">
                          {(selectedBackgroundFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={handleUploadBackground}
                        disabled={isUploadingBackground}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-lg font-medium transition-all duration-200"
                      >
                        {isUploadingBackground ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  )}
                  {backgroundSettings.customUrl && (
                    <div className="mt-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-400 text-sm">Custom background uploaded successfully</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Background Controls */}
          {backgroundSettings.type !== 'default' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">Background Controls</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Opacity Control */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    Background Opacity: {backgroundSettings.opacity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={backgroundSettings.opacity}
                    onChange={(e) => onUpdateBackgroundSettings({
                      ...backgroundSettings,
                      opacity: parseInt(e.target.value)
                    })}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-blue-200 text-sm mt-1">
                    <span>Transparent</span>
                    <span>Opaque</span>
                  </div>
                </div>

                {/* Blur Control */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    Background Blur: {backgroundSettings.blur}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={backgroundSettings.blur}
                    onChange={(e) => onUpdateBackgroundSettings({
                      ...backgroundSettings,
                      blur: parseInt(e.target.value)
                    })}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-blue-200 text-sm mt-1">
                    <span>Sharp</span>
                    <span>Blurred</span>
                  </div>
                </div>
              </div>

              {/* Preview Info */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <h4 className="text-white font-medium mb-2">Background Preview</h4>
                <ul className="text-blue-200 text-sm space-y-1">
                  <li>• Changes apply immediately to your dashboard</li>
                  <li>• Lower opacity makes the background more subtle</li>
                  <li>• Blur can help reduce distraction from busy images</li>
                  <li>• Custom images are stored locally in your browser</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;