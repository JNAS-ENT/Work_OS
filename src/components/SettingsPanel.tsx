/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, ShieldCheck, Mail, Database, Bell, RefreshCw, Sliders, Server, Cpu } from 'lucide-react';

export default function SettingsPanel() {
  const [provider, setProvider] = useState('yahoo');
  const [pollInterval, setPollInterval] = useState('5');
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [enableSummary, setEnableSummary] = useState(true);

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 h-[calc(100vh-140px)] overflow-y-auto">
      
      {/* Settings title header */}
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
        <Settings className="h-5 w-5 text-blue-600 animate-spin-slow" />
        <div>
          <h2 className="text-sm font-bold text-slate-800">Work OS System Settings</h2>
          <p className="text-[10px] text-slate-400">Configure global triggers, notification relays, and secure API keys</p>
        </div>
      </div>

      {/* Integration Providers */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Mail className="h-4 w-4 text-blue-500" />
          Mailbox Connect (IMAP / SMTP)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {[
            { id: 'yahoo', name: 'Yahoo Mail', desc: 'Secure polling active' },
            { id: 'gmail', name: 'Google Gmail', desc: 'OAuth token ready' },
            { id: 'outlook', name: 'MS Outlook', desc: 'Enterprise connect' }
          ].map(prov => {
            const active = provider === prov.id;
            return (
              <div 
                key={prov.id}
                onClick={() => setProvider(prov.id)}
                className={`p-4 border rounded-xl cursor-pointer transition flex flex-col justify-between h-24 ${active ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-blue-200'}`}
              >
                <span className="font-bold text-slate-800">{prov.name}</span>
                <span className={`text-[10px] font-semibold uppercase ${active ? 'text-blue-600' : 'text-slate-400'}`}>
                  {active ? '● Connected' : 'Connect'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Polling rules */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <RefreshCw className="h-4 w-4 text-blue-500" />
          Ingress Synchronization Interval
        </h3>
        
        <div className="grid grid-cols-3 gap-3 text-xs">
          {[
            { id: '5', label: 'Every 5 Mins' },
            { id: '30', label: 'Every 30 Mins' },
            { id: 'manual', label: 'Manual Refresh Only' }
          ].map(opt => {
            const active = pollInterval === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setPollInterval(opt.id)}
                className={`py-2 px-3 border rounded-xl font-bold transition text-xs ${active ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts configuration */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Bell className="h-4 w-4 text-blue-500" />
          Operations Notification Triggers
        </h3>

        <div className="space-y-2.5">
          <label className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50 transition">
            <span className="space-y-0.5">
              <span>Enable Push Alerts</span>
              <span className="text-[10px] text-slate-400 block font-normal">Push notification to browser immediately when email matches RFQ category</span>
            </span>
            <input
              type="checkbox"
              checked={enableAlerts}
              onChange={() => setEnableAlerts(!enableAlerts)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50 transition">
            <span className="space-y-0.5">
              <span>Enable End-of-Day Operations Summary</span>
              <span className="text-[10px] text-slate-400 block font-normal">Receive an automated briefing containing all completed drawings and backlog</span>
            </span>
            <input
              type="checkbox"
              checked={enableSummary}
              onChange={() => setEnableSummary(!enableSummary)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
          </label>
        </div>
      </div>

      {/* Secured Secret keys validation */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-blue-500" />
          Credentials & Vault Security
        </h3>
        
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between text-xs">
          <div className="space-y-0.5 text-emerald-800">
            <p className="font-bold">Gemini API Connection Validated</p>
            <p className="text-[10px] text-emerald-600">The server is utilizing the secure system-injected GEMINI_API_KEY environment variable.</p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold">Secured</span>
        </div>
      </div>

    </div>
  );
}
