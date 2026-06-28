/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RefreshCw, Layers, CheckCircle, Database, Mail, Sparkles, Plus, Clock, ToggleLeft, ToggleRight, ArrowRight, Activity, ShieldCheck
} from 'lucide-react';

export default function Automations() {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPipelines();
  }, []);

  const fetchPipelines = () => {
    setLoading(true);
    fetch('/api/automations')
      .then(res => res.json())
      .then(data => {
        setPipelines(data.pipelines || []);
        setLogs(data.logs || []);
      })
      .catch(err => console.error('Error fetching pipelines:', err))
      .finally(() => setLoading(false));
  };

  const handleTogglePipeline = (id: string, currentActive: boolean) => {
    fetch(`/api/automations/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !currentActive })
    })
      .then(res => res.json())
      .then(() => fetchPipelines())
      .catch(err => console.error('Error toggling pipeline:', err));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      
      {/* Node designer list (7 cols) */}
      <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col h-full justify-between overflow-y-auto">
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-50">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-600" />
                Work OS n8n Automation Workspace
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Define trigger logic, extraction filters, and CRM database upserts</p>
            </div>
            <button 
              onClick={fetchPipelines}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-xl transition border border-gray-100"
              title="Refresh Pipeline Status"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Render Active Nodes pipelines */}
          <div className="space-y-6">
            {pipelines.map(pipe => (
              <div key={pipe.id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/20 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-gray-800">{pipe.name}</h3>
                    <p className="text-[10px] text-gray-400">Trigger Event: {pipe.triggerEvent} • Ran {pipe.runCount} times</p>
                  </div>
                  <button 
                    onClick={() => handleTogglePipeline(pipe.id, pipe.active)}
                    className="transition text-purple-600"
                  >
                    {pipe.active ? (
                      <ToggleRight className="h-9 w-9" />
                    ) : (
                      <ToggleLeft className="h-9 w-9 text-gray-300" />
                    )}
                  </button>
                </div>

                {/* Visual Flow diagram representation */}
                <div className="grid grid-cols-7 items-center gap-1.5 p-3.5 bg-white border border-gray-100 rounded-xl text-center text-[10px] text-gray-600 font-bold">
                  {/* Mail Poll */}
                  <div className="bg-blue-50 text-blue-600 p-2 border border-blue-100 rounded-lg flex flex-col items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>Poll Inbox</span>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-gray-300 mx-auto" />

                  {/* Gemini Analyze */}
                  <div className="bg-purple-50 text-purple-600 p-2 border border-purple-100 rounded-lg flex flex-col items-center gap-1">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    <span>Gemini AI</span>
                  </div>

                  <ArrowRight className="h-4 w-4 text-gray-300 mx-auto" />

                  {/* CRM Update */}
                  <div className="bg-emerald-50 text-emerald-600 p-2 border border-emerald-100 rounded-lg flex flex-col items-center gap-1">
                    <Database className="h-4 w-4" />
                    <span>Sync CRM</span>
                  </div>

                  <ArrowRight className="h-4 w-4 text-gray-300 mx-auto" />

                  {/* Scheduled Alert */}
                  <div className="bg-amber-50 text-amber-600 p-2 border border-amber-100 rounded-lg flex flex-col items-center gap-1">
                    <Activity className="h-4 w-4" />
                    <span>Push Task</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security / System limits check */}
        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Vetted TLS Encrypted Hooks
          </span>
          <span>Max execution SLA: 1.5s</span>
        </div>
      </div>

      {/* execution logs trace (5 cols) */}
      <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col h-full overflow-hidden">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Live Pipeline Ingress Logs</h3>
        
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {logs && logs.length > 0 ? (
            logs.map((log, idx) => (
              <div key={log.id || idx} className="py-3 text-xs space-y-1">
                <div className="flex justify-between items-center font-mono">
                  <span className="font-bold text-gray-800">ID: {log.id}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${log.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {log.status}
                  </span>
                </div>
                <p className="text-gray-500 leading-snug">{log.message}</p>
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold pt-0.5">
                  <span>Latency: {log.latencyMs}ms</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-gray-400 text-xs">No executions logged yet. Sync Yahoo Mail to trigger!</div>
          )}
        </div>
      </div>

    </div>
  );
}
