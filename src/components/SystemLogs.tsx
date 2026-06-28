/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Terminal, RefreshCw, Trash2, Search, Cpu, ShieldCheck, Database, HardDrive } from 'lucide-react';

export default function SystemLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'INFO' | 'ERROR' | 'DEBUG'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = () => {
    setLoading(true);
    fetch('/api/system-logs')
      .then(res => res.json())
      .then(data => {
        setLogs(data || []);
      })
      .catch(err => console.error('Error fetching system logs:', err))
      .finally(() => setLoading(false));
  };

  const handleClearLogs = () => {
    fetch('/api/system-logs', { method: 'DELETE' })
      .then(() => setLogs([]))
      .catch(err => console.error('Error clearing logs:', err));
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = levelFilter === 'ALL' || log.level === levelFilter;
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.context.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-2xl h-[calc(100vh-140px)] flex flex-col overflow-hidden text-gray-300 font-mono shadow-2xl">
      
      {/* Terminal header controls */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-bold text-gray-100">Work OS Core Engine Console</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Level Filter */}
          <div className="flex bg-gray-950 rounded-lg p-1 border border-gray-800">
            {['ALL', 'INFO', 'ERROR', 'DEBUG'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl as any)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition ${levelFilter === lvl ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-600" />
            <input
              type="text"
              placeholder="Search traces..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-gray-950 border border-gray-800 text-gray-100 focus:outline-none focus:border-blue-500 pl-8 pr-3 py-1.5 rounded-lg text-[10px] w-40"
            />
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition"
            title="Refresh Console"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleClearLogs}
            className="p-1.5 bg-red-950/40 hover:bg-red-950/60 text-red-400 border border-red-900/30 rounded-lg transition"
            title="Clear Logs"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal log rows */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 text-[11px] leading-relaxed">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log, idx) => {
            let color = 'text-gray-300';
            if (log.level === 'ERROR') color = 'text-red-400 font-bold';
            if (log.level === 'DEBUG') color = 'text-purple-400';
            if (log.level === 'INFO') color = 'text-blue-300';

            return (
              <div key={log.id || idx} className="flex gap-2.5 items-start group hover:bg-gray-900/40 px-2 py-1 rounded transition">
                <span className="text-gray-600 select-none shrink-0 font-bold">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                <span className={`shrink-0 font-bold uppercase text-[10px] w-12 ${color}`}>{log.level}</span>
                <span className="text-gray-500 shrink-0 select-none">[{log.context}]</span>
                <span className="flex-1 text-gray-200 break-all">{log.message}</span>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 text-gray-600 text-xs">Console is completely silent. Initiate a Mailbox sync or Task transition to log metrics.</div>
        )}
      </div>

      {/* Console specs footer */}
      <div className="bg-gray-900 border-t border-gray-800 p-3.5 flex flex-wrap justify-between items-center gap-3 text-[10px] text-gray-500 font-bold">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <Cpu className="h-3.5 w-3.5 text-blue-500" />
            V8 Core Engine V1.12
          </span>
          <span className="flex items-center gap-1">
            <Database className="h-3.5 w-3.5 text-blue-500" />
            File DB SQLite
          </span>
        </div>
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          SSL / TLS Pipeline Active
        </span>
      </div>

    </div>
  );
}
