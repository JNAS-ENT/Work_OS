/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, Search, Calendar, DollarSign, CheckCircle2, Clock, 
  Sparkles, FileText, Settings, Users, Paperclip, ShieldAlert, ArrowUpRight 
} from 'lucide-react';
import { Project, Customer, FileItem } from '../types';

interface ProjectsProps {
  projects: Project[];
  customers: Customer[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (project: Partial<Project>) => void;
  onNavigate: (tab: string, param?: any) => void;
}

export default function Projects({
  projects, customers, selectedProjectId, onSelectProject, onCreateProject, onNavigate
}: ProjectsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [projectDetail, setProjectDetail] = useState<any>(null);

  // Form states
  const [newName, setNewName] = useState('');
  const [newCustId, setNewCustId] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newBudget, setNewBudget] = useState(10000);
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEndDate, setNewEndDate] = useState(new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]);

  useEffect(() => {
    if (selectedProjectId) {
      fetch(`/api/projects/${selectedProjectId}`)
        .then(res => res.json())
        .then(data => {
          setProjectDetail(data);
        })
        .catch(err => console.error('Error fetching project detail:', err));
    } else if (projects.length > 0 && !selectedProjectId) {
      onSelectProject(projects[0].id);
    }
  }, [selectedProjectId, projects]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCustId) return;

    onCreateProject({
      name: newName,
      customerId: newCustId,
      description: newDesc,
      code: newCode || `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      budget: newBudget,
      startDate: newStartDate,
      endDate: newEndDate,
      status: 'Planning'
    });

    // Reset
    setNewName('');
    setNewCustId('');
    setNewDesc('');
    setNewCode('');
    setNewBudget(10000);
    setShowAddModal(false);
  };

  const getStatusColor = (status: Project['status']) => {
    if (status === 'Completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'Active') return 'bg-blue-50 text-blue-700 border-blue-100';
    if (status === 'OnHold') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-gray-100 text-gray-500 border-gray-200';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm h-[calc(100vh-140px)]">
      
      {/* Sidebar listing projects (4 cols) */}
      <div className="lg:col-span-4 border-r border-gray-50 flex flex-col h-full bg-white">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl text-sm"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
            title="Launch Project"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Scroll list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredProjects.length > 0 ? (
            filteredProjects.map(p => {
              const active = p.id === selectedProjectId;
              const cust = customers.find(c => c.id === p.customerId);
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50/40 transition flex items-center justify-between ${active ? 'bg-blue-50/30 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="min-w-0 flex-1 pr-2 space-y-1">
                    <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                      {p.code}
                    </span>
                    <h4 className="text-xs font-bold text-gray-900 truncate pt-0.5">{p.name}</h4>
                    <p className="text-[10px] text-gray-400 truncate">{cust?.company || 'Internal Project'}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase block ${getStatusColor(p.status)}`}>
                      {p.status}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 font-bold">{p.progress}%</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-gray-400 text-xs">No project folders found.</div>
          )}
        </div>
      </div>

      {/* Project details area (8 cols) */}
      <div className="lg:col-span-8 flex flex-col h-full bg-gray-50/10">
        {selectedProjectId && projectDetail ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Top Identity segment */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-5 border-b border-gray-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                    {projectDetail.code}
                  </span>
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight">{projectDetail.name}</h1>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getStatusColor(projectDetail.status)}`}>
                    {projectDetail.status}
                  </span>
                </div>
                
                {projectDetail.customer && (
                  <button 
                    onClick={() => onNavigate('customers', { customerId: projectDetail.customer.id })}
                    className="text-xs text-gray-500 font-bold hover:text-blue-600 flex items-center gap-1 mt-1"
                  >
                    <span>🏢 Partner: {projectDetail.customer.company}</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Scope Overview card */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Statement of Work (SLA Specs)</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{projectDetail.description || 'No formal scope description provided.'}</p>
            </div>

            {/* Key stats panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm space-y-2">
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase">
                  <span>SLA Progress</span>
                  <span>{projectDetail.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${projectDetail.progress}%` }}></div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Project Budget</span>
                  <span className="text-base font-bold text-gray-800">${projectDetail.budget?.toLocaleString() || 'N/A'}</span>
                </div>
                <DollarSign className="h-5 w-5 text-gray-400 bg-gray-50 p-1 rounded border" />
              </div>

              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Milestone Target</span>
                  <span className="text-xs font-mono font-bold text-gray-700">{projectDetail.endDate}</span>
                </div>
                <Calendar className="h-5 w-5 text-gray-400 bg-gray-50 p-1 rounded border" />
              </div>
            </div>

            {/* Sub grids for related operational tasks, meetings, and files */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Linked project tasks list */}
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Project Tasks ({projectDetail.tasks?.length || 0})</h3>
                  <button 
                    onClick={() => onNavigate('tasks')}
                    className="text-[10px] text-blue-600 font-bold hover:text-blue-700"
                  >
                    View Board
                  </button>
                </div>

                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {projectDetail.tasks && projectDetail.tasks.length > 0 ? (
                    projectDetail.tasks.map((tsk: any) => (
                      <div key={tsk.id} className="flex items-center justify-between p-2.5 border border-gray-50 rounded-xl hover:border-blue-100 transition text-xs">
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-gray-800 truncate">{tsk.title}</p>
                          <p className="text-[10px] text-gray-400 font-mono">Due: {tsk.dueDate}</p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold shrink-0 uppercase ${tsk.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {tsk.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-gray-400">No active tasks logged.</div>
                  )}
                </div>
              </div>

              {/* Linked drawing files asset registry */}
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vault Drawings & PDFs ({projectDetail.files?.length || 0})</h3>
                  <button 
                    onClick={() => onNavigate('files')}
                    className="text-[10px] text-blue-600 font-bold hover:text-blue-700"
                  >
                    Open Vault
                  </button>
                </div>

                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {projectDetail.files && projectDetail.files.length > 0 ? (
                    projectDetail.files.map((fl: any) => (
                      <div key={fl.id} className="flex items-center justify-between p-2.5 border border-gray-50 rounded-xl text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{fl.name}</p>
                          <p className="text-[9px] text-gray-400 uppercase">{fl.type} • {fl.size}</p>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono font-bold uppercase shrink-0">
                          CAD Synced
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-gray-400">No asset files linked yet.</div>
                  )}
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center space-y-2">
            <Briefcase className="h-12 w-12 text-gray-300 stroke-1" />
            <p className="text-sm font-semibold text-gray-500">No Project Folder Selected</p>
            <p className="text-xs max-w-xs text-gray-400">Select a project folder from the sidebar list to audit overall SLA progress and drawing pipelines.</p>
          </div>
        )}
      </div>

      {/* CREATE PROJECT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Launch Project Folder</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700 block uppercase">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Titanium Bracket v2 redraft"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block uppercase">Project Code (Key)</label>
                  <input
                    type="text"
                    placeholder="e.g., PRJ-APX-010"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono uppercase"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block uppercase">Customer Account</label>
                  <select
                    required
                    value={newCustId}
                    onChange={e => setNewCustId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="">Select Account...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-1">
                  <label className="font-semibold text-gray-700 block uppercase">Budget ($)</label>
                  <input
                    type="number"
                    value={newBudget}
                    onChange={e => setNewBudget(Number(e.target.value))}
                    className="w-full px-2 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="font-semibold text-gray-700 block uppercase">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)}
                    className="w-full px-2 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="font-semibold text-gray-700 block uppercase">End Target</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={e => setNewEndDate(e.target.value)}
                    className="w-full px-2 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 block uppercase">Project Scope / Specifications</label>
                <textarea
                  rows={3}
                  placeholder="Detail all client CNC limits, material selections, and step drawings tolerances..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide shadow-sm"
              >
                Launch Project Folder
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
