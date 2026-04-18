'use client';

import { useState, useRef, useEffect } from 'react';
import { Trophy, BookOpen, User } from 'lucide-react';
import TicketMessageBubble from './TicketMessageBubble';
import OnboardingModal from './OnboardingModal';
import ProfileModal from './ProfileModal';
import { UserProfile, defaultUserProfile } from '@/types/user';
import { storage } from '@/lib/storage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ citation: string; metadata: any }>;
  serialNumber?: string;
  timestamp?: string;
}

export default function ChatInterface() {
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [ragEnabled, setRagEnabled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hey there! I'm TennisCoach AI. 👋 Welcome to your personal tennis coach!\n\nI'm here to help you improve your game, whether you're just starting out or looking to take your skills to the next level.\n\nAsk me anything about:\n• 🎾 Technique (forehand, backhand, serve, volley)\n• 🧠 Tactics and strategy\n• 💪 Fitness and conditioning\n• 🎯 Equipment recommendations\n• 📖 Rules and scoring\n• 🧘 Mental game tips\n\nWhat would you like to work on today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCounter, setMessageCounter] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadIdRef = useRef(crypto.randomUUID());

  // Generate serial number for messages
  const generateSerialNumber = () => {
    const num = messageCounter + 1;
    return `MSG-${String(num).padStart(3, '0')}`;
  };

  // Load user profile and RAG setting on mount
  useEffect(() => {
    const hasOnboarded = storage.hasCompletedOnboarding();
    if (!hasOnboarded) {
      setShowOnboarding(true);
    } else {
      const profile = storage.getUserProfile();
      setUserProfile(profile);
    }

    // Load RAG setting
    const ragSetting = storage.isRAGEnabled();
    setRagEnabled(ragSetting);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      serialNumber: generateSerialNumber(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setMessageCounter(prev => prev + 1);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userProfile,
          threadId: threadIdRef.current,
          ragEnabled,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const assistantMessage: Message = {
        ...data,
        serialNumber: generateSerialNumber(),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setMessageCounter(prev => prev + 1);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, I had trouble connecting. Please try again in a moment!',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRagToggle = () => {
    const newValue = !ragEnabled;
    setRagEnabled(newValue);
    storage.setRAGEnabled(newValue);
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  const handleProfileClear = () => {
    storage.clearUserProfile();
    setUserProfile(defaultUserProfile);
    setShowProfile(false);
    setShowOnboarding(true);
  };

  return (
    <div className="flex flex-col h-full bg-clay-100">
      {/* Header */}
      <header className="bg-white border-b border-clay-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-clay-300 rounded-lg flex items-center justify-center shadow-md">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-navy-900">TennisCoach AI</h1>
              <p className="text-sm text-navy-50">Your personal tennis coach</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRagToggle}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                ragEnabled
                  ? 'bg-wimbledon-500 text-white hover:bg-wimbledon-600 shadow-sm'
                  : 'bg-clay-100 text-navy-900 hover:bg-clay-200'
              }`}
              title={ragEnabled ? 'RAG enabled - Using knowledge base' : 'RAG disabled - Using general knowledge'}
            >
              <BookOpen className="w-4 h-4" />
              {ragEnabled ? 'RAG On' : 'RAG Off'}
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="px-4 py-2 bg-clay-100 hover:bg-clay-200 rounded-lg text-sm font-medium text-navy-900 transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <div key={index}>
              <TicketMessageBubble
                role={message.role}
                content={message.content}
                sources={message.sources}
                serialNumber={message.serialNumber}
                timestamp={message.timestamp}
              />
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-ausopen-50 rounded-lg px-4 py-3 border-l-4 border-ausopen-500 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-ausopen-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-ausopen-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-ausopen-500 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-clay-200 px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about tennis..."
            className="flex-1 px-4 py-3 border border-clay-200 rounded-full focus:outline-none focus:ring-2 focus:ring-clay-400 focus:border-transparent bg-clay-50 text-navy-900 placeholder:text-navy-50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-clay-300 text-white rounded-full font-medium hover:bg-clay-400 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Send
          </button>
        </form>
      </div>

      {/* Modals */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={(profile) => {
            setUserProfile(profile);
            setShowOnboarding(false);
          }}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

      {showProfile && (
        <ProfileModal
          profile={userProfile}
          onClose={() => setShowProfile(false)}
          onUpdate={handleProfileUpdate}
          onClear={handleProfileClear}
        />
      )}
    </div>
  );
}
