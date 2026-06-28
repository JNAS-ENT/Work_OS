/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, RefreshCw, Cpu, Brain, CornerUpLeft, Plus, CheckCircle, ShieldAlert } from 'lucide-react';

interface AiAssistantProps {
  initialPrompt?: string | null;
  onNavigate: (tab: string, param?: any) => void;
}

export default function AiAssistant({ initialPrompt, onNavigate }: AiAssistantProps) {
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'assistant',
      text: "Hello! I am your Work OS AI Co-Pilot. I have indexing access to your synced Emails, Projects, Tasks, and Customer CRM portfolios.\n\nHow can I optimize your operations today? You can ask me to:\n- *'Draft a follow-up quotation email for Apex Engineering'* \n- *'Summarize pending customer replies and risk levels'* \n- *'Plan a technical checklist for the Precision Robotics STEP model'*"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    // Append User message
    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) {
      setInputText('');
    }
    
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
        console.error('Error talking to AI Assistant:', err);
        setMessages(prev => [...prev, { 
          sender: 'assistant', 
          text: "I experienced an issue negotiating with the server-side Gemini SDK. Please ensure your `GEMINI_API_KEY` is registered in the Secrets panel." 
        }]);
      })
      .finally(() => setLoading(false));
  };

  const suggestions = [
    { title: "Draft Quote Email", prompt: "Draft a highly professional follow-up email to Apex Engineering regarding the titanium bracket quote." },
    { title: "Summarize Risk Level", prompt: "Look through recent emails and tell me which customers are marked as High Risk or waiting for a reply." },
    { title: "Check Task Backlog", prompt: "Review my current task list and suggest the top 3 items I should tackle first based on priority." }
  ];

  return (
    <div className="flex flex-col border border-gray-100 rounded-2xl bg-white shadow-sm h-[calc(100vh-140px)] overflow-hidden">
      
      {/* Header bar */}
      <div className="bg-blue-600 p-4 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-100 animate-pulse" />
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold tracking-tight">Work OS AI Operations Co-Pilot</h2>
            <p className="text-[10px] text-blue-100 font-semibold">Gemini 3.5 Flash Model • Zero Context Leaks</p>
          </div>
        </div>
        <span className="text-[10px] bg-white/20 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-full font-bold font-mono">
          Context: Emails + CRM + Tasks
        </span>
      </div>

      {/* Messages viewport */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/20">
        {messages.map((msg, idx) => {
          const isAssistant = msg.sender === 'assistant';
          return (
            <div 
              key={idx} 
              className={`flex gap-3 max-w-[85%] ${isAssistant ? 'mr-auto items-start' : 'ml-auto items-start flex-row-reverse'}`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0 ${isAssistant ? 'bg-blue-50 border border-blue-100 text-blue-600' : 'bg-gray-200 text-gray-700'}`}>
                {isAssistant ? 'AI' : 'ME'}
              </span>
              
              <div className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 border ${isAssistant ? 'bg-white border-gray-100 text-gray-800' : 'bg-blue-600 border-blue-600 text-white shadow-sm'}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
                
                {/* Assistant additional actions suggestion mappings */}
                {isAssistant && msg.text.includes('Draft') && (
                  <div className="flex gap-2 pt-2 border-t border-gray-50 mt-2">
                    <button 
                      onClick={() => onNavigate('email')}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-blue-600 border border-blue-100 bg-blue-50 rounded hover:bg-blue-100 transition"
                    >
                      <CornerUpLeft className="h-3 w-3" />
                      Send to Email Center
                    </button>
                    <button 
                      onClick={() => onNavigate('tasks')}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-emerald-600 border border-emerald-100 bg-emerald-50 rounded hover:bg-emerald-100 transition"
                    >
                      <Plus className="h-3 w-3" />
                      Schedule Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading placeholder */}
        {loading && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-center">
            <span className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
              AI
            </span>
            <div className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></span>
              <span className="text-xs text-gray-400 font-semibold italic">Analyzing Work OS database...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts list */}
      <div className="px-6 py-2.5 bg-white border-t border-gray-50 flex flex-wrap gap-2 shrink-0">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(s.prompt)}
            className="text-[10px] font-bold text-gray-500 hover:text-blue-600 bg-gray-50 border border-gray-100 hover:border-blue-100 px-2.5 py-1 rounded-xl transition"
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        <form 
          onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Type instructions to Gemini (e.g. 'draft an RFQ response email')..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl text-xs bg-gray-50/50 focus:bg-white"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
