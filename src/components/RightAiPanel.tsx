/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, X, ChevronLeft, ChevronRight, Brain, 
  MessageSquare, Terminal, HelpCircle, AlertTriangle, CheckSquare, Plus, CornerUpLeft
} from 'lucide-react';

interface RightAiPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (tab: string, param?: any) => void;
}

export default function RightAiPanel({ isOpen, onToggle, onNavigate }: RightAiPanelProps) {
  const [messages, setMessages] = useState<any[]>([
    { sender: 'assistant', text: 'Hi! I am the Work OS Contextual Assistant. I am always listening side-by-side to assist with tasks on any workspace. What would you like to build or check?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    setMessages(prev => [...prev, { sender: 'user', text }]);
    if (!textToSend) setInputText('');
    setLoading(true);

    fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
      .then(res => res.json())
      .then(data => {
        setMessages(prev => [...prev, { sender: 'assistant', text: data.reply }]);
      })
      .catch(err => {
        console.error('AI error:', err);
        setMessages(prev => [...prev, { sender: 'assistant', text: 'Negotiation error with the local server. Make sure GEMINI_API_KEY is active.' }]);
      })
      .finally(() => setLoading(false));
  };

  const prompts = [
    { label: 'Suggest high-priority work', text: 'Review my active tasks list and suggest the top items I should prioritize.' },
    { label: 'Summarize core pipeline', text: 'Create an executive summary of my commercial sales pipeline status.' },
    { label: 'Draft client apology', text: 'Draft a polite and professional follow-up email apologizing to a client for minor schedule modifications.' }
  ];

  if (!isOpen) {
    return (
      <button 
        onClick={onToggle}
        title="Open AI Operations Side Panel"
        className="fixed right-4 bottom-20 z-40 w-12 h-12 rounded-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 cursor-pointer border border-blue-500/20"
      >
        <Sparkles className="h-5 w-5 animate-pulse" />
      </button>
    );
  }

  return (
    <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen flex flex-col shrink-0 relative animate-slide-in shadow-lg">
      
      {/* Header section */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-2">
          <Brain className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 animate-pulse" />
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Sidekick</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Gemini-assisted Workspace</p>
          </div>
        </div>

        <button 
          onClick={onToggle}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/20 dark:bg-slate-950/20">
        {messages.map((m, i) => {
          const isAi = m.sender === 'assistant';
          return (
            <div key={i} className={`flex gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}>
              {isAi && (
                <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/60 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[9px] font-bold uppercase shrink-0">
                  AI
                </span>
              )}
              <div className={`p-3 rounded-2xl text-[11px] leading-relaxed max-w-[85%] border ${
                isAi 
                  ? 'bg-white dark:bg-slate-850 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none' 
                  : 'bg-blue-600 dark:bg-blue-700 border-blue-600 dark:border-blue-700 text-white rounded-tr-none'
              }`}>
                <p className="whitespace-pre-wrap">{m.text}</p>

                {isAi && m.text.includes('Draft') && (
                  <div className="flex gap-1.5 pt-2 border-t border-slate-50 dark:border-slate-800 mt-2">
                    <button 
                      onClick={() => onNavigate('email')}
                      className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 border border-blue-100 bg-blue-50 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 rounded hover:bg-blue-100 transition"
                    >
                      <CornerUpLeft className="h-2.5 w-2.5" />
                      Email Desk
                    </button>
                    <button 
                      onClick={() => onNavigate('tasks')}
                      className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 border border-emerald-100 bg-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800 rounded hover:bg-emerald-100 transition"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      Task SLA
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5 items-center">
            <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/60 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[9px] font-bold shrink-0">
              AI
            </span>
            <div className="bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 p-2.5 rounded-2xl flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-semibold italic">
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-600 dark:border-blue-400"></span>
              Thinking...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompts Shelf */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 shrink-0">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">Suggested Proactive Prompts</p>
        <div className="flex flex-col gap-1">
          {prompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p.text)}
              className="text-left px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-[10px] text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900 font-bold transition truncate cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input box */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <form 
          onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
          className="flex gap-1.5"
        >
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ask AI Copilot..."
            disabled={loading}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[11px] focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
          />
          <button 
            type="submit"
            disabled={loading || !inputText.trim()}
            className="p-2 bg-blue-600 dark:bg-blue-700 text-white rounded-xl flex items-center justify-center transition disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
