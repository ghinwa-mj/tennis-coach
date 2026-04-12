'use client';

import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import OnboardingModal from './OnboardingModal';
import ProfileModal from './ProfileModal';
import { UserProfile, defaultUserProfile } from '@/types/user';
import { storage } from '@/lib/storage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ citation: string; metadata: any }>;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadIdRef = useRef(crypto.randomUUID());

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

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
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
      setMessages((prev) => [...prev, data]);
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">🎾</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">TennisCoach AI</h1>
              <p className="text-sm text-gray-500">Your personal tennis coach</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRagToggle}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                ragEnabled
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={ragEnabled ? 'RAG enabled - Using knowledge base' : 'RAG disabled - Using general knowledge'}
            >
              📚 {ragEnabled ? 'RAG On' : 'RAG Off'}
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              👤 Profile
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <div key={index}>
              <MessageBubble role={message.role} content={message.content} />
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 mb-4 ml-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs font-semibold text-blue-800 mb-2">📚 Sources:</div>
                  <ul className="space-y-1">
                    {message.sources.map((source, idx) => (
                      <li key={idx} className="text-xs text-blue-700">
                        {idx + 1}. {source.citation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about tennis..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
