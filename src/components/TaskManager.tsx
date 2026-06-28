/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, CheckSquare, Clock, Calendar, AlertCircle, Trash2, 
  ChevronRight, AlignLeft, Paperclip, MessageSquare, Tag, 
  User, CheckCircle2, ListFilter, LayoutGrid, Play, Pause, ListTodo
} from 'lucide-react';
import { Task, Customer, Project } from '../types';

interface TaskManagerProps {
  tasks: Task[];
  customers: Customer[];
  projects: Project[];
  onCreateTask: (task: Partial<Task>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onNavigate: (tab: string, param?: any) => void;
}

export default function TaskManager({
  tasks, customers, projects, onCreateTask, onUpdateTask, onDeleteTask, onNavigate
}: TaskManagerProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  
  // Create task modal form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newStatus, setNewStatus] = useState<Task['status']>('Pending');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCustId, setNewCustId] = useState('');
  const [newProjId, setNewProjId] = useState('');
  const [newEstHours, setNewEstHours] = useState(2);
  const [newTags, setNewTags] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');

  // Selected task detail view
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [logTimeValue, setLogTimeValue] = useState<number>(1);

  const activeTask = tasks.find(t => t.id === selectedTaskId);

  // Filters
  const filteredTasks = tasks.filter(t => {
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const getPriorityColor = (prio: Task['priority']) => {
    if (prio === 'High') return 'text-red-600 bg-red-50 border-red-100';
    if (prio === 'Medium') return 'text-blue-600 bg-blue-50 border-blue-100';
    return 'text-gray-500 bg-gray-50 border-gray-100';
  };

  const getStatusColor = (status: Task['status']) => {
    if (status === 'Completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'In Progress') return 'bg-blue-50 text-blue-700 border-blue-100';
    if (status === 'Waiting') return 'bg-amber-50 text-amber-700 border-amber-100';
    if (status === 'Cancelled') return 'bg-gray-100 text-gray-500 border-gray-200';
    return 'bg-gray-50 text-gray-700 border-gray-100';
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const mappedChecklist = checklistItems.map((text, idx) => ({
      id: `chk_${Date.now()}_${idx}`,
      text,
      completed: false
    }));

    onCreateTask({
      title: newTitle,
      description: newDesc,
      priority: newPriority,
      status: newStatus,
      dueDate: newDueDate,
      customerId: newCustId || undefined,
      projectId: newProjId || undefined,
      estimatedHours: newEstHours,
      actualHours: 0,
      checklist: mappedChecklist,
      tags: newTags ? newTags.split(',').map(t => t.trim()) : [],
    });

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewPriority('Medium');
    setNewStatus('Pending');
    setNewDueDate(new Date().toISOString().split('T')[0]);
    setNewCustId('');
    setNewProjId('');
    setNewEstHours(2);
    setNewTags('');
    setChecklistItems([]);
    setShowCreateModal(false);
  };

  const addChecklistItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklistItems([...checklistItems, newCheckItem.trim()]);
    setNewCheckItem('');
  };

  const addCheckitemToActiveTask = (text: string) => {
    if (!activeTask || !text.trim()) return;
    const newItem = {
      id: `chk_${Date.now()}`,
      text: text.trim(),
      completed: false
    };
    onUpdateTask(activeTask.id, {
      checklist: [...activeTask.checklist, newItem]
    });
  };

  const toggleCheckitemActiveTask = (itemId: string) => {
    if (!activeTask) return;
    const updated = activeTask.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateTask(activeTask.id, { checklist: updated });
  };

  const deleteCheckitemActiveTask = (itemId: string) => {
    if (!activeTask) return;
    const updated = activeTask.checklist.filter(item => item.id !== itemId);
    onUpdateTask(activeTask.id, { checklist: updated });
  };

  const logHoursActiveTask = () => {
    if (!activeTask) return;
    const currentActual = activeTask.actualHours || 0;
    onUpdateTask(activeTask.id, {
      actualHours: currentActual + Number(logTimeValue)
    });
    setLogTimeValue(1);
  };

  // Kanban statuses
  const kanbanColumns: Task['status'][] = ['Pending', 'In Progress', 'Waiting', 'Completed'];

  return (
    <div className="space-y-6 relative h-[calc(100vh-140px)] flex flex-col">
      
      {/* Top action header bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Kanban Board
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <ListTodo className="h-3.5 w-3.5" />
            List Queue
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-blue-500 px-2.5 py-1.5 rounded-xl text-gray-700 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting">Waiting</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-blue-500 px-2.5 py-1.5 rounded-xl text-gray-700 font-medium"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-bold text-xs shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </button>
        </div>
      </div>

      {/* Main viewport */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' ? (
          /* KANBAN BOARD VIEW */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full overflow-x-auto pb-2">
            {kanbanColumns.map(col => {
              const columnTasks = filteredTasks.filter(t => t.status === col);
              return (
                <div key={col} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex flex-col h-full min-w-[240px]">
                  {/* Column Header */}
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${col === 'In Progress' ? 'bg-blue-500' : col === 'Completed' ? 'bg-emerald-500' : col === 'Waiting' ? 'bg-amber-500' : 'bg-gray-400'}`}></span>
                      {col}
                    </h3>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Column scroll area */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                    {columnTasks.length > 0 ? (
                      columnTasks.map(task => {
                        const cust = customers.find(c => c.id === task.customerId);
                        const proj = projects.find(p => p.id === task.projectId);
                        const completedItems = task.checklist.filter(c => c.completed).length;
                        const totalItems = task.checklist.length;
                        const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                        
                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            className="bg-white border border-gray-100 hover:border-blue-200 cursor-pointer p-4 rounded-xl shadow-sm transition hover:shadow-md space-y-3 relative group"
                          >
                            <div className="space-y-1">
                              <div className="flex justify-between items-start gap-1">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                <span className="text-[9px] text-gray-400 font-mono">
                                  {task.dueDate}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                                {task.title}
                              </h4>
                            </div>

                            {/* Client & Project context */}
                            {(cust || proj) && (
                              <div className="space-y-0.5 text-[10px] text-gray-500">
                                {cust && <p className="truncate font-semibold flex items-center gap-1">🏢 {cust.company}</p>}
                                {proj && <p className="truncate flex items-center gap-1">⚙️ {proj.name}</p>}
                              </div>
                            )}

                            {/* Progress indicators */}
                            {totalItems > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[9px] text-gray-400">
                                  <span>Checklist: {completedItems}/{totalItems}</span>
                                  <span>{pct}%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            )}

                            {/* Footer parameters */}
                            <div className="flex justify-between items-center pt-2 border-t border-gray-50 text-[10px] text-gray-400">
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="h-3 w-3" />
                                {task.actualHours || 0}/{task.estimatedHours || 0}h
                              </span>
                              
                              {task.tags.length > 0 && (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono truncate max-w-[80px]">
                                  #{task.tags[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10 text-gray-300 text-xs border border-dashed border-gray-100 rounded-xl">No tasks here.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* QUEUE LIST VIEW */
          <div className="bg-white border border-gray-100 rounded-2xl h-full flex flex-col shadow-sm">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Task Details</th>
                    <th className="p-4">Customer & Project</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4 text-right">Time Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map(task => {
                      const cust = customers.find(c => c.id === task.customerId);
                      const proj = projects.find(p => p.id === task.projectId);
                      return (
                        <tr 
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="hover:bg-blue-50/20 cursor-pointer transition"
                        >
                          <td className="p-4">
                            <p className="font-bold text-gray-900">{task.title}</p>
                            <p className="text-gray-500 line-clamp-1 max-w-sm mt-0.5">{task.description}</p>
                          </td>
                          <td className="p-4 space-y-0.5">
                            {cust && <p className="font-semibold text-gray-700">{cust.company}</p>}
                            {proj && <p className="text-gray-400">{proj.name}</p>}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-gray-500">{task.dueDate}</td>
                          <td className="p-4 text-right font-mono font-bold text-gray-800">
                            {task.actualHours || 0} / {task.estimatedHours || 0} hrs
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">No tasks found matching current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Task detail slide-over drawer Panel */}
      {selectedTaskId && activeTask && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-112 bg-white shadow-2xl border-l border-gray-100 p-6 flex flex-col z-30 transition-all">
          <div className="flex justify-between items-start pb-4 border-b border-gray-100">
            <div className="space-y-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getStatusColor(activeTask.status)}`}>
                {activeTask.status}
              </span>
              <h2 className="text-sm font-bold text-gray-900 leading-snug">{activeTask.title}</h2>
            </div>
            <button 
              onClick={() => setSelectedTaskId(null)}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-5">
            {/* Context mapping */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-[10px] text-gray-400 font-semibold block uppercase">Due Date</span>
                <span className="font-bold text-gray-800 font-mono">{activeTask.dueDate}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-[10px] text-gray-400 font-semibold block uppercase">Priority</span>
                <span className={`font-bold uppercase ${activeTask.priority === 'High' ? 'text-red-600' : 'text-gray-700'}`}>{activeTask.priority}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Scope Description</span>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100">{activeTask.description || 'No description provided.'}</p>
            </div>

            {/* Time logging */}
            <div className="space-y-2 p-4 bg-blue-50/30 border border-blue-100/50 rounded-xl">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block font-mono">Labor Time Tracking</span>
              <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                <span>Total spent: {activeTask.actualHours || 0} hours</span>
                <span className="text-gray-400">Estimate: {activeTask.estimatedHours || 0} hours</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={logTimeValue}
                  onChange={e => setLogTimeValue(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded bg-white text-center"
                />
                <button
                  onClick={logHoursActiveTask}
                  className="flex-1 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition"
                >
                  Log Work Hours
                </button>
              </div>
            </div>

            {/* Checklist items list */}
            <div className="space-y-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Operational Checklist</span>
              <div className="space-y-1.5">
                {activeTask.checklist.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50/40 p-2 rounded-lg border border-gray-100 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleCheckitemActiveTask(item.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                      <span className={`truncate ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.text}</span>
                    </label>
                    <button
                      onClick={() => deleteCheckitemActiveTask(item.id)}
                      className="text-gray-300 hover:text-red-500 transition ml-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add checklist item */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add micro-step..."
                  id="active-new-checklist-input"
                  className="flex-1 px-3 py-1.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg text-xs"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      addCheckitemToActiveTask((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>
            </div>

            {/* Status change actions */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Change Status Column</span>
              <div className="flex flex-wrap gap-1">
                {['Pending', 'In Progress', 'Waiting', 'Completed', 'Cancelled'].map(s => (
                  <button
                    key={s}
                    onClick={() => onUpdateTask(activeTask.id, { status: s as any })}
                    className={`px-2 py-1 border text-[10px] rounded font-bold transition ${activeTask.status === s ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-600'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Link back to source email if exists */}
            {activeTask.emailId && (
              <button
                onClick={() => onNavigate('email', { emailId: activeTask.emailId })}
                className="w-full flex items-center justify-between p-3 border border-blue-100 bg-blue-50/20 hover:bg-blue-50/50 rounded-xl text-blue-600 text-xs font-semibold transition"
              >
                <span>View Original Email Thread</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {/* Delete button */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  onDeleteTask(activeTask.id);
                  setSelectedTaskId(null);
                }}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 className="h-4 w-4" />
                Delete Task
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Schedule Task Deliverable</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase tracking-wide block">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Deliver quotation package v2"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase tracking-wide block">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide complete notes on project specifications..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Status Column</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting">Waiting</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Customer Target</label>
                  <select
                    value={newCustId}
                    onChange={e => setNewCustId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="">None (Internal)</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Project Folder</label>
                  <select
                    value={newProjId}
                    onChange={e => setNewProjId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="">None (Standalone)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Estimated Hours</label>
                  <input
                    type="number"
                    min="1"
                    value={newEstHours}
                    onChange={e => setNewEstHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Checklist builder */}
              <div className="space-y-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-semibold text-gray-700 uppercase tracking-wide block">Build Micro Checklist</span>
                
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {checklistItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1 rounded border border-gray-100">
                      <span>{item}</span>
                      <button 
                        type="button" 
                        onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== idx))}
                        className="text-red-500 text-[10px] font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter micro task..."
                    value={newCheckItem}
                    onChange={e => setNewCheckItem(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg bg-white"
                  />
                  <button
                    type="button"
                    onClick={addChecklistItem}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase tracking-wide block">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="CNC, Titanium, Billing"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide shadow-sm"
              >
                Schedule Task
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
