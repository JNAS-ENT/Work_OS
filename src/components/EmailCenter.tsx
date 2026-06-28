/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Inbox, Star, Archive, Trash2, ShieldAlert, Sparkles, AlertTriangle, 
  Search, RefreshCw, Paperclip, ChevronRight, CornerUpLeft, CheckSquare, 
  Briefcase, Users, Calendar, Clock, AlertCircle, HeartCrack, Smile, ArrowRight, Eye, Play, Plus,
  ToggleLeft, ToggleRight, Check, Trash, Send, Mail, CheckCircle2, History, MessageSquare, AlertOctagon, HelpCircle
} from 'lucide-react';
import { Email, Attachment, Task, Project, MailAccount } from '../types';

interface EmailCenterProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (id: string) => void;
  onUpdateEmail: (id: string, updates: Partial<Email>) => void;
  onForceAnalyze: (id: string) => void;
  onNavigate: (tab: string, param?: any) => void;
  onSync: () => void;
  syncLoading: boolean;
  tasks: Task[];
  projects: Project[];
}

export default function EmailCenter({
  emails, selectedEmailId, onSelectEmail, onUpdateEmail, onForceAnalyze, 
  onNavigate, onSync, syncLoading, tasks, projects
}: EmailCenterProps) {
  
  const [folder, setFolder] = useState<'inbox' | 'starred' | 'unread' | 'archived' | 'spam' | 'deleted' | 'drafts'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mail accounts state
  const [mailAccounts, setMailAccounts] = useState<MailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [showAccountManager, setShowAccountManager] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // New mail account form fields
  const [newAccName, setNewAccName] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccProvider, setNewAccProvider] = useState<'yahoo' | 'outlook' | 'gmail' | 'imap' | 'smtp'>('yahoo');

  // Rich composer modal state
  const [showComposer, setShowComposer] = useState(false);
  const [compTo, setCompTo] = useState('');
  const [compSubject, setCompSubject] = useState('');
  const [compBody, setCompBody] = useState('');
  const [compIsDraft, setCompIsDraft] = useState(false);
  const [compScheduledTime, setCompScheduledTime] = useState('');
  const [compAccountId, setCompAccountId] = useState('');
  const [compAttachments, setCompAttachments] = useState<{ fileName: string; fileSize: string; fileType: string }[]>([]);
  const [composingLoading, setComposingLoading] = useState(false);

  // AI suggestion state
  const [suggestingReply, setSuggestingReply] = useState(false);
  const [aiTone, setAiTone] = useState<'Professional' | 'Casual' | 'Technical' | 'Urgent' | 'Friendly'>('Professional');
  const [aiSuggestionResult, setAiSuggestionResult] = useState('');

  // Interactive follow-up updates
  const [logEventDescription, setLogEventDescription] = useState('');
  const [updatingFollowUp, setUpdatingFollowUp] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  // Fetch accounts on load
  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await fetch('/api/mail-accounts');
      if (res.ok) {
        const data = await res.json();
        setMailAccounts(data);
        if (data.length > 0 && !compAccountId) {
          setCompAccountId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch mail accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [emails]);

  // Connect new corporate mailbox connection
  const handleConnectAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccEmail) return;

    try {
      const res = await fetch('/api/mail-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAccName, email: newAccEmail, provider: newAccProvider })
      });
      if (res.ok) {
        setNewAccName('');
        setNewAccEmail('');
        fetchAccounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle mail account active state
  const handleToggleAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/mail-accounts/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        fetchAccounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Compose new email
  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compTo || !compSubject) return;

    setComposingLoading(true);
    try {
      const res = await fetch('/api/emails/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: 'Geometric Suite Work OS',
          senderEmail: mailAccounts.find(a => a.id === compAccountId)?.email || 'operations@geometricsuite.com',
          subject: compSubject,
          body: compBody,
          mailAccountId: compAccountId,
          isDraft: compIsDraft,
          scheduledSendTime: compScheduledTime || undefined,
          attachments: compAttachments
        })
      });
      if (res.ok) {
        setCompTo('');
        setCompSubject('');
        setCompBody('');
        setCompIsDraft(false);
        setCompScheduledTime('');
        setCompAttachments([]);
        setShowComposer(false);
        onSync(); // Refresh main lists
      }
    } catch (err) {
      console.error(err);
    } finally {
      setComposingLoading(false);
    }
  };

  // Generate Gemini AI Suggestion Reply
  const handleSuggestReply = async (emailId: string) => {
    setSuggestingReply(true);
    setAiSuggestionResult('');
    try {
      const res = await fetch(`/api/emails/${emailId}/suggest-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone: aiTone })
      });
      const data = await res.json();
      if (res.ok) {
        setAiSuggestionResult(data.suggestion);
      } else {
        setAiSuggestionResult(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      setAiSuggestionResult(`Error compiling request: ${err.message}`);
    } finally {
      setSuggestingReply(false);
    }
  };

  // Update AI follow up intelligence on mark
  const handleUpdateFollowUpState = async (emailId: string, updates: { replyStatus?: string; followUpCount?: number; priorityScore?: number; escalationFlag?: boolean; eventDescription?: string }) => {
    setUpdatingFollowUp(true);
    try {
      const res = await fetch(`/api/emails/${emailId}/mark-followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setLogEventDescription('');
        onSync(); // Refresh to trigger DB read update
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingFollowUp(false);
    }
  };

  const handleForceAnalyze = async () => {
    if (!selectedEmailId) return;
    setAnalyzeLoading(true);
    await onForceAnalyze(selectedEmailId);
    setAnalyzeLoading(false);
  };

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  // Filter emails based on folder, search, and mailbox connection switcher
  const filteredEmails = emails.filter(email => {
    // Mailbox Filter
    if (selectedAccountId !== 'all' && email.mailAccountId !== selectedAccountId) {
      return false;
    }

    // Search filter
    const matchesSearch = 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.body.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;

    if (folder === 'starred') return email.starred && !email.deleted;
    if (folder === 'unread') return email.unread && !email.deleted && !email.archived;
    if (folder === 'archived') return email.archived && !email.deleted;
    if (folder === 'spam') return email.spam && !email.deleted;
    if (folder === 'deleted') return email.deleted;
    if (folder === 'drafts') return email.isDraft && !email.deleted;
    
    // Default inbox
    return !email.isDraft && !email.archived && !email.spam && !email.deleted;
  });

  // Find related tasks and projects for selected email
  const relatedTasks = selectedEmail ? tasks.filter(t => t.emailId === selectedEmail.id) : [];
  
  let relatedProject: Project | undefined = undefined;
  if (selectedEmail && selectedEmail.customerId) {
    relatedProject = projects.find(p => p.customerId === selectedEmail.customerId);
  }

  const getCategoryColor = (cat: Email['category']) => {
    const map: Record<string, string> = {
      'RFQ': 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
      'Quotation': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
      'Purchase Order': 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
      'Invoice': 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
      'Drawing': 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30',
      'Complaint': 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
      'Meeting': 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30',
      'Reminder': 'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30',
      'Approval': 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30',
      'Information': 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/50'
    };
    return map[cat || ''] || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  const getPriorityColor = (prio: Email['priority']) => {
    if (prio === 'High') return 'text-red-600 bg-red-50 border-red-100 dark:text-red-400 dark:bg-red-950/20 dark:border-red-900/30';
    if (prio === 'Medium') return 'text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-900/30';
    return 'text-gray-500 bg-gray-50 border-gray-150 dark:text-slate-400 dark:bg-slate-800/40';
  };

  const getStatusIconAndColor = (status: string) => {
    switch (status) {
      case 'New': return { icon: MessageSquare, color: 'text-blue-500 bg-blue-500/10' };
      case 'Reply Needed': return { icon: AlertCircle, color: 'text-amber-500 bg-amber-500/10' };
      case 'Awaiting Client': return { icon: Clock, color: 'text-indigo-500 bg-indigo-500/10' };
      case 'Resolved': return { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' };
      case 'Escalated': return { icon: AlertOctagon, color: 'text-red-500 bg-red-500/10' };
      default: return { icon: HelpCircle, color: 'text-gray-400 bg-gray-400/10' };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs h-[calc(100vh-140px)] relative" id="email-center-layout">
      
      {/* Sidebar: Mailbox navigation & Accounts manager (2 cols) */}
      <div className="lg:col-span-2 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-3 space-y-4 flex flex-col justify-between" id="mailbox-sidebar">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mailbox Selection</span>
            <button 
              onClick={() => setShowAccountManager(!showAccountManager)} 
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {showAccountManager ? 'Folders' : 'Manage Accounts'}
            </button>
          </div>

          {!showAccountManager ? (
            <div className="space-y-1">
              <button 
                onClick={() => setShowComposer(true)}
                className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Compose Message
              </button>

              {/* Mailbox account switcher dropdown */}
              <div className="px-3 pb-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Active Connection</label>
                <select 
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="all">Unified Inbox (All)</option>
                  {mailAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.provider.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              {[
                { id: 'inbox', label: 'Inbox', icon: Inbox, count: emails.filter(e => !e.isDraft && !e.archived && !e.spam && !e.deleted && e.unread).length },
                { id: 'starred', label: 'Starred', icon: Star, count: emails.filter(e => e.starred && !e.deleted).length },
                { id: 'unread', label: 'Unread', icon: Sparkles, count: emails.filter(e => e.unread && !e.deleted).length },
                { id: 'drafts', label: 'Drafts', icon: Paperclip, count: emails.filter(e => e.isDraft && !e.deleted).length },
                { id: 'archived', label: 'Archive', icon: Archive, count: emails.filter(e => e.archived && !e.deleted).length },
                { id: 'spam', label: 'Spam', icon: ShieldAlert, count: emails.filter(e => e.spam && !e.deleted).length },
                { id: 'deleted', label: 'Trash', icon: Trash2, count: emails.filter(e => e.deleted).length },
              ].map(f => {
                const Icon = f.icon;
                const active = folder === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFolder(f.id as any)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition ${active ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/30'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${active ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400'}`} />
                      <span>{f.label}</span>
                    </div>
                    {f.count > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${active ? 'bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        {f.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Add Mail Connection</span>
                <form onSubmit={handleConnectAccount} className="space-y-2">
                  <input 
                    type="text"
                    placeholder="Account Name (e.g. Sales Yahoo)"
                    value={newAccName}
                    onChange={e => setNewAccName(e.target.value)}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-800 rounded text-xs bg-transparent text-slate-800 dark:text-slate-200"
                    required
                  />
                  <input 
                    type="email"
                    placeholder="username@yahoo.com"
                    value={newAccEmail}
                    onChange={e => setNewAccEmail(e.target.value)}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-800 rounded text-xs bg-transparent text-slate-800 dark:text-slate-200"
                    required
                  />
                  <select 
                    value={newAccProvider}
                    onChange={e => setNewAccProvider(e.target.value as any)}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-800 rounded text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="yahoo">Yahoo Mail</option>
                    <option value="gmail">Google Workspace</option>
                    <option value="outlook">Outlook Exchange</option>
                    <option value="imap">Secure IMAP Client</option>
                    <option value="smtp">Direct SMTP Server</option>
                  </select>
                  <button type="submit" className="w-full py-1.5 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-700 transition">
                    Authorize & Sync
                  </button>
                </form>
              </div>

              {/* Connected accounts lists */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Connected Inboxes</span>
                {mailAccounts.map(acc => (
                  <div key={acc.id} className="p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{acc.name}</span>
                      <button onClick={() => handleToggleAccount(acc.id)} className="text-slate-400 hover:text-blue-500 transition">
                        {acc.isActive ? <ToggleRight className="h-5.5 w-5.5 text-blue-600" /> : <ToggleLeft className="h-5.5 w-5.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{acc.email}</p>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                      <span>{acc.provider.toUpperCase()}</span>
                      <span className="text-blue-500 font-bold flex items-center gap-1">
                        <RefreshCw className="h-2 w-2 animate-spin" /> {acc.syncStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sync Trigger button */}
        <div className="p-1">
          <button
            onClick={onSync}
            disabled={syncLoading}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-blue-700 dark:text-blue-400 border border-blue-150 dark:border-slate-800 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition ${syncLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`h-3 w-3 ${syncLoading ? 'animate-spin' : ''}`} />
            {syncLoading ? 'Syncing...' : 'Fetch & Analyze'}
          </button>
        </div>
      </div>

      {/* Email listing grid (4 cols) */}
      <div className="lg:col-span-4 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900" id="email-threads-listing">
        {/* Search header */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* List scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-850">
          {filteredEmails.length > 0 ? (
            filteredEmails.map(email => {
              const active = email.id === selectedEmailId;
              const hasAnalysis = !!email.aiAnalysis;
              const repIntel = email.replyIntelligence;
              
              return (
                <div
                  key={email.id}
                  onClick={() => {
                    onSelectEmail(email.id);
                    if (email.unread) {
                      onUpdateEmail(email.id, { unread: false });
                    }
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition relative ${active ? 'bg-blue-50/40 dark:bg-blue-950/10 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-xs ${email.unread ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400'} truncate flex-1`}>
                        {email.senderName}
                      </p>
                      <span className="text-[10px] text-gray-400 font-mono shrink-0">
                        {new Date(email.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <h4 className={`text-sm tracking-tight ${email.unread ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-200'} line-clamp-1`}>
                      {email.subject}
                    </h4>
                    
                    <p className="text-xs text-gray-400 dark:text-slate-400 line-clamp-2">
                      {email.body}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1 items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${getCategoryColor(email.category)}`}>
                          {email.category}
                        </span>
                        {email.priority === 'High' && (
                          <span className="text-[9px] px-1 bg-red-50 text-red-600 rounded font-bold uppercase border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30">
                            High
                          </span>
                        )}
                        {repIntel?.replyStatus && repIntel.replyStatus !== 'Resolved' && (
                          <span className="text-[9px] px-1 bg-amber-50 text-amber-600 rounded font-bold uppercase border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
                            {repIntel.replyStatus}
                          </span>
                        )}
                      </div>
                      
                      {hasAnalysis && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/25 px-1.5 py-0.5 rounded-full border border-blue-100/50">
                          <Sparkles className="h-2 w-2 text-blue-500" />
                          AI Triaged
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-gray-400 text-xs">No conversations in this folder.</div>
          )}
        </div>
      </div>

      {/* Thread details view (6 cols) */}
      <div className="lg:col-span-6 flex flex-col h-full bg-gray-50/10 dark:bg-slate-900/50" id="email-message-viewer">
        {selectedEmail ? (
          <div className="flex-1 overflow-y-auto flex flex-col">
            
            {/* Top actions toolbar */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 p-3 flex justify-between items-center z-10">
              <div className="flex gap-1">
                <button
                  onClick={() => onUpdateEmail(selectedEmail.id, { starred: !selectedEmail.starred })}
                  className={`p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition ${selectedEmail.starred ? 'text-amber-500' : 'text-gray-400'}`}
                  title="Star Conversation"
                >
                  <Star className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onUpdateEmail(selectedEmail.id, { archived: !selectedEmail.archived })}
                  className={`p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition ${selectedEmail.archived ? 'text-blue-600' : 'text-gray-400'}`}
                  title={selectedEmail.archived ? "Move to Inbox" : "Archive"}
                >
                  <Archive className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onUpdateEmail(selectedEmail.id, { spam: !selectedEmail.spam })}
                  className={`p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition ${selectedEmail.spam ? 'text-amber-600' : 'text-gray-400'}`}
                  title="Mark as Spam"
                >
                  <ShieldAlert className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onUpdateEmail(selectedEmail.id, { deleted: true })}
                  className="p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 rounded-xl transition text-gray-400"
                  title="Delete Conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setCompTo(selectedEmail.senderEmail);
                    setCompSubject(`Re: ${selectedEmail.subject}`);
                    setCompBody(`\n\nOn ${new Date(selectedEmail.date).toLocaleString()}, ${selectedEmail.senderName} wrote:\n> ${selectedEmail.body.split('\n').join('\n> ')}`);
                    setShowComposer(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30 transition cursor-pointer"
                >
                  <CornerUpLeft className="h-3 w-3" />
                  Reply with Composer
                </button>
              </div>
            </div>

            {/* Email Header Card */}
            <div className="p-6 bg-white dark:bg-slate-900 border-b border-gray-50 dark:border-slate-800/80 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{selectedEmail.subject}</h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-semibold text-gray-800 dark:text-slate-200 text-sm">{selectedEmail.senderName}</span>
                    <span className="text-xs text-gray-400">&lt;{selectedEmail.senderEmail}&gt;</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-gray-400">
                    {new Date(selectedEmail.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-1.5">
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getCategoryColor(selectedEmail.category)}`}>
                  Folder: {selectedEmail.category}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getPriorityColor(selectedEmail.priority)}`}>
                  Priority: {selectedEmail.priority}
                </span>
                {selectedEmail.customerId && (
                  <button 
                    onClick={() => onNavigate('customers', { customerId: selectedEmail.customerId })}
                    className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/10 dark:text-purple-400 dark:border-purple-900/30 border border-purple-100 px-2.5 py-0.5 rounded-full hover:bg-purple-100 transition"
                  >
                    <Users className="h-3 w-3" />
                    CRM Profile
                  </button>
                )}
              </div>
            </div>

            {/* Email Body */}
            <div className="p-6 bg-white dark:bg-slate-900 min-h-[160px] text-gray-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans border-b border-gray-50 dark:border-slate-800/80">
              {selectedEmail.body}
            </div>

            {/* Attachments Section */}
            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
              <div className="p-6 bg-white dark:bg-slate-900 border-b border-gray-50 dark:border-slate-800/80">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" />
                  Attachments ({selectedEmail.attachments.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedEmail.attachments.map((att: Attachment) => (
                    <div 
                      key={att.id} 
                      onClick={() => onNavigate('files')}
                      className="flex items-center justify-between border border-gray-100 dark:border-slate-800 p-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition group"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-slate-200 text-xs truncate group-hover:text-blue-600 transition">{att.fileName}</p>
                        <p className="text-[10px] text-gray-400">{att.fileSize} • {att.fileType}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-500 rounded font-mono uppercase font-bold shrink-0">
                        View
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==========================================
                AI REPLY ASSISTANT COMPOSED BLOCK (Module 4)
                ========================================== */}
            <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/85 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Generative AI Reply Suggestion
                </h3>
                <div className="flex items-center gap-2">
                  <select 
                    value={aiTone}
                    onChange={e => setAiTone(e.target.value as any)}
                    className="p-1 text-xs border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 rounded"
                  >
                    <option value="Professional">Professional Tone</option>
                    <option value="Casual">Casual Conversational</option>
                    <option value="Technical">Technical Operations</option>
                    <option value="Urgent">Urgent Action Call</option>
                    <option value="Friendly">Friendly Support</option>
                  </select>
                  <button
                    onClick={() => handleSuggestReply(selectedEmail.id)}
                    disabled={suggestingReply}
                    className="text-xs font-bold px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`h-3 w-3 ${suggestingReply ? 'animate-spin' : ''}`} />
                    Formulate Draft
                  </button>
                </div>
              </div>

              {aiSuggestionResult ? (
                <div className="p-4 bg-slate-950 rounded-2xl space-y-3 border border-blue-500/10 relative">
                  <div className="text-[10px] uppercase font-bold text-blue-400 font-mono">Suggested Draft</div>
                  <pre className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap pr-10">{aiSuggestionResult}</pre>
                  
                  <div className="flex gap-2 justify-end pt-2 border-t border-slate-900">
                    <button 
                      onClick={() => {
                        setCompTo(selectedEmail.senderEmail);
                        setCompSubject(`Re: ${selectedEmail.subject}`);
                        setCompBody(aiSuggestionResult);
                        setShowComposer(true);
                      }}
                      className="px-2.5 py-1 bg-blue-600/90 hover:bg-blue-600 text-white text-[11px] font-bold rounded-lg transition"
                    >
                      Load into Composer
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(aiSuggestionResult);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg transition"
                    >
                      Copy Draft
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Unlock a custom professional response drafted with Gemini by selecting a tone and pressing "Formulate Draft".</p>
              )}
            </div>

            {/* ==========================================
                AI PENDING REPLY & TIMELINE (Module 5)
                ========================================== */}
            <div className="p-6 bg-white dark:bg-slate-900 space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-600" />
                Response Intelligence & Follow-up Timeline
              </h3>

              {/* Status Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: 'New', desc: 'No action taken yet' },
                  { name: 'Reply Needed', desc: 'Waiting on team action' },
                  { name: 'Awaiting Client', desc: 'Waiting for client' },
                  { name: 'Resolved', desc: 'Inquiry complete' }
                ].map(st => {
                  const currentSt = selectedEmail.replyIntelligence?.replyStatus || 'New';
                  const active = currentSt === st.name;
                  const sc = getStatusIconAndColor(st.name);
                  const Icon = sc.icon;
                  return (
                    <button 
                      key={st.name}
                      onClick={() => handleUpdateFollowUpState(selectedEmail.id, { 
                        replyStatus: st.name, 
                        eventDescription: `Updated status transition to: ${st.name}` 
                      })}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-20 ${active ? 'border-blue-500 bg-blue-500/5' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <Icon className={`h-4.5 w-4.5 ${sc.color.split(' ')[0]}`} />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{st.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium truncate">{st.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-850">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">AI Priority Score</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {selectedEmail.replyIntelligence?.priorityScore || (selectedEmail.priority === 'High' ? 85 : 45)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">/ 100 max</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Follow-up Dispatches</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {selectedEmail.replyIntelligence?.followUpCount || 0} times
                    </span>
                    <div className="flex gap-1 shrink-0">
                      <button 
                        onClick={() => handleUpdateFollowUpState(selectedEmail.id, { 
                          followUpCount: (selectedEmail.replyIntelligence?.followUpCount || 0) + 1,
                          eventDescription: 'Incremented manual follow-up dispatch count'
                        })}
                        className="p-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold text-[10px] rounded"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Escalation Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedEmail.replyIntelligence?.escalationFlag ? (
                      <span className="text-xs font-bold text-red-600 bg-red-500/10 px-2 py-0.5 border border-red-500/25 rounded-full flex items-center gap-1">
                        <AlertOctagon className="h-3.5 w-3.5 text-red-500" /> Active Escalation
                      </span>
                    ) : (
                      <button
                        onClick={() => handleUpdateFollowUpState(selectedEmail.id, { 
                          escalationFlag: true,
                          eventDescription: 'Forced manual escalation of critical thread'
                        })}
                        className="text-[10px] text-slate-500 hover:text-red-500 font-bold hover:underline"
                      >
                        Force Escalate
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Event logging timelines */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timeline History Events</span>
                
                {/* Add Custom Timeline Log */}
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Log activity (e.g. Left voicemail, sent price sheet)..."
                    value={logEventDescription}
                    onChange={e => setLogEventDescription(e.target.value)}
                    className="flex-1 p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-100 focus:outline-hidden"
                  />
                  <button 
                    onClick={() => handleUpdateFollowUpState(selectedEmail.id, { eventDescription: logEventDescription })}
                    className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition"
                  >
                    Log Event
                  </button>
                </div>

                {/* Timeline display */}
                {selectedEmail.replyIntelligence?.timelineEvents && selectedEmail.replyIntelligence.timelineEvents.length > 0 ? (
                  <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 space-y-3.5 ml-2 py-2">
                    {selectedEmail.replyIntelligence.timelineEvents.slice().reverse().map(evt => (
                      <div key={evt.id} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
                        <div className="text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{evt.description}</span>
                          <span className="text-[9px] text-slate-400 ml-2 font-mono">{new Date(evt.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No historical communication log records registered.</p>
                )}
              </div>

              {/* Work OS AI Email Co-Pilot */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Work OS AI Email Parser</span>
                <button
                  onClick={handleForceAnalyze}
                  disabled={analyzeLoading}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 border border-blue-100 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${analyzeLoading ? 'animate-spin' : ''}`} />
                  {analyzeLoading ? 'Analyzing...' : 'Re-Analyze Email'}
                </button>
              </div>

              {selectedEmail.aiAnalysis ? (
                <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/30 dark:from-slate-900 dark:to-slate-900 border border-blue-100/60 dark:border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
                  
                  {/* Summary row */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest font-mono">Cognitive Summary</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold font-mono">
                        Confidence {selectedEmail.aiAnalysis.confidenceScore}%
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 leading-snug">
                      "{selectedEmail.aiAnalysis.aiSummary}"
                    </p>
                  </div>

                  {/* Extraction Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-blue-100/40 dark:border-slate-800/80">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">CRM Matching</span>
                      <p className="text-xs text-gray-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        {selectedEmail.aiAnalysis.customerName} ({selectedEmail.aiAnalysis.company})
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Identified Project</span>
                      <p className="text-xs text-gray-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                        {selectedEmail.aiAnalysis.project || 'General Operations'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Risk Classification</span>
                      <p className="text-xs font-bold flex items-center gap-1.5">
                        <AlertCircle className={`h-3.5 w-3.5 ${selectedEmail.aiAnalysis.riskLevel === 'High' ? 'text-red-500' : 'text-amber-500'}`} />
                        <span className={selectedEmail.aiAnalysis.riskLevel === 'High' ? 'text-red-700' : 'text-amber-700'}>
                          {selectedEmail.aiAnalysis.riskLevel} Risk Business Case
                        </span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Extracted Deadline</span>
                      <p className="text-xs text-gray-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {selectedEmail.aiAnalysis.deadline ? new Date(selectedEmail.aiAnalysis.deadline).toLocaleDateString([], { dateStyle: 'medium' }) : 'None Extracted'}
                      </p>
                    </div>
                  </div>

                  {/* Operational Deliverable Required */}
                  <div className="p-3.5 bg-white dark:bg-slate-950 border border-blue-100/50 dark:border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Action Item Required</span>
                    <p className="text-xs text-gray-800 dark:text-slate-200 font-semibold leading-relaxed flex items-start gap-1.5">
                      <ArrowRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                      {selectedEmail.aiAnalysis.requiredAction}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-slate-950/20 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl p-6 text-center text-gray-500 space-y-3">
                  <p className="text-xs">No active AI extraction metrics. Let the Work OS engine run the cognitive parser on this thread.</p>
                  <button
                    onClick={handleForceAnalyze}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow transition cursor-pointer"
                  >
                    Invoke Gemini API Parser
                  </button>
                </div>
              )}

              {/* Related tasks and scheduling tracker */}
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Related Task Ingress</h4>
                  {relatedTasks.length === 0 && selectedEmail.aiAnalysis && (
                    <button
                      onClick={() => onNavigate('tasks')}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Schedule Manual Task
                    </button>
                  )}
                </div>

                {relatedTasks.length > 0 ? (
                  <div className="space-y-2">
                    {relatedTasks.map(tsk => (
                      <div 
                        key={tsk.id}
                        onClick={() => onNavigate('tasks')}
                        className="flex items-center justify-between p-3 border border-gray-50 dark:border-slate-850 rounded-xl hover:border-blue-100 cursor-pointer transition"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{tsk.title}</p>
                          <p className="text-[10px] text-gray-400">Due: {tsk.dueDate} • Assigned: {tsk.assignedTo}</p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${tsk.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/10 border border-emerald-100' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/10 border border-amber-100'}`}>
                          {tsk.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-gray-400">No active operational tasks associated with this email thread yet.</div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center space-y-2">
            <Inbox className="h-12 w-12 text-gray-300 stroke-1" />
            <p className="text-sm font-semibold text-gray-500">No Conversation Selected</p>
            <p className="text-xs max-w-xs text-gray-400">Select an email thread from the mailbox listing to analyze, update communication timelines, and map action tasks.</p>
          </div>
        )}
      </div>

      {/* ==========================================
          RICH EMAIL COMPOSER MODAL (Modules 3, 4, 5)
          ========================================== */}
      {showComposer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="rich-email-composer">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Enterprise Communication Composer</h3>
              </div>
              <button 
                onClick={() => setShowComposer(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleComposeSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Send From Connection</label>
                  <select 
                    value={compAccountId}
                    onChange={e => setCompAccountId(e.target.value)}
                    className="w-full bg-transparent border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  >
                    {mailAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">To (Recipient)</label>
                  <input 
                    type="email"
                    placeholder="customer@domain.com"
                    value={compTo}
                    onChange={e => setCompTo(e.target.value)}
                    className="w-full bg-transparent border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subject</label>
                <input 
                  type="text"
                  placeholder="e.g. Technical tolerancing review regarding mount batch"
                  value={compSubject}
                  onChange={e => setCompSubject(e.target.value)}
                  className="w-full bg-transparent border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Body Content</label>
                <textarea 
                  rows={8}
                  placeholder="Dear James, we are pleased to present the engineering blueprint files..."
                  value={compBody}
                  onChange={e => setCompBody(e.target.value)}
                  className="w-full bg-transparent border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden font-sans resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="saveAsDraftCheck"
                    checked={compIsDraft}
                    onChange={e => setCompIsDraft(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="saveAsDraftCheck" className="text-xs font-bold text-slate-600 dark:text-slate-400">Save as Draft (No Send)</label>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Scheduled Release Date/Time</label>
                  <input 
                    type="datetime-local"
                    value={compScheduledTime}
                    onChange={e => setCompScheduledTime(e.target.value)}
                    className="w-full bg-transparent border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Attachments inside compose form */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Compose Attachments</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCompAttachments(prev => [...prev, { fileName: 'Apex-M4-tolerances.pdf', fileSize: '1.4 MB', fileType: 'PDF Document' }])}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5 text-slate-400" /> Apex-M4-tolerances.pdf (1.4MB)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompAttachments(prev => [...prev, { fileName: 'Turbine-bracket-BatchC.dwg', fileSize: '4.8 MB', fileType: 'CAD Drawing' }])}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5 text-slate-400" /> Turbine-bracket-BatchC.dwg (4.8MB)
                  </button>
                </div>

                {compAttachments.length > 0 && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 grid grid-cols-2 gap-2">
                    {compAttachments.map((att, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <span className="font-bold truncate max-w-[150px]">{att.fileName}</span>
                        <button type="button" onClick={() => setCompAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 font-bold hover:underline">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowComposer(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={composingLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  {composingLoading ? <RefreshCw className="h-4 animate-spin" /> : compIsDraft ? 'Save Draft Profile' : 'Dispatch Corporate Message'}
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
