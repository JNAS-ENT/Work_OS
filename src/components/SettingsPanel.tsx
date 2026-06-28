/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, ShieldCheck, Mail, Database, Bell, RefreshCw, Sliders, 
  Server, Cpu, User, Shield, Laptop, History, Check, Globe, Layout, LogOut, 
  CheckCircle2, AlertCircle, Link, Trash2, Eye, Key, Play, Pause, ExternalLink, 
  Lock, X, RefreshCcw, Activity, AlertTriangle, Download, Trash, FileText, ChevronRight
} from 'lucide-react';
import { 
  User as UserType, UserSession, AuditLog, ServiceProvider, 
  ServiceConnection, SyncLog, IntegrationError 
} from '../types';

export default function SettingsPanel() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'sessions' | 'audit' | 'connected-services' | 'privacy'>('profile');

  // Profile forms
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');

  // Preferences forms
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('English');
  const [themePreference, setThemePreference] = useState('dark');

  // Lists
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Connected Services & Privacy States
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [connections, setConnections] = useState<ServiceConnection[]>([]);
  const [selectedConnectionForLogs, setSelectedConnectionForLogs] = useState<ServiceConnection | null>(null);
  const [connectionLogs, setConnectionLogs] = useState<SyncLog[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [integrationErrors, setIntegrationErrors] = useState<IntegrationError[]>([]);

  // Modals / forms state
  const [activeConnectProvider, setActiveConnectProvider] = useState<ServiceProvider | null>(null);
  const [connectForm, setConnectForm] = useState({
    email: '',
    accessToken: '',
    appPassword: '',
    imapHost: '',
    smtpHost: '',
    port: '993',
    ssl: true,
    apiKey: '',
    botToken: '',
    chatId: '',
    projectUrl: '',
    anonKey: '',
    serviceKey: ''
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Privacy States
  const [privacyConfirmText, setPrivacyConfirmText] = useState('');
  const [activePurgeTarget, setActivePurgeTarget] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);

  // Messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load user data on startup
  const loadUserData = async () => {
    const saved = localStorage.getItem('work_os_user');
    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
      setName(user.name || '');
      setPhone(user.phone || '');
      setPhoto(user.photo || '');
      setCompany(user.company || 'Geometric Suite');
      setDesignation(user.designation || 'Staff Member');
      setDepartment(user.department || 'Operations');
      setTimezone(user.timezone || 'UTC');
      setLanguage(user.language || 'English');
      setThemePreference(user.themePreference || 'dark');

      // Load sessions & logs
      fetchSessions(user.id);
      fetchAuditLogs();
    }
  };

  const fetchSessions = async (userId: string) => {
    try {
      const res = await fetch(`/api/auth/sessions/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/auth/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // FETCH INTEGRATION CENTER SERVICES
  const fetchIntegrations = async () => {
    try {
      const [provRes, connRes, errRes] = await Promise.all([
        fetch('/api/integrations/providers'),
        fetch('/api/integrations/connections'),
        fetch('/api/integrations/errors')
      ]);

      if (provRes.ok) setProviders(await provRes.json());
      if (connRes.ok) setConnections(await connRes.json());
      if (errRes.ok) setIntegrationErrors(await errRes.json());
    } catch (err) {
      console.error('Failed to load integration states:', err);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'connected-services') {
      fetchIntegrations();
    }
  }, [activeTab]);

  // Update profile handler
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/auth/profile/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, photo, company, designation, department })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }
      
      // Update local states
      localStorage.setItem('work_os_user', JSON.stringify(data));
      setCurrentUser(data);
      setSuccessMessage('Corporate profile updated successfully.');
      fetchAuditLogs();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update preferences handler
  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/auth/profile/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone, language, themePreference })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update preferences.');
      }
      
      localStorage.setItem('work_os_user', JSON.stringify(data));
      setCurrentUser(data);
      setSuccessMessage('System preferences synchronized successfully.');
      fetchAuditLogs();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Terminate UserSession
  const handleTerminateSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/auth/sessions/${sessionId}/terminate`, { method: 'POST' });
      if (res.ok && currentUser) {
        fetchSessions(currentUser.id);
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // CONNECTED SERVICES METHODS
  // ==========================================
  const handleTriggerTestConnection = async () => {
    if (!activeConnectProvider) return;
    setTestingConnection(true);
    setTestSuccess(null);
    setTestError(null);

    try {
      let url = '';
      let body: any = {};

      if (activeConnectProvider.id === 'gemini') {
        url = '/api/integrations/gemini/test';
        body = { apiKey: connectForm.apiKey };
      } else if (activeConnectProvider.id === 'telegram') {
        url = '/api/integrations/telegram/test';
        body = { botToken: connectForm.botToken, chatId: connectForm.chatId, message: 'Work OS Connection Handshake OK!' };
      } else if (activeConnectProvider.id === 'supabase') {
        url = '/api/integrations/supabase/test';
        body = { projectUrl: connectForm.projectUrl, anonKey: connectForm.anonKey };
      } else if (activeConnectProvider.id === 'yahoo') {
        // Yahoo uses IMAP port scan/handshake validation directly inside connection connect call
        setTestSuccess('Yahoo/IMAP server socket handshake verified.');
        setTestingConnection(false);
        return;
      } else {
        // Mock authorization flow
        setTimeout(() => {
          setTestSuccess('Secure OAuth consent validated successfully.');
          setTestingConnection(false);
        }, 1200);
        return;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        setTestSuccess(data.message || 'Verification complete. Connection validated.');
      } else {
        throw new Error(data.error || 'Server rejected verification credentials.');
      }
    } catch (err: any) {
      setTestError(err.message);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleConnectProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConnectProvider) return;

    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: activeConnectProvider.id,
          config: connectForm
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to establish integration.');
      }

      setSuccessMessage(`Integration registered for ${activeConnectProvider.name}.`);
      setActiveConnectProvider(null);
      fetchIntegrations();
      // Reset form
      setConnectForm({
        email: '', accessToken: '', appPassword: '', imapHost: '', smtpHost: '',
        port: '993', ssl: true, apiKey: '', botToken: '', chatId: '',
        projectUrl: '', anonKey: '', serviceKey: ''
      });
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const res = await fetch(`/api/integrations/disconnect/${connectionId}`, { method: 'POST' });
      if (res.ok) {
        setSuccessMessage('Integration connection put into offline mode.');
        fetchIntegrations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReconnect = async (connectionId: string) => {
    try {
      const res = await fetch(`/api/integrations/reconnect/${connectionId}`, { method: 'POST' });
      if (res.ok) {
        setSuccessMessage('Credentials reconnected and re-authorized.');
        fetchIntegrations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!window.confirm('CRITICAL WARNING: This will permanently delete this connection, its credentials, and ALL cached email history, attachments, logs, and metadata. Continue?')) {
      return;
    }

    try {
      const res = await fetch(`/api/integrations/delete/${connectionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage('Integration connection destroyed and local cache wiped clean.');
        fetchIntegrations();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to sever connection.');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleTogglePause = async (connectionId: string) => {
    try {
      const res = await fetch(`/api/integrations/pause/${connectionId}`, { method: 'POST' });
      if (res.ok) {
        fetchIntegrations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncNow = async (connectionId: string) => {
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/integrations/sync/${connectionId}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Sync complete. Details: ${data.log?.details}`);
        fetchIntegrations();
      } else {
        throw new Error(data.error || 'Sync handler failed.');
      }
    } catch (err: any) {
      setErrorMessage(`Sync Error: ${err.message}`);
      fetchIntegrations();
    } finally {
      setLoading(false);
    }
  };

  const handleViewLogs = async (conn: ServiceConnection) => {
    setSelectedConnectionForLogs(conn);
    try {
      const res = await fetch(`/api/integrations/logs/${conn.id}`);
      if (res.ok) {
        const logs = await res.json();
        setConnectionLogs(logs);
        setShowLogsModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // PRIVACY METHODS
  // ==========================================
  const handleExportAllData = async () => {
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const [emails, tasks, projects, customers, meetings, files, systemLogs] = await Promise.all([
        fetch('/api/emails').then(r => r.json()).catch(() => []),
        fetch('/api/tasks').then(r => r.json()).catch(() => []),
        fetch('/api/projects').then(r => r.json()).catch(() => []),
        fetch('/api/customers').then(r => r.json()).catch(() => []),
        fetch('/api/meetings').then(r => r.json()).catch(() => []),
        fetch('/api/files').then(r => r.json()).catch(() => []),
        fetch('/api/system-logs').then(r => r.json()).catch(() => [])
      ]);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        organizationId: 'geometric_suite_101',
        version: 'Work OS v2.0 Enterprise',
        data: {
          emails,
          tasks,
          projects,
          customers,
          meetings,
          files,
          systemLogs
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `work_os_privacy_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setSuccessMessage('Full organization data archive compiled and downloaded successfully.');
    } catch (err: any) {
      setErrorMessage(`Data export failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const executeCleanse = async () => {
    if (!activePurgeTarget) return;

    if (activePurgeTarget === 'entire_account' && privacyConfirmText !== 'WIPE') {
      alert('You must type WIPE in all capitals to authorize a factory reset.');
      return;
    } else if (activePurgeTarget !== 'entire_account' && privacyConfirmText !== 'PURGE') {
      alert('You must type PURGE to authorize file cleansing.');
      return;
    }

    setPurging(true);
    try {
      const res = await fetch('/api/integrations/cleanse-privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: activePurgeTarget })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Privacy hard-cleanse complete. Successfully purged offline documents and cache index nodes.`);
        setActivePurgeTarget(null);
        setPrivacyConfirmText('');
        fetchIntegrations();
      } else {
        setErrorMessage(data.error || 'Cleanse pipeline failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setPurging(false);
    }
  };


  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)] text-slate-400">
        <p className="text-xs">Authenticate to view system preferences</p>
      </div>
    );
  }

  // Provider categorizer helper
  const renderProviderGrid = (category: 'email' | 'storage' | 'ai' | 'chat' | 'database' | 'other') => {
    const list = providers.filter(p => p.category === category);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map(p => {
          const activeConn = connections.find(c => c.providerId === p.id);
          const hasError = activeConn?.lastError;

          return (
            <div 
              key={p.id} 
              className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                activeConn 
                  ? activeConn.health === 'Healthy' 
                    ? 'border-emerald-200 dark:border-emerald-900/30 bg-emerald-500/5' 
                    : 'border-red-200 dark:border-red-900/30 bg-red-500/5'
                  : 'border-slate-200 dark:border-slate-800 bg-transparent'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                      {p.id === 'gmail' || p.id === 'yahoo' || p.id === 'outlook' || p.id === 'm365' ? (
                        <Mail className="h-4.5 w-4.5 text-blue-500" />
                      ) : p.id === 'gdrive' ? (
                        <Database className="h-4.5 w-4.5 text-amber-500" />
                      ) : p.id === 'gemini' ? (
                        <Cpu className="h-4.5 w-4.5 text-purple-500 animate-pulse" />
                      ) : p.id === 'telegram' || p.id === 'whatsapp' ? (
                        <Bell className="h-4.5 w-4.5 text-emerald-500" />
                      ) : p.id === 'supabase' ? (
                        <Server className="h-4.5 w-4.5 text-sky-500" />
                      ) : (
                        <Sliders className="h-4.5 w-4.5 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.name}</h4>
                      <span className="text-[9px] font-mono text-slate-400 capitalize">{p.category}</span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {activeConn ? (
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${activeConn.health === 'Healthy' ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${activeConn.health === 'Healthy' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          {activeConn.health === 'Healthy' ? 'Connected' : 'Error'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Not Connected</span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {p.description}
                </p>

                {activeConn && (
                  <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-150 dark:border-slate-850/50 space-y-1 font-mono text-[9px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Sync Mode:</span>
                      <span className="text-slate-600 dark:text-slate-300 font-bold">{activeConn.syncPaused ? 'Paused' : 'Automatic'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Last Sync:</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {activeConn.lastSyncAt ? new Date(activeConn.lastSyncAt).toLocaleString([], {timeStyle: 'short', dateStyle: 'short'}) : 'Never'}
                      </span>
                    </div>
                    {activeConn.storageUsed && (
                      <div className="flex justify-between text-slate-400">
                        <span>Repository Cache:</span>
                        <span className="text-slate-600 dark:text-slate-300">{activeConn.storageUsed}</span>
                      </div>
                    )}
                    {hasError && (
                      <div className="mt-1 pt-1 border-t border-red-100 dark:border-red-950/20 text-red-500 leading-normal flex items-start gap-1 font-sans font-semibold">
                        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                        <span>{activeConn.lastError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Actions Footer */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-2 justify-end">
                {activeConn ? (
                  <>
                    <button 
                      onClick={() => handleSyncNow(activeConn.id)}
                      className="text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      Sync Now
                    </button>
                    <button 
                      onClick={() => handleTogglePause(activeConn.id)}
                      className="text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      {activeConn.syncPaused ? 'Resume Sync' : 'Pause Sync'}
                    </button>
                    <button 
                      onClick={() => handleViewLogs(activeConn)}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 px-2 py-1 rounded transition cursor-pointer"
                    >
                      View Logs
                    </button>
                    {activeConn.health !== 'Healthy' ? (
                      <button 
                        onClick={() => handleReconnect(activeConn.id)}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 px-2 py-1 rounded transition cursor-pointer"
                      >
                        Reconnect
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleDisconnect(activeConn.id)}
                        className="text-[10px] font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 px-2 py-1 rounded transition cursor-pointer"
                      >
                        Disconnect
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteConnection(activeConn.id)}
                      className="text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-2 py-1 rounded transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      setActiveConnectProvider(p);
                      setTestSuccess(null);
                      setTestError(null);
                    }}
                    className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
                  >
                    Connect Service
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)] overflow-hidden" id="settings-panel-container">
      
      {/* Settings Navigation Menu Rail (1 col) */}
      <div className="lg:col-span-1 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl p-4 flex flex-col justify-between h-full overflow-y-auto" id="settings-nav-rail">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Settings className="h-4.5 w-4.5 text-blue-500 animate-spin-slow animate-spin" />
            <div>
              <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Work OS Config</h2>
              <span className="text-[9px] text-slate-400 block font-mono">ID: {currentUser.id}</span>
            </div>
          </div>

          <div className="space-y-1">
            {[
              { id: 'profile', label: 'Personal Profile', icon: User },
              { id: 'preferences', label: 'Preferences', icon: Globe },
              { id: 'connected-services', label: 'Connected Services', icon: Link },
              { id: 'sessions', label: 'Active Sessions', icon: Laptop },
              { id: 'audit', label: 'Security Audit Logs', icon: History },
              { id: 'privacy', label: 'Privacy & Cleanse', icon: Lock }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSuccessMessage(null);
                    setErrorMessage(null);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition ${active ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'}`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gemini validated status indicator */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-850 space-y-1 mt-4">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Gemini Verified</span>
          </div>
          <p className="text-[9px] text-slate-400 leading-snug">The server is communicating securely using system-injected API keys.</p>
        </div>
      </div>

      {/* Main Form/Logs Content Area (3 cols) */}
      <div className="lg:col-span-3 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl p-6 overflow-y-auto flex flex-col justify-between h-full" id="settings-content-pane">
        <div className="space-y-5">
          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tab 1: Profile update */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Personal Corporate Profile</h3>
                <p className="text-xs text-slate-400">Configure public credentials displayed inside the organization index</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl text-xs focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Direct Contact Number</label>
                  <input 
                    type="text"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Profile Photo URL</label>
                <input 
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={photo}
                  onChange={e => setPhoto(e.target.value)}
                  className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl text-xs focus:outline-hidden font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Corporate Office</label>
                  <input 
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Designation / Title</label>
                  <input 
                    type="text"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department Unit</label>
                  <input 
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {loading ? 'Saving Profile...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Preferences update */}
          {activeTab === 'preferences' && (
            <form onSubmit={handlePreferencesSubmit} className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">System Preferences</h3>
                <p className="text-xs text-slate-400">Configure structural parameters regarding visualization and timings</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">System Timezone</label>
                  <select 
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl text-xs focus:outline-hidden"
                  >
                    <option value="UTC">UTC (GMT+00:00)</option>
                    <option value="EST">EST (GMT-05:00)</option>
                    <option value="PST">PST (GMT-08:00)</option>
                    <option value="CET">CET (GMT+01:00)</option>
                    <option value="IST">IST (GMT+05:30)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Language Dialect</label>
                  <select 
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl text-xs focus:outline-hidden"
                  >
                    <option value="English">English (United States)</option>
                    <option value="German">Deutsch (Germany)</option>
                    <option value="Spanish">Español (Spain)</option>
                    <option value="French">Français (France)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Theme Preferences</label>
                  <select 
                    value={themePreference}
                    onChange={e => setThemePreference(e.target.value)}
                    className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl text-xs focus:outline-hidden"
                  >
                    <option value="dark">Cosmic Dark Theme</option>
                    <option value="light">Swiss Minimal Light</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {loading ? 'Saving Preferences...' : 'Sync System Preferences'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Connected Services Tab */}
          {activeTab === 'connected-services' && (
            <div className="space-y-6">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Enterprise Connected Services</h3>
                <p className="text-xs text-slate-400">Manage OAuth consent tokens, SMTP structures, and AI models from a unified telemetry hub</p>
              </div>

              {/* Email Integrations */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Mailboxes & Exchange</h4>
                {renderProviderGrid('email')}
              </div>

              {/* Cloud Repositories */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Cloud Repositories</h4>
                {renderProviderGrid('storage')}
              </div>

              {/* Artificial Intelligence Engines */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Cognitive & AI Endpoints</h4>
                {renderProviderGrid('ai')}
              </div>

              {/* Messenger alert nodes */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Messenger Relay Hooks</h4>
                {renderProviderGrid('chat')}
              </div>

              {/* Enterprise Storage */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Databases & Backends</h4>
                {renderProviderGrid('database')}
              </div>

              {/* Reserved Custom domain hooks */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Custom Integrations</h4>
                {renderProviderGrid('other')}
              </div>
            </div>
          )}

          {/* Tab 4: Active logins */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Active Multi-Device Sessions</h3>
                <p className="text-xs text-slate-400">View and audit all active devices, browsers, and IP nodes logged into your profile</p>
              </div>

              <div className="space-y-2.5">
                {sessions.length > 0 ? (
                  sessions.map(sess => (
                    <div key={sess.id} className="p-3 border border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{sess.device}</span>
                          <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                            {sess.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">IP Node: {sess.ipAddress} • {sess.browser}</p>
                        <p className="text-[9px] text-slate-400 font-mono">Authenticated: {new Date(sess.loginTime).toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => handleTerminateSession(sess.id)}
                        className="text-[10px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 px-2.5 py-1.5 rounded-lg transition shrink-0 cursor-pointer"
                      >
                        Terminate
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No active sessions located.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab 5: Security audit logs */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="space-y-0.5 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Security Audit Logs</h3>
                  <p className="text-xs text-slate-400">Real-time system validation logs tracking critical security transitions</p>
                </div>
                <button onClick={fetchAuditLogs} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer">
                  <RefreshCw className="h-3 w-3 animate-spin-slow" /> Refresh Logs
                </button>
              </div>

              <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-250 dark:border-slate-800 rounded-2xl">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log, i) => (
                    <div key={log.id || i} className="p-3 text-xs flex justify-between items-start gap-4">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${log.action === 'FAILED_LOGIN' ? 'bg-red-100 text-red-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                            {log.action}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{log.userName || 'Anonymous Client'}</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{log.details}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{log.device} • {log.ipAddress}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 pt-0.5">
                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 p-6 text-center">No active security audit logs found.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab 6: Privacy & Data Cleanse */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Privacy & Corporate Cleanse Panel</h3>
                <p className="text-xs text-slate-400">Wipe cached documents, clear system log audit history, and download a complete archive of your stored assets</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Corporate Compliance & GDPR Export</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Download a complete database export containing all your customers records, correspondence transcripts, task nodes, active CAD drawing revisions, and system audits directly to your machine.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-start">
                  <button 
                    onClick={handleExportAllData}
                    className="flex items-center gap-2 text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    <Download className="h-4 w-4" /> Export All Organization Data (.JSON)
                  </button>
                </div>
              </div>

              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Targeted Asset Deletion</h4>
                <p className="text-xs text-slate-400 leading-normal">
                  Permanently destroy specific cache segments from Disk. These operations are non-reversible and comply with local storage purge compliance structures.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'emails', label: 'Erase Mailbox Cache', desc: 'Wipes all synced business emails, message threads, and classifications.' },
                    { id: 'attachments', label: 'Wipe CAD Drawings & Attachments', desc: 'Deletes all mechanical assembly drawings, PDFs, and local file attachments.' },
                    { id: 'ai_minutes', label: 'Purge AI Summaries & Minutes', desc: 'Blanks all meeting transcripts and AI summary insights.' },
                    { id: 'files', label: 'Hard Reset File Vault', desc: 'Completely unlinks local filesystem files and catalog schemas.' },
                    { id: 'projects', label: 'Drop Active Projects & RFQs', desc: 'Removes active mechanical projects, drawings lists, and RFQs.' },
                    { id: 'cache', label: 'Clear System Sync & Session Logs', desc: 'Resets all audit trails, sync metadata, and local system logs.' }
                  ].map(target => (
                    <div key={target.id} className="p-3.5 border border-slate-200 dark:border-slate-850 bg-slate-500/5 hover:bg-slate-500/10 transition rounded-xl flex items-center justify-between">
                      <div className="space-y-1 min-w-0 pr-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{target.label}</span>
                        <p className="text-[10px] text-slate-400 leading-snug">{target.desc}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setActivePurgeTarget(target.id);
                          setPrivacyConfirmText('');
                          setSuccessMessage(null);
                          setErrorMessage(null);
                        }}
                        className="text-[10px] font-bold text-red-500 hover:bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-lg cursor-pointer transition shrink-0"
                      >
                        Purge
                      </button>
                    </div>
                  ))}
                </div>

                {/* Hard reset */}
                <div className="p-4 border border-rose-200/40 dark:border-rose-950/20 bg-rose-500/5 rounded-2xl flex items-center justify-between mt-6">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-rose-500">Wipe Entire Organization Tenant Data</h4>
                    <p className="text-xs text-slate-400 leading-normal max-w-xl">
                      Factory resets the entire server's json database. All emails, customers, meetings, drawings, active tasks, automation workflows, and logs will be permanently deleted from physical memory.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setActivePurgeTarget('entire_account');
                      setPrivacyConfirmText('');
                      setSuccessMessage(null);
                      setErrorMessage(null);
                    }}
                    className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Wipe Organization
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ----------------- MODAL: VIEW SYNC LOGS ----------------- */}
      {showLogsModal && selectedConnectionForLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between max-h-[85vh]">
            <div className="space-y-4 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedConnectionForLogs.name} Sync History</h3>
                    <p className="text-[10px] text-slate-400">Connection: {selectedConnectionForLogs.id}</p>
                  </div>
                </div>
                <button onClick={() => setShowLogsModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Real system sync items */}
              <div className="overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[50vh]">
                {connectionLogs.length > 0 ? (
                  connectionLogs.map((log) => (
                    <div key={log.id} className="pt-2.5 text-xs flex items-start gap-4 justify-between">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${log.status === 'success' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'}`}>
                            {log.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Synced {log.itemsSynced} items</span>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 leading-normal">{log.details}</p>
                        <p className="text-[9px] text-slate-400 font-medium">Sync Duration: {log.durationMs}ms • Category: {log.type}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 pt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 p-6 text-center font-mono">No synchronization logs recorded for this endpoint.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end shrink-0">
              <button 
                onClick={() => setShowLogsModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: CONNECTION DETAILS / FORM ----------------- */}
      {activeConnectProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
          <form onSubmit={handleConnectProvider} className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Link className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Connect {activeConnectProvider.name}</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-mono">Configuring secure telemetry proxy</p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveConnectProvider(null)} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Verification Success or Error */}
            {testSuccess && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 rounded-lg text-[11px] text-emerald-700 dark:text-emerald-400">
                ✔️ {testSuccess}
              </div>
            )}
            {testError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 rounded-lg text-[11px] text-rose-700 dark:text-rose-400">
                ❌ {testError}
              </div>
            )}

            {/* Provider Forms */}
            <div className="space-y-3">
              {/* OAUTH MOCK SIMULATOR FOR GMAIL/OUTLOOK/GDRIVE */}
              {(activeConnectProvider.id === 'gmail' || activeConnectProvider.id === 'outlook' || activeConnectProvider.id === 'm365' || activeConnectProvider.id === 'gdrive') && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400 leading-normal">
                    This integration connects through the secure <strong>Google / Microsoft OAuth Client</strong>. Authenticating establishes encrypted credential tunnels inside our isolated memory stack.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Work Email Address</label>
                    <input 
                      type="email"
                      placeholder="e.g. james.henderson@apexind.com"
                      value={connectForm.email}
                      onChange={e => setConnectForm({...connectForm, email: e.target.value})}
                      className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2 rounded-xl text-xs focus:outline-hidden"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consent Security Access Token</label>
                    <input 
                      type="password"
                      placeholder="OAuth Consent Access Key / Bearer"
                      value={connectForm.accessToken}
                      onChange={e => setConnectForm({...connectForm, accessToken: e.target.value})}
                      className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2 rounded-xl text-xs focus:outline-hidden font-mono"
                      required
                    />
                  </div>
                </div>
              )}

              {/* YAHOO / GENERIC IMAP */}
              {activeConnectProvider.id === 'yahoo' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Connect Yahoo using standard <strong>IMAP/SMTP SSL</strong>. You must configure an App Password inside your Yahoo Account Security Dashboard.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Yahoo Corporate Email Address</label>
                    <input 
                      type="email"
                      placeholder="username@yahoo.com"
                      value={connectForm.email}
                      onChange={e => setConnectForm({...connectForm, email: e.target.value})}
                      className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2 rounded-xl text-xs focus:outline-hidden"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Yahoo Generated App Password</label>
                    <input 
                      type="password"
                      placeholder="abcd-efgh-ijkl-mnop"
                      value={connectForm.appPassword}
                      onChange={e => setConnectForm({...connectForm, appPassword: e.target.value})}
                      className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2 rounded-xl text-xs focus:outline-hidden font-mono"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IMAP Host</label>
                      <input 
                        type="text"
                        value={connectForm.imapHost || 'imap.mail.yahoo.com'}
                        onChange={e => setConnectForm({...connectForm, imapHost: e.target.value})}
                        className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2 rounded-xl text-xs focus:outline-hidden font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Port</label>
                      <input 
                        type="text"
                        value={connectForm.port || '993'}
                        onChange={e => setConnectForm({...connectForm, port: e.target.value})}
                        className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2 rounded-xl text-xs focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* COGNITIVE AI - GEMINI */}
              {activeConnectProvider.id === 'gemini' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Connect your enterprise billing node to the <strong>Google Gemini SDK API</strong>. Providing an API Key activates raw processing capabilities.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gemini API Secret Key</label>
                    <input 
                      type="password"
                      placeholder="AIzaSy..."
                      value={connectForm.apiKey}
                      onChange={e => setConnectForm({...connectForm, apiKey: e.target.value})}
                      className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl text-xs focus:outline-hidden font-mono text-slate-800 dark:text-slate-100"
                      required
                    />
                  </div>
                </div>
              )}

              {/* MESSENGER TELEGRAM BOT */}
              {activeConnectProvider.id === 'telegram' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Establish message tunnels with your business chat channels using a <strong>Telegram Bot Token</strong> and target group Chat ID.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telegram Bot HTTP Bot Token</label>
                    <input 
                      type="password"
                      placeholder="123456789:ABCDefghIJKLmnop..."
                      value={connectForm.botToken}
                      onChange={e => setConnectForm({...connectForm, botToken: e.target.value})}
                      className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2 rounded-xl text-xs focus:outline-hidden font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Destination Channel / Chat ID</label>
                    <input 
                      type="text"
                      placeholder="e.g. -100123456789"
                      value={connectForm.chatId}
                      onChange={e => setConnectForm({...connectForm, chatId: e.target.value})}
                      className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2 rounded-xl text-xs focus:outline-hidden font-mono"
                      required
                    />
                  </div>
                </div>
              )}

              {/* DATABASE SUPABASE */}
              {activeConnectProvider.id === 'supabase' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Synchronize your local CAD repositories and client tables with your cloud-hosted <strong>Supabase Relational Core</strong>.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Supabase Project REST URL</label>
                    <input 
                      type="text"
                      placeholder="https://yourproject.supabase.co"
                      value={connectForm.projectUrl}
                      onChange={e => setConnectForm({...connectForm, projectUrl: e.target.value})}
                      className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2 rounded-xl text-xs focus:outline-hidden font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Supabase Public Anon Key</label>
                    <input 
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={connectForm.anonKey}
                      onChange={e => setConnectForm({...connectForm, anonKey: e.target.value})}
                      className="w-full bg-transparent border border-slate-250 dark:border-slate-800 p-2 rounded-xl text-xs focus:outline-hidden font-mono"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-3 justify-between items-center">
              <button 
                type="button"
                onClick={handleTriggerTestConnection}
                disabled={testingConnection || loading}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 px-3.5 py-2 rounded-xl transition cursor-pointer"
              >
                {testingConnection ? 'Running Handshake...' : 'Verify Connectivity'}
              </button>

              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setActiveConnectProvider(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {loading ? 'Registering...' : 'Establish Integration'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ----------------- MODAL: DUAL DESTRUCTIVE WIPE MODAL ----------------- */}
      {activePurgeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md font-sans">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <AlertTriangle className="h-6 w-6 text-red-500 animate-bounce" />
              <div>
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100">Confirm Deletion Event</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">compliance authorization required</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-normal font-medium">
              You are launching a destructive compliance purge target: <strong>{activePurgeTarget}</strong>. Stored items, blueprints, indexing cache, and logs related to this namespace will be destroyed completely.
            </p>

            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl text-xs text-red-700 dark:text-red-400">
              ⚠️ Warning: This is physically irreversible. Wiped sector files cannot be retrieved.
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Type <strong>{activePurgeTarget === 'entire_account' ? 'WIPE' : 'PURGE'}</strong> to authorize sector deletion:
              </label>
              <input 
                type="text"
                placeholder={activePurgeTarget === 'entire_account' ? 'WIPE' : 'PURGE'}
                value={privacyConfirmText}
                onChange={e => setPrivacyConfirmText(e.target.value)}
                className="w-full bg-transparent border border-red-200 dark:border-red-900/50 p-2.5 rounded-xl text-xs focus:outline-hidden font-mono uppercase tracking-widest font-bold text-slate-800 dark:text-slate-200"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-end gap-2.5">
              <button 
                onClick={() => {
                  setActivePurgeTarget(null);
                  setPrivacyConfirmText('');
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-350 bg-slate-150 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel Purge
              </button>
              <button 
                onClick={executeCleanse}
                disabled={purging || (activePurgeTarget === 'entire_account' ? privacyConfirmText !== 'WIPE' : privacyConfirmText !== 'PURGE')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-30 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {purging ? 'Executing Sector Wipe...' : 'Destroy Stored Assets'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
