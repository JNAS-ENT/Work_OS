/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, AlertCircle, FileText, 
  Users, Briefcase, Mail, Calendar, Sparkles, Plus, Play, ShieldAlert, ChevronRight, Activity,
  CornerUpLeft, CheckSquare, DollarSign, Eye, AlertTriangle, ArrowRight, Layers, ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';
import { Email, Task, Project, Customer, Rfq, Drawing, Quotation, Invoice, PurchaseOrder } from '../types';

interface DashboardProps {
  stats: any;
  activities: any[];
  meetings: any[];
  onAction: (action: string) => void;
  onNavigate: (tab: string, param?: any) => void;
  syncLoading: boolean;
  onSync: () => void;
  emails: Email[];
  tasks: Task[];
  projects: Project[];
  customers: Customer[];
  rfqs: Rfq[];
  drawings: Drawing[];
  quotations: Quotation[];
  invoices: Invoice[];
  pos: PurchaseOrder[];
}

export default function Dashboard({ 
  stats, activities, meetings, onAction, onNavigate, syncLoading, onSync,
  emails, tasks, projects, customers, rfqs, drawings, quotations, invoices, pos
}: DashboardProps) {

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'emails' | 'tasks' | 'engineering'>('all');

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // ==========================================
  // ACTION CENTER DATA EXTRACTION & ANALYSIS
  // ==========================================

  // 1. NEED REPLY / ACTIONABLE EMAILS
  const needReplyEmails = emails.filter(email => {
    if (email.deleted || email.archived || email.spam) return false;
    // Unread high/medium priority, or explicit AI analysis flagged as waiting or risk, or category is RFQ/Complaint/Approval
    const isUnread = email.unread;
    const isHighPriority = email.priority === 'High';
    const isActionableCategory = ['RFQ', 'Complaint', 'Approval', 'Quotation'].includes(email.category);
    const hasPendingAction = email.aiAnalysis && (email.aiAnalysis.riskLevel === 'High' || !!email.aiAnalysis.requiredAction);
    
    return isUnread || isHighPriority || isActionableCategory || hasPendingAction;
  }).slice(0, 5);

  // 2. OVERDUE TASKS
  const overdueTasksList = tasks.filter(task => {
    return task.status !== 'Completed' && task.status !== 'Cancelled' && task.dueDate < todayStr;
  });

  // 3. WAITING FOR CUSTOMER
  const waitingCustomerItems = [
    // Emails flagged as "waiting for" by AI
    ...emails.filter(e => !e.deleted && e.aiAnalysis?.waitingFor).map(e => ({
      id: e.id,
      type: 'email' as const,
      title: e.subject,
      sender: e.senderName,
      company: e.aiAnalysis?.company || 'Unknown Client',
      waitingFor: e.aiAnalysis?.waitingFor,
      date: e.date,
      priority: e.priority
    })),
    // Tasks with Waiting status
    ...tasks.filter(t => t.status === 'Waiting').map(t => {
      const cust = customers.find(c => c.id === t.customerId);
      return {
        id: t.id,
        type: 'task' as const,
        title: t.title,
        sender: t.assignedTo || 'Unassigned',
        company: cust?.company || 'Internal Operations',
        waitingFor: t.description || 'Awaiting materials / feedback',
        date: t.dueDate,
        priority: t.priority
      };
    }),
    // Drawings under revision / waiting approval
    ...drawings.filter(d => d.status === 'In Review' || d.status === 'Rejected').map(d => {
      const cust = customers.find(c => c.id === d.customerId);
      return {
        id: d.id,
        type: 'drawing' as const,
        title: `Drawing ${d.drawingNumber}: ${d.title}`,
        sender: d.status,
        company: cust?.company || 'Reviewer',
        waitingFor: d.status === 'In Review' ? 'Awaiting sign-off' : 'Revision requested by engineering team',
        date: d.updatedAt || todayStr,
        priority: 'High' as const
      };
    })
  ].slice(0, 5);

  // 4. ACTIVE RFQs NEEDING ACTION
  const actionableRfqs = rfqs.filter(r => r.status === 'Pending');

  // 5. DRAWINGS UNDER REVIEW OR PENDING APPROVAL
  const pendingDrawings = drawings.filter(d => d.status === 'In Review');

  // 6. TODAY'S DELIVERABLES (Due today)
  const todaysTasks = tasks.filter(t => t.dueDate === todayStr && t.status !== 'Completed');

  // Actionable counts
  const needReplyCount = needReplyEmails.length;
  const overdueCount = overdueTasksList.length;
  const waitingCount = waitingCustomerItems.length;
  const rfqCount = actionableRfqs.length;
  const drawingsCount = pendingDrawings.length;
  const totalActionableItems = needReplyCount + overdueCount + waitingCount + rfqCount + drawingsCount;

  // Render metrics specifically based on ACTION CENTER status
  const actionStatsCards = [
    { 
      id: 'need-reply',
      title: "Need Reply", 
      value: needReplyCount, 
      desc: "Emails requiring reply", 
      icon: Mail, 
      color: "text-rose-600 bg-rose-50 border-rose-100",
      tab: 'email'
    },
    { 
      id: 'overdue',
      title: "Overdue Work", 
      value: overdueCount, 
      desc: "Pending critical SLA targets", 
      icon: ShieldAlert, 
      color: "text-amber-600 bg-amber-50 border-amber-100",
      tab: 'tasks'
    },
    { 
      id: 'waiting',
      title: "Waiting Client", 
      value: waitingCount, 
      desc: "Pending feedback & signs", 
      icon: Clock, 
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      tab: 'engineering'
    },
    { 
      id: 'rfqs',
      title: "Active RFQs", 
      value: rfqCount, 
      desc: "Commercial pipeline quotes", 
      icon: DollarSign, 
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      tab: 'engineering'
    },
  ];

  // Action Center Queue Ingestion Chart Data
  const actionableDistribution = [
    { name: 'Need Reply', value: needReplyCount, fill: '#f43f5e' },
    { name: 'Overdue SLA', value: overdueCount, fill: '#f59e0b' },
    { name: 'Waiting Customer', value: waitingCount, fill: '#6366f1' },
    { name: 'Open RFQs', value: rfqCount, fill: '#10b981' },
    { name: 'Drawings Review', value: drawingsCount, fill: '#8b5cf6' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-blue-900 text-white p-6 rounded-2xl shadow-xs relative overflow-hidden border border-blue-950">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100/10 text-blue-100 border border-blue-200/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="h-3 w-3 animate-pulse" />
            Operations Control Center
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Engineering Work OS Action Center</h1>
          <p className="text-blue-100/80 text-sm max-w-xl font-normal">
            No forgotten customer emails, no missed SLA targets. Below are your real-time outstanding deliverables and communication pipelines needing immediate attention.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2">
          <button 
            onClick={onSync}
            disabled={syncLoading}
            className={`flex items-center gap-2 px-4 py-2.5 bg-white text-blue-900 hover:bg-slate-100 transition rounded-xl font-semibold text-sm shadow-xs cursor-pointer ${syncLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {syncLoading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-900"></span>
            ) : (
              <Sparkles className="h-4 w-4 text-blue-600" />
            )}
            {syncLoading ? 'Syncing...' : 'Yahoo Sync & AI Triage'}
          </button>
          <button 
            onClick={() => onAction('new-task')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white transition rounded-xl font-semibold text-sm border border-blue-700 shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Manual Action Item
          </button>
        </div>
        {/* Background visual graphics */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actionStatsCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i} 
              id={`kpi-card-${card.id}`}
              onClick={() => onNavigate(card.tab)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer p-5 rounded-2xl transition shadow-xs hover:shadow-md group flex items-start justify-between"
            >
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{card.value}</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{card.desc}</p>
              </div>
              <div className={`p-3 rounded-xl border ${card.color} transition-transform group-hover:scale-105`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Categories Switch Filter Bar */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'all', label: `All Actionable Work (${totalActionableItems})` },
          { id: 'emails', label: `Need Reply (${needReplyCount})` },
          { id: 'tasks', label: `Overdue SLA (${overdueCount})` },
          { id: 'engineering', label: `RFQs & Drawings (${rfqCount + drawingsCount})` },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryFilter(cat.id as any)}
            className={`px-5 py-3 border-b-2 text-xs font-bold transition-all -mb-px ${activeCategoryFilter === cat.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* CORE ACTIONABLE WORK PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Interactive Action Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Customer Communication Triage (Need Reply) */}
          {(activeCategoryFilter === 'all' || activeCategoryFilter === 'emails') && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-rose-500" />
                    Emails Requiring Action (Need Reply)
                  </h2>
                  <p className="text-xs text-slate-400">High-priority and client unreplied mail threads needing immediate drafts</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-rose-50 border border-rose-100 rounded-full font-bold text-rose-600 uppercase font-mono">
                  SLA Target: 2 hrs
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {needReplyEmails.length > 0 ? (
                  needReplyEmails.map(email => (
                    <div key={email.id} className="p-5 hover:bg-slate-50/50 transition flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-800">{email.senderName}</span>
                          <span className="text-[10px] text-slate-400">• {email.aiAnalysis?.company || 'External Contact'}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold font-mono rounded">
                            {email.category}
                          </span>
                          {email.priority === 'High' && (
                            <span className="text-[9px] px-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded font-black font-mono uppercase">
                              CRITICAL
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-700 leading-tight">
                          {email.subject}
                        </h4>
                        <p className="text-xs text-slate-500 italic bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-100/40">
                          <Sparkles className="h-3.5 w-3.5 inline mr-1 text-indigo-500" />
                          <strong>AI Extraction:</strong> "{email.aiAnalysis?.aiSummary || email.body.substring(0, 100) + '...'}"
                        </p>
                        {email.aiAnalysis?.requiredAction && (
                          <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <ArrowRight className="h-3 w-3 text-indigo-500" />
                            <strong>Required Action:</strong> {email.aiAnalysis.requiredAction}
                          </p>
                        )}
                      </div>

                      <div className="flex md:flex-col justify-end gap-2 shrink-0 self-start md:self-center">
                        <button 
                          onClick={() => onNavigate('email', { emailId: email.id })}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Inspect Thread
                        </button>
                        <button 
                          onClick={() => onNavigate('assistant', { initPrompt: `Help me draft a reply to email: "${email.subject}"` })}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                        >
                          <CornerUpLeft className="h-3.5 w-3.5" />
                          Reply with AI
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    🎉 Inbox fully processed! No outstanding unreplied emails detected.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 2: Overdue Tasks & Deliverables */}
          {(activeCategoryFilter === 'all' || activeCategoryFilter === 'tasks') && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Overdue Milestones & Tasks (SLA Breaches)
                  </h2>
                  <p className="text-xs text-slate-400">Action items past their committed delivery date needing escalation</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-full font-bold text-amber-700 uppercase font-mono">
                  SLA Blockers
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {overdueTasksList.length > 0 ? (
                  overdueTasksList.map(task => {
                    const cust = customers.find(c => c.id === task.customerId);
                    const proj = projects.find(p => p.id === task.projectId);
                    return (
                      <div key={task.id} className="p-5 hover:bg-slate-50/50 transition flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-800">{task.title}</span>
                            <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 border border-red-100 rounded font-bold font-mono">
                              OVERDUE BY {Math.round((Date.now() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))} DAYS
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 font-mono">
                              Due: {task.dueDate}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{task.description}</p>
                          <div className="flex gap-4 text-[11px] text-slate-400 font-semibold">
                            {cust && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" /> {cust.company}
                              </span>
                            )}
                            {proj && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5" /> Project: {proj.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0 self-start md:self-center">
                          <button 
                            onClick={() => onNavigate('tasks')}
                            className="px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition"
                          >
                            Update Progress
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    🟢 High five! No overdue milestones or SLA delivery breaches.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Engineering Tracking Pipelines (RFQs & Drawings) */}
          {(activeCategoryFilter === 'all' || activeCategoryFilter === 'engineering') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* RFQ Box */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50/40 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    Open RFQs Requiring Quotations
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">{actionableRfqs.length}</span>
                </div>
                <div className="p-4 divide-y divide-slate-50 flex-1 overflow-y-auto max-h-[300px]">
                  {actionableRfqs.length > 0 ? (
                    actionableRfqs.map(rfq => {
                      const cust = customers.find(c => c.id === rfq.customerId);
                      return (
                        <div key={rfq.id} className="py-3 flex justify-between items-center gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{rfq.title}</p>
                            <p className="text-[10px] text-slate-400">{cust?.company || 'General Client'} • SLA: {rfq.targetDeliveryDate}</p>
                          </div>
                          <button 
                            onClick={() => onNavigate('engineering')}
                            className="px-2 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded hover:bg-indigo-100 transition shrink-0"
                          >
                            Draft Quote
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">No active RFQs needing quotes.</div>
                  )}
                </div>
              </div>

              {/* Drawings Box */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50/40 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-purple-500" />
                    Drawings Under Review
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">{pendingDrawings.length}</span>
                </div>
                <div className="p-4 divide-y divide-slate-50 flex-1 overflow-y-auto max-h-[300px]">
                  {pendingDrawings.length > 0 ? (
                    pendingDrawings.map(dwg => {
                      const cust = customers.find(c => c.id === dwg.customerId);
                      return (
                        <div key={dwg.id} className="py-3 flex justify-between items-center gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{dwg.title}</p>
                            <p className="text-[10px] text-slate-400">No: {dwg.drawingNumber} • Rev: {dwg.revision} • Status: <span className="text-purple-600 font-bold">{dwg.status}</span></p>
                          </div>
                          <button 
                            onClick={() => onNavigate('engineering')}
                            className="px-2 py-1 text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 rounded hover:bg-purple-100 transition shrink-0"
                          >
                            Verify CAD
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">No drawings under review.</div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Section 4: Waiting on Customer Feedback / External dependencies */}
          {(activeCategoryFilter === 'all' || activeCategoryFilter === 'engineering') && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/40">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  Waiting on Customer Feedbacks (SLA Pause States)
                </h2>
                <p className="text-xs text-slate-400">Transactions where action is blockaded pending client response or credentials</p>
              </div>

              <div className="divide-y divide-slate-100">
                {waitingCustomerItems.length > 0 ? (
                  waitingCustomerItems.map((item, idx) => (
                    <div key={idx} className="p-4 hover:bg-slate-50/50 transition flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">{item.title}</p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          <strong>Awaiting blocker:</strong> <span className="text-indigo-600 italic">"{item.waitingFor}"</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Customer: {item.company} ({item.sender})
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 uppercase font-bold font-mono">
                        On Hold
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No items currently in Waiting status. Perfect operational alignment!
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Action Center Operations Queue & Metrics (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Today's Meetings */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" />
              Calendar Ingress (Today)
            </h2>
            
            <div className="space-y-3">
              {meetings && meetings.length > 0 ? (
                meetings.slice(0, 3).map((meet, idx) => (
                  <div key={meet.id || idx} className="flex items-center justify-between border border-slate-100 p-3 rounded-xl hover:border-indigo-100 transition">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-slate-800 text-xs truncate">{meet.title}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span>{meet.type}</span>
                        <span>•</span>
                        <span>{meet.duration} mins</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] bg-indigo-50 text-indigo-700 rounded-lg font-bold shrink-0">
                      {new Date(meet.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-400">No scheduled meetings today.</p>
                  <button 
                    onClick={() => onAction('new-meeting')}
                    className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 mx-auto"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Book Slot
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Center Workload Distribution Chart */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <h2 className="text-sm font-bold text-slate-800">Action Queue Distribution</h2>
            <p className="text-xs text-slate-400 mb-4">Total volume of outstanding work blocks</p>
            
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionableDistribution} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <XAxis type="number" fontSize={10} stroke="#64748b" axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" fontSize={10} stroke="#64748b" axisLine={false} tickLine={false} width={80} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                    {actionableDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 mb-3">System Utilities</h2>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onSync}
                disabled={syncLoading}
                className="flex flex-col items-center justify-center p-4 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 rounded-xl transition border border-indigo-100/50 text-center gap-1.5 group cursor-pointer"
              >
                <Sparkles className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition" />
                <span className="text-xs font-bold text-slate-800">Trigger Mail Ingress</span>
                <span className="text-[10px] text-slate-400">Run AI email pipeline</span>
              </button>
              
              <button 
                onClick={() => onNavigate('automations')}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition border border-slate-200 text-center gap-1.5 group cursor-pointer"
              >
                <Play className="h-5 w-5 text-slate-500 group-hover:scale-110 transition" />
                <span className="text-xs font-bold text-slate-800">Automation Engine</span>
                <span className="text-[10px] text-slate-400">Configure triggers</span>
              </button>
            </div>
          </div>

          {/* Operations Activity Feed */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-indigo-600" />
                Operations Activity
              </h2>
              <button 
                onClick={() => onNavigate('logs')}
                className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold"
              >
                Full Logs
              </button>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {activities && activities.length > 0 ? (
                activities.slice(0, 6).map((act, idx) => {
                  let badgeColor = "bg-slate-100 text-slate-600";
                  if (act.type === 'email') badgeColor = "bg-blue-50 text-blue-700 border-blue-100";
                  if (act.type === 'task') badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  if (act.type === 'customer') badgeColor = "bg-purple-50 text-purple-700 border-purple-100";
                  if (act.type === 'project') badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-100";
                  
                  return (
                    <div key={act.id || idx} className="flex gap-2.5 text-xs items-start relative group">
                      {idx !== activities.length - 1 && (
                        <div className="absolute left-3.5 top-7 bottom-0 w-0.5 bg-slate-100"></div>
                      )}
                      <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-bold uppercase shrink-0 ${badgeColor}`}>
                        {act.type.substring(0, 2)}
                      </span>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex justify-between items-center gap-2">
                          <p className="font-bold text-slate-800 truncate">{act.title}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{act.description}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">No activities logged yet.</div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
