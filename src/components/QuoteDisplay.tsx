import React, { useState, useEffect, useCallback } from 'react';
import { Quote } from 'lucide-react';
import { Quote as QuoteType } from '../types';

const quotes: QuoteType[] = [
  {
    text: "An hour is not just sixty minutes. It's the foundation of productivity, the building block of achievement.",
    author: "Time Mastery",
    category: "time"
  },
  {
    text: "The hour you invest in yourself today creates the tomorrow you desire.",
    author: "Productivity Wisdom",
    category: "productivity"
  },
  {
    text: "Every hour is a chance to reset, refocus, and recommit to your goals.",
    author: "Focus Philosophy",
    category: "motivation"
  },
  {
    text: "Time is not money. Time is life. Use each hour to live fully.",
    author: "Life Balance",
    category: "time"
  },
  {
    text: "The most successful people don't manage time—they manage their energy within each hour.",
    author: "Energy Management",
    category: "productivity"
  },
  {
    text: "An hour of focused work is worth more than a day of distraction.",
    author: "Deep Work Principles",
    category: "productivity"
  },
  {
    text: "Each hour is a fresh canvas. Paint it with intention and purpose.",
    author: "Mindful Living",
    category: "motivation"
  },
  {
    text: "The secret to productivity isn't doing more things—it's doing the right things in each hour.",
    author: "Effectiveness First",
    category: "productivity"
  }
];

const QuoteDisplay: React.FC = () => {
  const [currentQuote, setCurrentQuote] = useState<QuoteType>(quotes[0]);
  const [isVisible, setIsVisible] = useState(true);

  const getRandomQuote = useCallback(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentQuote(randomQuote);
  }, []);

  useEffect(() => {
    // Show a random quote on page load
    getRandomQuote();
    
    // Refresh quote every 15 minutes
    const interval = setInterval(() => {
      getRandomQuote();
      setIsVisible(true); // Show quote again if it was dismissed
    }, 15 * 60 * 1000); // 15 minutes
    
    return () => clearInterval(interval);
  }, [getRandomQuote]);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Quote className="w-5 h-5 text-blue-200" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <blockquote className="text-white text-lg font-medium leading-relaxed">
              "{currentQuote.text}"
            </blockquote>
            <cite className="block mt-2 text-blue-200 text-sm">
              — {currentQuote.author}
            </cite>
          </div>
      </div>
    </div>
    </div>
  );
};

export default QuoteDisplay;