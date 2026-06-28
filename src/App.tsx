/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Mail, CheckSquare, Briefcase, Users, Calendar, 
  FileText, Folder, Layers, Terminal, Sparkles, Settings, 
  Bell, Search, RefreshCw, User, ShieldCheck, HeartPulse, ChevronRight, Check, Cpu
} from 'lucide-react';

// Import our modular components
import Dashboard from './components/Dashboard';
import EmailCenter from './components/EmailCenter';
import TaskManager from './components/TaskManager';
import Projects from './components/Projects';
import Customers from './components/Customers';
import CalendarView from './components/CalendarView';
import NotesHub from './components/NotesHub';
import FilesVault from './components/FilesVault';
import Automations from './components/Automations';
import SystemLogs from './components/SystemLogs';
import AiAssistant from './components/AiAssistant';
import SettingsPanel from './components/SettingsPanel';
import EngineeringWorkspace from './components/EngineeringWorkspace';

import { Email, Task, Project, Customer, FileItem, Rfq, Drawing, Quotation, PurchaseOrder, Invoice, EmailThread } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tabParam, setTabParam] = useState<any>(null);

  // Core relational state
  const [emails, setEmails] = useState<Email[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  
  // Engineering trackers states
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [threads, setThreads] = useState<EmailThread[]>([]);

  // Alerts & Notifications state
  const [notifications, setNotifications] = useState<any[]>([
    { id: '1', title: '🚨 High Priority RFQ Ingress', message: 'New specifications received from Apex Alloys matching Titanium Grade 5.', read: false, time: '2m ago' },
    { id: '2', title: '⚙️ Drawing Auto-organized', message: 'Precision Robotics drawing was automatically sorted into the CRM blueprint vault.', read: false, time: '10m ago' },
    { id: '3', title: '📅 Briefing Call Booked', message: 'Precision Robotics scheduled a CAD orthographic review for 10:00 UTC.', read: true, time: '1h ago' }
  ]);
  const [showNotificationTray, setShowNotificationTray] = useState(false);

  // Ingress sync triggers
  const [syncLoading, setSyncLoading] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [emailsRes, tasksRes, projectsRes, customersRes, meetingsRes, statsRes, rfqsRes, drawingsRes, quotesRes, posRes, invoicesRes, threadsRes] = await Promise.all([
        fetch('/api/emails').then(r => r.json()),
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/meetings').then(r => r.json()),
        fetch('/api/dashboard-stats').then(r => r.json()),
        fetch('/api/engineering/rfqs').then(r => r.json()),
        fetch('/api/engineering/drawings').then(r => r.json()),
        fetch('/api/engineering/quotations').then(r => r.json()),
        fetch('/api/engineering/pos').then(r => r.json()),
        fetch('/api/engineering/invoices').then(r => r.json()),
        fetch('/api/emails/threads').then(r => r.json())
      ]);

      setEmails(emailsRes);
      setTasks(tasksRes);
      setProjects(projectsRes);
      setCustomers(customersRes);
      setMeetings(meetingsRes);
      setStats(statsRes);
      setActivities(statsRes?.activities || []);
      
      setRfqs(rfqsRes || []);
      setDrawings(drawingsRes || []);
      setQuotations(quotesRes || []);
      setPos(posRes || []);
      setInvoices(invoicesRes || []);
      setThreads(threadsRes || []);
      
      // Auto-select first indices
      if (emailsRes.length > 0 && !selectedEmailId) setSelectedEmailId(emailsRes[0].id);
      if (customersRes.length > 0 && !selectedCustomerId) setSelectedCustomerId(customersRes[0].id);
      if (projectsRes.length > 0 && !selectedProjectId) setSelectedProjectId(projectsRes[0].id);
    } catch (err) {
      console.error("Error loading core Work OS data:", err);
    }
  };

  const handleSyncYahoo = async () => {
    setSyncLoading(true);
    try {
      // Create new notification about sync initiation
      const initAlert = {
        id: `nt_${Date.now()}`,
        title: '🔄 Syncing Yahoo Inbox...',
        message: 'The automated SMTP polling client has locked connection. Parsing payload via Gemini API.',
        read: false,
        time: 'Just now'
      };
      setNotifications(prev => [initAlert, ...prev]);

      const res = await fetch('/api/emails/sync', { method: 'POST' });
      const data = await res.json();
      
      // Append a success notification
      const successAlert = {
        id: `nt_sc_${Date.now()}`,
        title: '✨ Yahoo Ingress Complete',
        message: `Synced ${data.syncedCount} conversations. Successfully mapped active tasks & customer sentiment.`,
        read: false,
        time: 'Just now'
      };
      setNotifications(prev => [successAlert, ...prev]);

      await fetchInitialData();
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleForceAnalyze = async (emailId: string) => {
    try {
      const res = await fetch(`/api/emails/${emailId}/analyze`, { method: 'POST' });
      const updated = await res.json();
      
      // Update email in local list
      setEmails(prev => prev.map(e => e.id === emailId ? updated : e));
      
      const alert = {
        id: `nt_an_${Date.now()}`,
        title: '🧠 Gemini Triage Refined',
        message: `Refreshed analysis matrices for: "${updated.subject}"`,
        read: false,
        time: 'Just now'
      };
      setNotifications(prev => [alert, ...prev]);
      await fetchInitialData();
    } catch (err) {
      console.error("Analysis failed:", err);
    }
  };

  // Mutators passed down
  const handleUpdateEmail = async (id: string, updates: Partial<Email>) => {
    try {
      const res = await fetch(`/api/emails/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updated = await res.json();
      setEmails(prev => prev.map(e => e.id === id ? updated : e));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (task: Partial<Task>) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      const created = await res.json();
      setTasks(prev => [created, ...prev]);
      await fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updated = await res.json();
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      await fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
      await fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomer = async (cust: Partial<Customer>) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cust)
      });
      const created = await res.json();
      setCustomers(prev => [created, ...prev]);
      setSelectedCustomerId(created.id);
      await fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async (proj: Partial<Project>) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proj)
      });
      const created = await res.json();
      setProjects(prev => [created, ...prev]);
      setSelectedProjectId(created.id);
      await fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMeeting = async (meet: any) => {
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meet)
      });
      const created = await res.json();
      setMeetings(prev => [created, ...prev]);
      await fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeepNavigate = (tab: string, param?: any) => {
    setActiveTab(tab);
    setTabParam(param);

    // Map parameters back to selected values
    if (tab === 'email' && param?.emailId) {
      setSelectedEmailId(param.emailId);
    }
    if (tab === 'customers' && param?.customerId) {
      setSelectedCustomerId(param.customerId);
    }
    if (tab === 'projects' && param?.projectId) {
      setSelectedProjectId(param.projectId);
    }
  };

  const handleDashboardAction = (action: string) => {
    if (action === 'new-task') {
      setActiveTab('tasks');
    } else if (action === 'new-meeting') {
      setActiveTab('calendar');
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Action Center', icon: LayoutDashboard },
    { id: 'email', label: 'Email Center', icon: Mail, badge: emails.filter(e => e.unread && !e.deleted).length },
    { id: 'tasks', label: 'Task Manager', icon: CheckSquare, badge: tasks.filter(t => t.status !== 'Completed').length },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'engineering', label: 'Engineering Workspace', icon: Cpu },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'notes', label: 'Notes Hub', icon: FileText },
    { id: 'files', label: 'Files Vault', icon: Folder },
    { id: 'automations', label: 'Automations', icon: Layers },
    { id: 'logs', label: 'System Logs', icon: Terminal },
    { id: 'assistant', label: 'AI Assistant', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 z-20">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Branding */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-100">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
              <div className="w-4 h-4 bg-white rounded-xs"></div>
            </div>
            <div className="space-y-0.5">
              <h1 className="text-sm font-bold tracking-tight text-slate-800 uppercase">Work OS</h1>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Geometric Core</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {sidebarItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleDeepNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition duration-150 ${active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 ${active ? 'text-blue-700' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Account footer */}
        <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white uppercase">
              AD
            </span>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-semibold truncate text-slate-800">Administrator</p>
              <p className="text-[10px] text-slate-500 truncate">programjilanee@gmail.com</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold px-1 uppercase">
            <span>SLA: Optimal</span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Active
            </span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Header bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              {sidebarItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          {/* Quick Actions Panel */}
          <div className="flex items-center gap-4">
            {/* Sync trigger in header */}
            <button
              onClick={handleSyncYahoo}
              disabled={syncLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-600 bg-white rounded-lg transition text-xs font-medium ${syncLoading ? 'bg-slate-50' : ''}`}
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${syncLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{syncLoading ? 'Syncing Yahoo...' : 'Yahoo Mail Sync'}</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationTray(!showNotificationTray)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition relative"
              >
                <Bell className="h-5 w-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-full"></span>
                )}
              </button>

              {/* Push Alerts Drawer */}
              {showNotificationTray && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-xl p-4 space-y-3 z-30">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">Operational Alerts</span>
                    <button 
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      className="text-[10px] text-blue-600 font-bold hover:text-blue-700"
                    >
                      Mark all read
                    </button>
                  </div>
                  
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => markNotificationRead(notif.id)}
                        className={`p-2.5 border border-slate-100 rounded-lg space-y-1 text-xs cursor-pointer hover:bg-slate-50 transition relative ${!notif.read ? 'bg-blue-50/10 border-l-4 border-blue-500' : ''}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-slate-800">{notif.title}</p>
                          <span className="text-[9px] text-slate-400 font-mono shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed">{notif.message}</p>
                        {!notif.read && (
                          <span className="absolute right-2.5 bottom-2.5 text-[9px] text-blue-600 font-bold flex items-center gap-0.5">
                            <Check className="h-3 w-3" />
                            Read
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-100">
                AD
              </span>
              <span className="hidden md:inline text-xs font-bold text-slate-700">Administrator</span>
            </div>
          </div>
        </header>

        {/* Workspace Dynamic Viewer */}
        <main className="flex-1 overflow-hidden p-8">
          {activeTab === 'dashboard' && (
            <Dashboard 
              stats={stats}
              activities={activities}
              meetings={meetings}
              onAction={handleDashboardAction}
              onNavigate={handleDeepNavigate}
              syncLoading={syncLoading}
              onSync={handleSyncYahoo}
              emails={emails}
              tasks={tasks}
              projects={projects}
              customers={customers}
              rfqs={rfqs}
              drawings={drawings}
              quotations={quotations}
              invoices={invoices}
              pos={pos}
            />
          )}

          {activeTab === 'email' && (
            <EmailCenter 
              emails={emails}
              selectedEmailId={selectedEmailId}
              onSelectEmail={setSelectedEmailId}
              onUpdateEmail={handleUpdateEmail}
              onForceAnalyze={handleForceAnalyze}
              onNavigate={handleDeepNavigate}
              onSync={handleSyncYahoo}
              syncLoading={syncLoading}
              tasks={tasks}
              projects={projects}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskManager 
              tasks={tasks}
              customers={customers}
              projects={projects}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onNavigate={handleDeepNavigate}
            />
          )}

          {activeTab === 'projects' && (
            <Projects 
              projects={projects}
              customers={customers}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              onCreateProject={handleCreateProject}
              onNavigate={handleDeepNavigate}
            />
          )}

          {activeTab === 'engineering' && (
            <EngineeringWorkspace 
              customers={customers}
              projects={projects}
              onNavigate={handleDeepNavigate}
            />
          )}

          {activeTab === 'customers' && (
            <Customers 
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={setSelectedCustomerId}
              onCreateCustomer={handleCreateCustomer}
              onNavigate={handleDeepNavigate}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView 
              meetings={meetings}
              tasks={tasks}
              customers={customers}
              onCreateMeeting={handleCreateMeeting}
            />
          )}

          {activeTab === 'notes' && (
            <NotesHub 
              customers={customers}
              projects={projects}
            />
          )}

          {activeTab === 'files' && (
            <FilesVault 
              customers={customers}
              projects={projects}
            />
          )}

          {activeTab === 'automations' && (
            <Automations />
          )}

          {activeTab === 'logs' && (
            <SystemLogs />
          )}

          {activeTab === 'assistant' && (
            <AiAssistant 
              initialPrompt={tabParam?.initPrompt || null}
              onNavigate={handleDeepNavigate}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel />
          )}
        </main>

      </div>
    </div>
  );
}
