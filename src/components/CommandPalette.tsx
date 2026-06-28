/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Terminal, CheckSquare, Briefcase, Mail, Users, 
  Settings, Phone, CornerDownRight, X, Cpu, FileText
} from 'lucide-react';
import { Email, Task, Project, Customer } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, param?: any) => void;
  emails: Email[];
  tasks: Task[];
  projects: Project[];
  customers: Customer[];
}

export default function CommandPalette({
  isOpen, onClose, onNavigate, emails, tasks, projects, customers
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Find matches
  const getFilteredItems = () => {
    const searchStr = query.toLowerCase();
    const items: any[] = [];

    // Add static navigation command items
    const commands = [
      { id: 'nav-dashboard', type: 'command', title: 'Go to Action Center', icon: Terminal, action: () => onNavigate('dashboard') },
      { id: 'nav-whatsapp', type: 'command', title: 'Go to WhatsApp AI Center', icon: Phone, action: () => onNavigate('whatsapp') },
      { id: 'nav-email', type: 'command', title: 'Go to Email Center', icon: Mail, action: () => onNavigate('email') },
      { id: 'nav-tasks', type: 'command', title: 'Go to Task Manager', icon: CheckSquare, action: () => onNavigate('tasks') },
      { id: 'nav-projects', type: 'command', title: 'Go to Projects Workspace', icon: Briefcase, action: () => onNavigate('projects') },
      { id: 'nav-customers', type: 'command', title: 'Go to CRM Customers', icon: Users, action: () => onNavigate('customers') },
      { id: 'nav-settings', type: 'command', title: 'Go to Global Settings', icon: Settings, action: () => onNavigate('settings') },
    ];

    commands.forEach(cmd => {
      if (cmd.title.toLowerCase().includes(searchStr)) {
        items.push(cmd);
      }
    });

    // Match Emails
    emails.forEach(e => {
      if (e.subject.toLowerCase().includes(searchStr) || e.senderName.toLowerCase().includes(searchStr)) {
        items.push({
          id: `email-${e.id}`,
          type: 'email',
          title: `Email: ${e.subject}`,
          subtitle: `From: ${e.senderName} (${e.senderEmail})`,
          icon: Mail,
          action: () => onNavigate('email', e.id)
        });
      }
    });

    // Match Tasks
    tasks.forEach(t => {
      if (t.title.toLowerCase().includes(searchStr) || (t.description && t.description.toLowerCase().includes(searchStr))) {
        items.push({
          id: `task-${t.id}`,
          type: 'task',
          title: `Task: ${t.title}`,
          subtitle: `Priority: ${t.priority} • Due: ${t.dueDate}`,
          icon: CheckSquare,
          action: () => onNavigate('tasks', t.id)
        });
      }
    });

    // Match Projects
    projects.forEach(p => {
      if (p.name.toLowerCase().includes(searchStr) || p.description.toLowerCase().includes(searchStr)) {
        items.push({
          id: `project-${p.id}`,
          type: 'project',
          title: `Project: ${p.name}`,
          subtitle: `Progress: ${p.progress}% • Status: ${p.status}`,
          icon: Briefcase,
          action: () => onNavigate('projects', p.id)
        });
      }
    });

    // Match Customers
    customers.forEach(c => {
      if (c.contactName.toLowerCase().includes(searchStr) || c.company.toLowerCase().includes(searchStr)) {
        items.push({
          id: `customer-${c.id}`,
          type: 'customer',
          title: `Customer: ${c.contactName}`,
          subtitle: `${c.company} • ${c.email}`,
          icon: Users,
          action: () => onNavigate('customers', c.id)
        });
      }
    });

    return items.slice(0, 8); // Limit to top 8 items
  };

  const matchedItems = getFilteredItems();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % Math.max(1, matchedItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + matchedItems.length) % Math.max(1, matchedItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (matchedItems[activeIndex]) {
          matchedItems[activeIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, activeIndex, matchedItems, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={onClose}></div>

      {/* Main Palette Modal */}
      <div 
        ref={containerRef}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[480px] animate-fade-in"
      >
        {/* Search Input Area */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search everything or run operation command..."
            className="flex-1 bg-transparent border-0 outline-hidden text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
            ESC
          </kbd>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition shrink-0"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {matchedItems.length > 0 ? (
            matchedItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === activeIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected 
                        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}>
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate leading-snug">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold capitalize tracking-wide ${
                      item.type === 'command' 
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/50' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {item.type}
                    </span>
                    {isSelected && (
                      <CornerDownRight className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center space-y-2 text-slate-400 dark:text-slate-500">
              <Cpu className="h-8 w-8 mx-auto stroke-1" />
              <p className="text-xs font-semibold">No direct matched operations found</p>
              <p className="text-[10px]">Try typing "Go to", "Email", or search specific clients like "Apex"</p>
            </div>
          )}
        </div>

        {/* Command Palette Keyboard Hints Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xs shadow-3xs font-mono">↑↓</kbd> Navigation
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xs shadow-3xs font-mono">Enter</kbd> Execute
            </span>
          </div>
          <span>Work OS Command Center</span>
        </div>
      </div>
    </div>
  );
}
