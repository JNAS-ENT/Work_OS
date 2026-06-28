/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Inbox, Star, Archive, Trash2, ShieldAlert, Sparkles, AlertTriangle, 
  Search, RefreshCw, Paperclip, ChevronRight, CornerUpLeft, CheckSquare, 
  Briefcase, Users, Calendar, Clock, AlertCircle, HeartCrack, Smile, ArrowRight, Eye, Play, Plus
} from 'lucide-react';
import { Email, Attachment, Task, Project } from '../types';

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
  
  const [folder, setFolder] = useState<'inbox' | 'starred' | 'unread' | 'archived' | 'spam' | 'deleted'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  // Filter emails based on folder
  const filteredEmails = emails.filter(email => {
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
    
    // Default inbox
    return !email.archived && !email.spam && !email.deleted;
  });

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  // Find related tasks and projects for selected email
  const relatedTasks = selectedEmail ? tasks.filter(t => t.emailId === selectedEmail.id) : [];
  
  let relatedProject: Project | undefined = undefined;
  if (selectedEmail && selectedEmail.customerId) {
    relatedProject = projects.find(p => p.customerId === selectedEmail.customerId);
  }

  const handleForceAnalyze = async () => {
    if (!selectedEmail) return;
    setAnalyzeLoading(true);
    await onForceAnalyze(selectedEmail.id);
    setAnalyzeLoading(false);
  };

  const getCategoryColor = (cat: Email['category']) => {
    const map: Record<string, string> = {
      'RFQ': 'bg-red-50 text-red-600 border-red-100',
      'Quotation': 'bg-blue-50 text-blue-600 border-blue-100',
      'Purchase Order': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'Invoice': 'bg-amber-50 text-amber-600 border-amber-100',
      'Drawing': 'bg-purple-50 text-purple-600 border-purple-100',
      'Complaint': 'bg-rose-50 text-rose-600 border-rose-100',
      'Meeting': 'bg-indigo-50 text-indigo-600 border-indigo-100',
      'Reminder': 'bg-teal-50 text-teal-600 border-teal-100',
      'Approval': 'bg-sky-50 text-sky-600 border-sky-100',
      'Information': 'bg-gray-50 text-gray-600 border-gray-100'
    };
    return map[cat || ''] || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  const getPriorityColor = (prio: Email['priority']) => {
    if (prio === 'High') return 'text-red-600 bg-red-50 border-red-100';
    if (prio === 'Medium') return 'text-blue-600 bg-blue-50 border-blue-100';
    return 'text-gray-500 bg-gray-50 border-gray-150';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs h-[calc(100vh-140px)]">
      
      {/* Sidebar folder selectors (2 cols) */}
      <div className="lg:col-span-2 border-r border-slate-200 bg-slate-50/50 p-3 space-y-4 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mailbox</div>
          
          {[
            { id: 'inbox', label: 'Inbox', icon: Inbox, count: emails.filter(e => !e.archived && !e.spam && !e.deleted && e.unread).length },
            { id: 'starred', label: 'Starred', icon: Star, count: emails.filter(e => e.starred && !e.deleted).length },
            { id: 'unread', label: 'Unread', icon: Sparkles, count: emails.filter(e => e.unread && !e.deleted).length },
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
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100/60'}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${active ? 'text-blue-700' : 'text-slate-400'}`} />
                  <span>{f.label}</span>
                </div>
                {f.count > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${active ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                    {f.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sync Trigger button */}
        <div className="p-1">
          <button
            onClick={onSync}
            disabled={syncLoading}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-blue-700 border border-blue-150 bg-blue-50 hover:bg-blue-100 rounded-lg transition ${syncLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`h-3 w-3 ${syncLoading ? 'animate-spin' : ''}`} />
            {syncLoading ? 'Fetching...' : 'Yahoo Sync'}
          </button>
        </div>
      </div>

      {/* Email listing grid (4 cols) */}
      <div className="lg:col-span-4 border-r border-slate-200 flex flex-col h-full bg-white">
        {/* Search header */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* List scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredEmails.length > 0 ? (
            filteredEmails.map(email => {
              const active = email.id === selectedEmailId;
              const hasAnalysis = !!email.aiAnalysis;
              return (
                <div
                  key={email.id}
                  onClick={() => {
                    onSelectEmail(email.id);
                    if (email.unread) {
                      onUpdateEmail(email.id, { unread: false });
                    }
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50/50 transition relative ${active ? 'bg-blue-50/40 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-xs ${email.unread ? 'font-bold text-gray-900' : 'text-gray-500'} truncate flex-1`}>
                        {email.senderName}
                      </p>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(email.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <h4 className={`text-sm tracking-tight ${email.unread ? 'font-bold text-gray-900' : 'text-gray-700'} line-clamp-1`}>
                      {email.subject}
                    </h4>
                    
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {email.body}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1 items-center justify-between">
                      <div className="flex gap-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${getCategoryColor(email.category)}`}>
                          {email.category}
                        </span>
                        {email.priority === 'High' && (
                          <span className="text-[9px] px-1 bg-red-50 text-red-600 rounded font-bold uppercase border border-red-100">
                            High
                          </span>
                        )}
                      </div>
                      
                      {hasAnalysis && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                          <Sparkles className="h-2 w-2" />
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
      <div className="lg:col-span-6 flex flex-col h-full bg-gray-50/10">
        {selectedEmail ? (
          <div className="flex-1 overflow-y-auto flex flex-col">
            
            {/* Top actions toolbar */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-3 flex justify-between items-center z-10">
              <div className="flex gap-1">
                <button
                  onClick={() => onUpdateEmail(selectedEmail.id, { starred: !selectedEmail.starred })}
                  className={`p-2 hover:bg-gray-100 rounded-xl transition ${selectedEmail.starred ? 'text-amber-500' : 'text-gray-400'}`}
                  title="Star Conversation"
                >
                  <Star className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onUpdateEmail(selectedEmail.id, { archived: !selectedEmail.archived })}
                  className={`p-2 hover:bg-gray-100 rounded-xl transition ${selectedEmail.archived ? 'text-blue-600' : 'text-gray-400'}`}
                  title={selectedEmail.archived ? "Move to Inbox" : "Archive"}
                >
                  <Archive className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onUpdateEmail(selectedEmail.id, { spam: !selectedEmail.spam })}
                  className={`p-2 hover:bg-gray-100 rounded-xl transition ${selectedEmail.spam ? 'text-amber-600' : 'text-gray-400'}`}
                  title="Mark as Spam"
                >
                  <ShieldAlert className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onUpdateEmail(selectedEmail.id, { deleted: true })}
                  className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition text-gray-400"
                  title="Delete Conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => onNavigate('assistant', { initPrompt: `Help me draft a reply to email: "${selectedEmail.subject}"` })}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition"
                >
                  <CornerUpLeft className="h-3 w-3" />
                  Reply with AI
                </button>
              </div>
            </div>

            {/* Email Header Card */}
            <div className="p-6 bg-white border-b border-gray-50 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                <div>
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight">{selectedEmail.subject}</h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-semibold text-gray-800 text-sm">{selectedEmail.senderName}</span>
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
                    className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full hover:bg-purple-100 transition"
                  >
                    <Users className="h-3 w-3" />
                    CRM Profile
                  </button>
                )}
              </div>
            </div>

            {/* Email Body */}
            <div className="p-6 bg-white min-h-[160px] text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-sans border-b border-gray-50">
              {selectedEmail.body}
            </div>

            {/* Attachments Section */}
            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
              <div className="p-6 bg-white border-b border-gray-50">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" />
                  Attachments ({selectedEmail.attachments.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedEmail.attachments.map((att: Attachment) => (
                    <div 
                      key={att.id} 
                      onClick={() => onNavigate('files')}
                      className="flex items-center justify-between border border-gray-100 p-3 rounded-xl hover:bg-gray-50/50 cursor-pointer transition group"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-xs truncate group-hover:text-blue-600 transition">{att.fileName}</p>
                        <p className="text-[10px] text-gray-400">{att.fileSize} • {att.fileType}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-mono uppercase font-bold shrink-0">
                        View
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI ANALYSIS COGNITIVE PANEL */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                  Work OS AI Email Co-Pilot
                </h3>
                <button
                  onClick={handleForceAnalyze}
                  disabled={analyzeLoading}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 border border-blue-100 hover:bg-blue-50 px-2 py-1 rounded-lg transition disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${analyzeLoading ? 'animate-spin' : ''}`} />
                  {analyzeLoading ? 'Analyzing...' : 'Re-Analyze Email'}
                </button>
              </div>

              {selectedEmail.aiAnalysis ? (
                <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/30 border border-blue-100/60 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
                  
                  {/* Summary row */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest font-mono">Cognitive Summary</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold font-mono">
                        Confidence {selectedEmail.aiAnalysis.confidenceScore}%
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 leading-snug">
                      "{selectedEmail.aiAnalysis.aiSummary}"
                    </p>
                  </div>

                  {/* Extraction Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-blue-100/40">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">CRM Matching</span>
                      <p className="text-xs text-gray-700 font-bold flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        {selectedEmail.aiAnalysis.customerName} ({selectedEmail.aiAnalysis.company})
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Identified Project</span>
                      <p className="text-xs text-gray-700 font-bold flex items-center gap-1.5">
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
                      <p className="text-xs text-gray-700 font-bold flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {selectedEmail.aiAnalysis.deadline ? new Date(selectedEmail.aiAnalysis.deadline).toLocaleDateString([], { dateStyle: 'medium' }) : 'None Extracted'}
                      </p>
                    </div>
                  </div>

                  {/* Operational Deliverable Required */}
                  <div className="p-3.5 bg-white border border-blue-100/50 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Action Item Required</span>
                    <p className="text-xs text-gray-800 font-semibold leading-relaxed flex items-start gap-1.5">
                      <ArrowRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                      {selectedEmail.aiAnalysis.requiredAction}
                    </p>
                  </div>

                  {/* Immediate Micro step */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Next Tactical Action</span>
                      <p className="text-xs text-gray-600 italic font-medium">{selectedEmail.aiAnalysis.nextAction}</p>
                    </div>
                    {selectedEmail.aiAnalysis.waitingFor && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-red-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Waiting Blocker
                        </span>
                        <p className="text-xs text-red-600 font-medium">{selectedEmail.aiAnalysis.waitingFor}</p>
                      </div>
                    )}
                  </div>

                  {/* Sentiment Metric */}
                  <div className="absolute right-3 top-3 flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-white/80 backdrop-blur border border-gray-100 px-2 py-0.5 rounded-full">
                    {selectedEmail.aiAnalysis.sentiment === 'Positive' ? (
                      <Smile className="h-3.5 w-3.5 text-emerald-500" />
                    ) : selectedEmail.aiAnalysis.sentiment === 'Negative' ? (
                      <HeartCrack className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    Sentiment: {selectedEmail.aiAnalysis.sentiment}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-500 space-y-3">
                  <p className="text-xs">No active AI extraction metrics. Let the Work OS engine run the cognitive parser on this thread.</p>
                  <button
                    onClick={handleForceAnalyze}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow transition"
                  >
                    Invoke Gemini API Parser
                  </button>
                </div>
              )}

              {/* Related tasks and scheduling tracker */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3 shadow-sm">
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
                        className="flex items-center justify-between p-3 border border-gray-50 rounded-xl hover:border-blue-100 cursor-pointer transition"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-gray-800">{tsk.title}</p>
                          <p className="text-[10px] text-gray-400">Due: {tsk.dueDate} • Assigned: {tsk.assignedTo}</p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${tsk.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
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
            <p className="text-xs max-w-xs text-gray-400">Select an email thread from the mailbox listing to analyze and map next action items.</p>
          </div>
        )}
      </div>

    </div>
  );
}
