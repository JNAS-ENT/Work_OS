/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Mail, Users, KeyRound, 
  ArrowRight, AlertCircle, RefreshCw, CheckCircle2, Laptop, Smartphone
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: { name: string; email: string; role: 'admin' | 'manager' | 'user' | 'viewer' | 'guest' }) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'user' | 'viewer' | 'guest'>('admin');
  const [rememberMe, setRememberMe] = useState(true);

  // Recovery States
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryPin, setRecoveryPin] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Error/Success Notification Messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Presets with their simulated passwords for authentic login
  const presets = [
    { name: 'Admin Jilanee', email: 'programjilanee@gmail.com', role: 'admin' as const, desc: 'Full System Control & Logs', password: 'adminpassword' },
    { name: 'Sarah (Operations Manager)', email: 'sarah.mgr@workos.com', role: 'manager' as const, desc: 'Commercial Pipeline & Approvals', password: 'managerpassword' },
    { name: 'Alex (Technical Engineer)', email: 'alex.eng@workos.com', role: 'user' as const, desc: 'CAD Drawing Workspace & Tasks', password: 'userpassword' },
    { name: 'Guest Inspector', email: 'guest.viewer@external.com', role: 'viewer' as const, desc: 'Read-only Audit Access', password: 'guestpassword' }
  ];

  const handlePresetLogin = async (preset: typeof presets[0]) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: preset.email, password: preset.password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Preset login failed.');
      }
      localStorage.setItem('work_os_session_token', data.sessionToken);
      onLogin(data.user);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and security password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }
      localStorage.setItem('work_os_session_token', data.sessionToken);
      onLogin(data.user);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg('All registration parameters are mandatory.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      setSuccessMsg(`Account for "${name}" registered successfully! Autologging in...`);
      setTimeout(async () => {
        // Automatically login
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginResponse.json();
        if (loginResponse.ok) {
          localStorage.setItem('work_os_session_token', loginData.sessionToken);
          onLogin(loginData.user);
        }
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) {
      setErrorMsg('Please specify your registered account email.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Recovery lookup failed.');
      }
      setRecoverySent(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryPin || !newPassword) {
      setErrorMsg('PIN and New Password are required.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail, pin: recoveryPin, newPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }
      setSuccessMsg('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        setRecoverySent(false);
        setIsRecovering(false);
        setErrorMsg(null);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative z-10">
        
        {/* Left Side: Branding and Role Info (5 cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-blue-900 to-slate-900 p-8 flex flex-col justify-between text-white border-r border-slate-800">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-blue-950 rounded-xl flex items-center justify-center font-black shadow-lg">
                W
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight uppercase">Work OS V2.0</h2>
                <span className="text-[9px] text-blue-300 font-bold uppercase tracking-wider block">AI Operations Platform</span>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h1 className="text-xl md:text-2xl font-bold leading-tight tracking-tight">Enterprise Identity Core</h1>
              <p className="text-xs text-slate-300 font-normal leading-relaxed">
                Connect and govern secure client mailboxes, CAD technical drawing workspaces, and WhatsApp dispatcher loops through role-isolated privileges.
              </p>
            </div>
          </div>

          {/* Quick Sandbox Tester */}
          <div className="space-y-3 pt-6 border-t border-blue-800/30">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Fast Sandbox Identity Presets</p>
            <div className="space-y-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetLogin(preset)}
                  className="w-full text-left p-2.5 bg-slate-900/40 hover:bg-slate-900/90 border border-blue-500/20 hover:border-blue-500/50 transition rounded-xl text-xs flex justify-between items-center group cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-white group-hover:text-blue-300 transition text-[11px]">{preset.name}</p>
                    <p className="text-[9px] text-slate-400 font-medium">{preset.desc}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-900/30 px-2 py-0.5 border border-blue-500/20 rounded">
                    {preset.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Authorization Form (7 cols) */}
        <div className="md:col-span-7 p-8 bg-slate-900/40 flex flex-col justify-center min-h-[500px]">
          
          {/* Recovery Flow */}
          {isRecovering ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">Credential Verification Recovery</h2>
                <p className="text-xs text-slate-400">Specify your email address to receive an automated Work OS access reset token</p>
              </div>

              {recoverySent ? (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl space-y-2 text-center mb-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-white">Temporary Reset PIN Dispatched</p>
                      <p className="text-slate-400">A security PIN code has been logged in System Logs and Notifications. Retrieve the code to authorize your password update.</p>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">6-Digit Verification PIN</label>
                    <input 
                      type="text"
                      maxLength={6}
                      value={recoveryPin}
                      onChange={e => setRecoveryPin(e.target.value)}
                      placeholder="Enter 6-Digit PIN"
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 tracking-widest text-center font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                    <input 
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter secure new password"
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : 'Confirm Password Update'}
                  </button>

                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => { setRecoverySent(false); setIsRecovering(false); setErrorMsg(null); }}
                      className="text-xs text-slate-400 hover:text-white transition"
                    >
                      Back to Enterprise Login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRecoverSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input 
                        type="email"
                        value={recoveryEmail}
                        onChange={e => setRecoveryEmail(e.target.value)}
                        placeholder="yourname@workos.com"
                        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : 'Dispatch Reset Token'}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => { setIsRecovering(false); setErrorMsg(null); }}
                      className="text-xs text-slate-400 hover:text-white transition"
                    >
                      Back to Master Log In
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : isRegistering ? (
            /* Registration Flow */
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">Create New Corporate Profile</h2>
                <p className="text-xs text-slate-400">Register as a team member with role-based permission locks</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input 
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input 
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="alex.eng@workos.com"
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input 
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requested Security Role</label>
                  <div className="grid grid-cols-5 gap-1.5 text-[10px]">
                    {(['admin', 'manager', 'user', 'viewer', 'guest'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 text-center rounded-lg border font-bold uppercase transition ${role === r ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer pt-3"
                >
                  {loading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : 'Provision Profile & Authenticate'}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="text-center pt-2">
                  <button 
                    type="button"
                    onClick={() => { setIsRegistering(false); setErrorMsg(null); }}
                    className="text-xs text-slate-400 hover:text-white transition"
                  >
                    Already have an account? <strong className="text-blue-400">Log In</strong>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Login Flow (Standard) */
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">Central Operations Entry</h2>
                <p className="text-xs text-slate-400">Input your enterprise email and credentials to load databases</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input 
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="programjilanee@gmail.com"
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security Password</label>
                    <button 
                      type="button"
                      onClick={() => { setIsRecovering(true); setErrorMsg(null); }}
                      className="text-[10px] font-bold text-blue-400 hover:underline"
                    >
                      Recovery Code?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input 
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-400 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    Remember This Session
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer pt-3"
                >
                  {loading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : 'Authorize Security Token'}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="text-center pt-2">
                  <button 
                    type="button"
                    onClick={() => { setIsRegistering(true); setErrorMsg(null); }}
                    className="text-xs text-slate-400 hover:text-white transition"
                  >
                    Need corporate access? <strong className="text-blue-400">Register Account</strong>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>

      {/* Footer System Telemetry info */}
      <div className="mt-8 text-center text-[10px] font-semibold text-slate-500 space-y-1 relative z-10 uppercase tracking-widest">
        <p>Work OS Secure Session Portal</p>
        <p className="flex items-center gap-1.5 justify-center font-normal tracking-normal text-slate-600 lowercase font-mono">
          <span>aes_256_gcm active</span>
          <span>•</span>
          <span>tls 1.3 encryption</span>
        </p>
      </div>

    </div>
  );
}
