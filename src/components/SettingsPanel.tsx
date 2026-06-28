/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, ShieldCheck, Mail, Database, Bell, RefreshCw, Sliders, 
  Server, Cpu, User, Shield, Laptop, History, Check, Globe, Layout, LogOut, CheckCircle2
} from 'lucide-react';
import { User as UserType, UserSession, AuditLog } from '../types';

export default function SettingsPanel() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions' | 'preferences' | 'audit'>('profile');

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

  useEffect(() => {
    loadUserData();
  }, []);

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

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)] text-slate-400">
        <p className="text-xs">Authenticate to view system preferences</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)] overflow-hidden" id="settings-panel-container">
      
      {/* Settings Navigation Menu Rail (1 col) */}
      <div className="lg:col-span-1 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl p-4 flex flex-col justify-between" id="settings-nav-rail">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Settings className="h-4.5 w-4.5 text-blue-500 animate-spin-slow" />
            <div>
              <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Work OS Config</h2>
              <span className="text-[9px] text-slate-400 block font-mono">ID: {currentUser.id}</span>
            </div>
          </div>

          <div className="space-y-1">
            {[
              { id: 'profile', label: 'Personal Profile', icon: User },
              { id: 'preferences', label: 'Preferences', icon: Globe },
              { id: 'sessions', label: 'Active Sessions', icon: Laptop },
              { id: 'audit', label: 'Security Audit Logs', icon: History }
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
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-850 space-y-1">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Gemini Verified</span>
          </div>
          <p className="text-[9px] text-slate-400 leading-snug">The server is communicating securely using system-injected API keys.</p>
        </div>
      </div>

      {/* Main Form/Logs Content Area (3 cols) */}
      <div className="lg:col-span-3 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl p-6 overflow-y-auto flex flex-col justify-between" id="settings-content-pane">
        <div className="space-y-5">
          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-rose-500 shrink-0" />
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

          {/* Tab 3: Active logins */}
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

          {/* Tab 4: Security audit logs */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="space-y-0.5 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Security Audit Logs</h3>
                  <p className="text-xs text-slate-400">Real-time system validation logs tracking critical security transitions</p>
                </div>
                <button onClick={fetchAuditLogs} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer">
                  <RefreshCw className="h-3 w-3" /> Refresh Logs
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
        </div>
      </div>

    </div>
  );
}
