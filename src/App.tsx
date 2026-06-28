/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Mail, CheckSquare, Briefcase, Users, Calendar, 
  FileText, Folder, Layers, Terminal, Sparkles, Settings, 
  Bell, Search, RefreshCw, User, ShieldCheck, HeartPulse, ChevronRight, Check, Cpu,
  Phone, MessageSquare, LogOut, Menu, ChevronLeft, Sun, Moon, HelpCircle, Activity, LayoutGrid
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
import WhatsappCenter from './components/WhatsappCenter';
import LoginScreen from './components/LoginScreen';
import CommandPalette from './components/CommandPalette';
import RightAiPanel from './components/RightAiPanel';
import { useTheme } from './contexts/ThemeContext';

import { Email, Task, Project, Customer, FileItem, Rfq, Drawing, Quotation, PurchaseOrder, Invoice, EmailThread } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeCommSubTab, setActiveCommSubTab] = useState<string>('email');
  const [activeWorkSubTab, setActiveWorkSubTab] = useState<string>('tasks');
  const [activeDocSubTab, setActiveDocSubTab] = useState<string>('files');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userRoleOverride, setUserRoleOverride] = useState<string | null>(null);
  const userDropdownRef = React.useRef<HTMLDivElement>(null);
  const [tabParam, setTabParam] = useState<any>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isUserDropdownOpen]);

  // Theme support
  const { theme, resolvedTheme, setTheme } = useTheme();

  // Collapsible and overlay state parameters
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Authentication & Multi-user session persistence
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('work_os_user');
    return saved ? JSON.parse(saved) : null;
  });


  const handleLogin = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem('work_os_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('work_os_user');
  };

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
    setTabParam(param);

    // Grouping mapping
    if (tab === 'email' || tab === 'whatsapp' || tab === 'calendar' || tab === 'communications') {
      setActiveTab('communications');
      if (tab !== 'communications') {
        setActiveCommSubTab(tab);
      }
      if (tab === 'email' && param?.emailId) {
        setSelectedEmailId(param.emailId);
      }
    } else if (tab === 'tasks' || tab === 'projects' || tab === 'engineering' || tab === 'automations' || tab === 'work') {
      setActiveTab('work');
      if (tab !== 'work') {
        setActiveWorkSubTab(tab);
      }
      if (tab === 'projects' && param?.projectId) {
        setSelectedProjectId(param.projectId);
      }
    } else if (tab === 'files' || tab === 'notes' || tab === 'logs' || tab === 'documents') {
      setActiveTab('documents');
      if (tab !== 'documents') {
        setActiveDocSubTab(tab);
      }
    } else if (tab === 'customers' || tab === 'crm') {
      setActiveTab('crm');
      if (tab === 'customers' && param?.customerId) {
        setSelectedCustomerId(param.customerId);
      }
    } else if (tab === 'assistant' || tab === 'ai') {
      setActiveTab('ai');
    } else if (tab === 'settings') {
      setActiveTab('settings');
    } else {
      setActiveTab(tab);
    }
  };

  const handleDashboardAction = (action: string) => {
    if (action === 'new-task') {
      handleDeepNavigate('tasks');
    } else if (action === 'new-meeting') {
      handleDeepNavigate('calendar');
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'communications', label: 'Communications', icon: Mail, badge: emails.filter(e => e.unread && !e.deleted).length },
    { id: 'crm', label: 'CRM', icon: Users },
    { id: 'work', label: 'Work', icon: CheckSquare, badge: tasks.filter(t => t.status !== 'Completed').length },
    { id: 'documents', label: 'Documents', icon: Folder },
    { id: 'ai', label: 'AI', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Intercept logged-out session state
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const activeRole = userRoleOverride || currentUser.role || 'user';

  return (
    <div className="flex h-screen bg-slate-900 text-slate-800 font-sans overflow-hidden transition-colors duration-200">
      
      {/* Sidebar Navigation */}
      <aside className={`bg-blue-600 border-r border-blue-700/50 flex flex-col justify-between shrink-0 z-20 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-60'}`}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Branding */}
          <div className="p-4 flex items-center justify-between border-b border-blue-700/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm border border-blue-500/30">
                <LayoutGrid className="w-4 h-4 text-white" />
              </div>
              {!isSidebarCollapsed && (
                <div className="space-y-0.5 animate-fade-in truncate">
                  <h1 className="text-xs font-bold tracking-tight text-white uppercase">Work OS V2</h1>
                  <span className="text-[9px] text-blue-200 font-bold uppercase tracking-wider block">Geometric Suite</span>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="p-1.5 hover:bg-blue-700 text-blue-200 hover:text-white rounded-lg transition"
            >
              <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {sidebarItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <div key={item.id} className="group relative w-full">
                  <button
                    onClick={() => handleDeepNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      active 
                        ? 'bg-blue-700 text-white font-bold border-l-4 border-blue-100 shadow-sm' 
                        : 'text-blue-100 hover:bg-blue-700/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4.5 w-4.5 ${active ? 'text-white' : 'text-blue-200'}`} />
                      {!isSidebarCollapsed && <span className="animate-fade-in truncate">{item.label}</span>}
                    </div>
                    {!isSidebarCollapsed && item.badge && item.badge > 0 ? (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${active ? 'bg-blue-800 text-white' : 'bg-red-500/80 text-white'}`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </button>

                  {/* Hover Tooltip - only visible when collapsed */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-md whitespace-nowrap z-50 border border-slate-800">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Account footer */}
        <div className="p-4 mt-auto border-t border-blue-700/40 flex items-center justify-between relative" ref={userDropdownRef}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              title="User Settings"
              className="w-9 h-9 rounded-full bg-blue-700 hover:bg-blue-800 active:scale-95 transition flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm cursor-pointer shrink-0 relative border border-blue-500/20"
            >
              {currentUser.name.substring(0, 2)}
            </button>
            {!isSidebarCollapsed && (
              <span className="text-xs font-semibold text-blue-100 truncate max-w-[100px] animate-fade-in">
                {currentUser.name}
              </span>
            )}
          </div>
          
          {!isSidebarCollapsed && (
            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-1.5 hover:bg-blue-700 text-blue-200 hover:text-white rounded-lg transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}

          {/* Dropdown Menu */}
          {isUserDropdownOpen && (
            <div className="absolute bottom-full mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 min-w-[180px] z-50 animate-fade-in left-4">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 mb-1">
                User Options
              </div>
              <button
                onClick={() => {
                  setIsUserDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg transition cursor-pointer"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  setIsUserDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg transition cursor-pointer"
              >
                My Account
              </button>
              <button
                onClick={() => {
                  handleDeepNavigate('settings');
                  setIsUserDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg transition cursor-pointer"
              >
                Settings
              </button>
              <button
                onClick={() => {
                  setIsUserDropdownOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition cursor-pointer"
              >
                Logout
              </button>

              {currentUser.role?.toLowerCase() === 'admin' && (
                <>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    Admin Tools
                  </div>
                  <button
                    onClick={() => {
                      setUserRoleOverride('user');
                      setIsUserDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${activeRole === 'user' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                  >
                    Switch to User View
                  </button>
                  <button
                    onClick={() => {
                      setUserRoleOverride('admin');
                      setIsUserDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${activeRole === 'admin' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                  >
                    Switch to Admin View
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-slate-50 dark:bg-slate-950">
        
        {/* Top Header bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sm:px-8 shrink-0 relative z-10 transition-colors duration-200">
          
          {/* Breadcrumb Trail & Search trigger */}
          <div className="flex items-center gap-6 min-w-0">
            <div className="hidden lg:flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-semibold shrink-0">
              <span>Work OS</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-700 dark:text-slate-300 capitalize font-bold">
                {sidebarItems.find(i => i.id === activeTab)?.label}
              </span>
              {activeTab === 'communications' && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-blue-600 dark:text-blue-400 font-bold capitalize">
                    {activeCommSubTab === 'whatsapp' ? 'WhatsApp AI' : activeCommSubTab}
                  </span>
                </>
              )}
              {activeTab === 'work' && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-blue-600 dark:text-blue-400 font-bold capitalize">
                    {activeWorkSubTab}
                  </span>
                </>
              )}
              {activeTab === 'documents' && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-blue-600 dark:text-blue-400 font-bold capitalize">
                    {activeDocSubTab}
                  </span>
                </>
              )}
            </div>

            {/* Global Search shortcut button */}
            <button 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-xl transition duration-150 text-xs text-left w-52 sm:w-64 cursor-pointer"
            >
              <Search className="h-4 w-4 text-slate-400" />
              <span className="flex-1 text-slate-500 dark:text-slate-400">Search Workspace...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xs">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Quick Actions Panel */}
          <div className="flex items-center gap-4">
            
            {/* Real-time Clock */}
            <div className="hidden xl:flex flex-col items-end shrink-0">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 hidden xl:block"></div>

            {/* Sync trigger in header */}
            <button
              onClick={handleSyncYahoo}
              disabled={syncLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-xl transition text-xs font-semibold cursor-pointer ${syncLoading ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${syncLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{syncLoading ? 'Syncing...' : 'Sync Mail'}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={() => {
                const nextTheme = theme === 'classic' ? 'midnight' : (theme === 'midnight' ? 'light' : 'classic');
                setTheme(nextTheme);
              }}
              title={`Switch Theme (Current: ${theme === 'classic' ? 'Work OS Classic' : theme === 'midnight' ? 'Midnight' : 'Light'})`}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer border border-transparent dark:border-slate-800 flex items-center justify-center"
            >
              {theme === 'midnight' ? (
                <Moon className="h-4.5 w-4.5 text-emerald-400" />
              ) : theme === 'light' ? (
                <Sun className="h-4.5 w-4.5 text-amber-500" />
              ) : (
                <Sparkles className="h-4.5 w-4.5 text-blue-600" />
              )}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationTray(!showNotificationTray)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition relative cursor-pointer border border-transparent dark:border-slate-800"
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Push Alerts Drawer */}
              {showNotificationTray && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 space-y-3.5 z-30 animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Operational Alerts</span>
                    <button 
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => markNotificationRead(notif.id)}
                        className={`p-2.5 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-1 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition relative ${!notif.read ? 'bg-blue-50/10 dark:bg-blue-950/10 border-l-4 border-blue-500' : ''}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-slate-800 dark:text-slate-200 leading-snug">{notif.title}</p>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">{notif.message}</p>
                        {!notif.read && (
                          <span className="absolute right-2.5 bottom-2.5 text-[9px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5">
                            <Check className="h-3 w-3" />
                            Marked Read
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible Sidekick trigger */}
            <button 
              onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
              title="Toggle AI Sidekick Copilot"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer border border-transparent dark:border-slate-800"
            >
              <Sparkles className={`h-4.5 w-4.5 ${isAiPanelOpen ? 'text-blue-600 dark:text-blue-400 fill-current' : ''}`} />
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4 shrink-0">
              <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold border border-blue-100 dark:border-blue-800 uppercase shrink-0">
                {currentUser.name.substring(0, 2)}
              </span>
              <span className="hidden md:inline text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{currentUser.name}</span>
            </div>
          </div>
        </header>

        {/* Workspace Dynamic Viewer */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Sub-navigation bar for grouped tabs */}
            {['communications', 'work', 'documents'].includes(activeTab) && (
              <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex items-center gap-1 shrink-0 animate-fade-in transition-colors duration-200">
                {activeTab === 'communications' && [
                  { id: 'email', label: 'Email Center', icon: Mail, badge: emails.filter(e => e.unread && !e.deleted).length },
                  { id: 'whatsapp', label: 'WhatsApp AI', icon: Phone },
                  { id: 'calendar', label: 'Calendar', icon: Calendar }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveCommSubTab(sub.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${activeCommSubTab === sub.id ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'}`}
                  >
                    <sub.icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span>{sub.label}</span>
                    {sub.badge && sub.badge > 0 ? (
                      <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold ml-1">
                        {sub.badge}
                      </span>
                    ) : null}
                  </button>
                ))}

                {activeTab === 'work' && [
                  { id: 'tasks', label: 'Task Manager', icon: CheckSquare, badge: tasks.filter(t => t.status !== 'Completed').length },
                  { id: 'projects', label: 'Projects', icon: Briefcase },
                  { id: 'engineering', label: 'Engineering', icon: Cpu },
                  { id: 'automations', label: 'Automations', icon: Layers }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveWorkSubTab(sub.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${activeWorkSubTab === sub.id ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'}`}
                  >
                    <sub.icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span>{sub.label}</span>
                    {sub.badge && sub.badge > 0 ? (
                      <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold ml-1">
                        {sub.badge}
                      </span>
                    ) : null}
                  </button>
                ))}

                {activeTab === 'documents' && [
                  { id: 'files', label: 'Files Vault', icon: Folder },
                  { id: 'notes', label: 'Notes Hub', icon: FileText },
                  { id: 'logs', label: 'System Logs', icon: Terminal }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveDocSubTab(sub.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${activeDocSubTab === sub.id ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'}`}
                  >
                    <sub.icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span>{sub.label}</span>
                  </button>
                ))}
              </div>
            )}

            <main className="flex-1 overflow-hidden p-6 sm:p-8">
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

              {activeTab === 'communications' && activeCommSubTab === 'whatsapp' && (
                <WhatsappCenter 
                  emails={emails}
                  tasks={tasks}
                  projects={projects}
                  customers={customers}
                  rfqs={rfqs}
                  drawings={drawings}
                  quotations={quotations}
                  invoices={invoices}
                  pos={pos}
                  onNavigate={handleDeepNavigate}
                />
              )}

              {activeTab === 'communications' && activeCommSubTab === 'email' && (
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

              {activeTab === 'work' && activeWorkSubTab === 'tasks' && (
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

              {activeTab === 'work' && activeWorkSubTab === 'projects' && (
                <Projects 
                  projects={projects}
                  customers={customers}
                  selectedProjectId={selectedProjectId}
                  onSelectProject={setSelectedProjectId}
                  onCreateProject={handleCreateProject}
                  onNavigate={handleDeepNavigate}
                />
              )}

              {activeTab === 'work' && activeWorkSubTab === 'engineering' && (
                <EngineeringWorkspace 
                  customers={customers}
                  projects={projects}
                  onNavigate={handleDeepNavigate}
                />
              )}

              {activeTab === 'crm' && (
                <Customers 
                  customers={customers}
                  selectedCustomerId={selectedCustomerId}
                  onSelectCustomer={setSelectedCustomerId}
                  onCreateCustomer={handleCreateCustomer}
                  onNavigate={handleDeepNavigate}
                />
              )}

              {activeTab === 'communications' && activeCommSubTab === 'calendar' && (
                <CalendarView 
                  meetings={meetings}
                  tasks={tasks}
                  customers={customers}
                  onCreateMeeting={handleCreateMeeting}
                />
              )}

              {activeTab === 'documents' && activeDocSubTab === 'notes' && (
                <NotesHub 
                  customers={customers}
                  projects={projects}
                />
              )}

              {activeTab === 'documents' && activeDocSubTab === 'files' && (
                <FilesVault 
                  customers={customers}
                  projects={projects}
                />
              )}

              {activeTab === 'work' && activeWorkSubTab === 'automations' && (
                <Automations />
              )}

              {activeTab === 'documents' && activeDocSubTab === 'logs' && (
                <SystemLogs />
              )}

              {activeTab === 'ai' && (
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

          {/* Collapsible Right AI Panel */}
          <RightAiPanel 
            isOpen={isAiPanelOpen} 
            onToggle={() => setIsAiPanelOpen(!isAiPanelOpen)} 
            onNavigate={handleDeepNavigate} 
          />
        </div>

      </div>

      {/* Ctrl + K Command Palette Overlay */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleDeepNavigate}
        emails={emails}
        tasks={tasks}
        projects={projects}
        customers={customers}
      />

    </div>
  );
}
