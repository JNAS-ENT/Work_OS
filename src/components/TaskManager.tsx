/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, CheckSquare, Clock, Calendar, AlertCircle, Trash2, 
  ChevronRight, AlignLeft, Paperclip, MessageSquare, Tag, 
  User, CheckCircle2, ListFilter, LayoutGrid, Play, Pause, ListTodo,
  Sparkles, TrendingUp, ShieldAlert, Zap, Layers, RefreshCw, Eye, 
  BookOpen, Activity, Compass, Coffee, Check, Search, CalendarDays, BarChart2,
  AlertTriangle, RotateCcw, Flame, CheckCircle, ExternalLink, HelpCircle
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

type ViewMode = 'kanban' | 'list' | 'planner' | 'workload' | 'gantt' | 'calendar';
type PlannerMode = 'morning' | 'evening';

export default function TaskManager({
  tasks, customers, projects, onCreateTask, onUpdateTask, onDeleteTask, onNavigate
}: TaskManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Pomodoro Focus Timer State
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [pomodoroTask, setPomodoroTask] = useState<string>('');
  const [idleWarning, setIdleWarning] = useState(false);
  const [idleTicks, setIdleTicks] = useState(0);

  // Daily Planner toggle
  const [plannerMode, setPlannerMode] = useState<PlannerMode>('morning');

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
  const [newDept, setNewDept] = useState('Engineering');
  const [newCategory, setNewCategory] = useState('General');
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [parentTaskId, setParentTaskId] = useState('');
  const [blockingTaskId, setBlockingTaskId] = useState('');

  // Selected task detail view
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [logTimeValue, setLogTimeValue] = useState<number>(1);
  const [commentText, setCommentText] = useState('');
  const [taskComments, setTaskComments] = useState<Record<string, {id: string, text: string, sender: string, date: string}[]>>({
    'tsk_seed_1': [{ id: 'c1', text: 'Drawing revisions have been finalized and linked.', sender: 'Dr. Aaron Chen', date: '2026-06-27' }]
  });

  const activeTask = tasks.find(t => t.id === selectedTaskId);

  // Pomodoro ticking
  useEffect(() => {
    let interval: any = null;
    if (pomodoroActive) {
      interval = setInterval(() => {
        if (pomodoroSeconds > 0) {
          setPomodoroSeconds(pomodoroSeconds - 1);
        } else if (pomodoroMinutes > 0) {
          setPomodoroMinutes(pomodoroMinutes - 1);
          setPomodoroSeconds(59);
        } else {
          // Timer finished
          if (pomodoroMode === 'work') {
            alert('🎉 Work Session complete! Take a brief break.');
            // Automatically log logged hours if a task was linked
            if (pomodoroTask) {
              const targetTask = tasks.find(t => t.id === pomodoroTask);
              if (targetTask) {
                onUpdateTask(targetTask.id, {
                  actualHours: (targetTask.actualHours || 0) + 0.5
                });
                logSystemActivity('Time Tracker', `Logged 25 mins Focus Session on task: "${targetTask.title}"`);
              }
            }
            setPomodoroMode('break');
            setPomodoroMinutes(5);
          } else {
            alert('⏱️ Break is over! Let\'s focus again.');
            setPomodoroMode('work');
            setPomodoroMinutes(25);
          }
          setPomodoroActive(false);
        }

        // Simulated Idle Detection
        setIdleTicks(prev => {
          const next = prev + 1;
          if (next > 45) {
            setIdleWarning(true);
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroMinutes, pomodoroSeconds, pomodoroMode, pomodoroTask]);

  // Reset idle check when mouse moves over container
  const handleMouseMove = () => {
    setIdleTicks(0);
    if (idleWarning) {
      setIdleWarning(false);
    }
  };

  const getPriorityColor = (prio: Task['priority']) => {
    if (prio === 'High') return 'text-red-700 bg-red-50 border-red-100';
    if (prio === 'Medium') return 'text-amber-700 bg-amber-50 border-amber-100';
    return 'text-slate-500 bg-slate-50 border-slate-100';
  };

  const getStatusColor = (status: Task['status']) => {
    if (status === 'Completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'In Progress') return 'bg-blue-50 text-blue-700 border-blue-100';
    if (status === 'Waiting') return 'bg-amber-50 text-amber-700 border-amber-100';
    if (status === 'Cancelled') return 'bg-rose-50 text-rose-700 border-rose-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  const logSystemActivity = (type: string, msg: string) => {
    fetch('/api/logs/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 'info', message: `[${type}] ${msg}` })
    }).catch(e => console.error(e));
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
      // Extra operational attributes saved via req.body fallback
      ...({
        department: newDept,
        category: newCategory,
        parentTaskId: parentTaskId || undefined,
        blockingTaskId: blockingTaskId || undefined,
        createdAt: new Date().toISOString()
      } as any)
    });

    logSystemActivity('Task Engine', `Scheduled new task: "${newTitle}" under ${newDept}`);

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
    setNewDept('Engineering');
    setNewCategory('General');
    setChecklistItems([]);
    setParentTaskId('');
    setBlockingTaskId('');
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
      checklist: [...(activeTask.checklist || []), newItem]
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
    logSystemActivity('Time Log', `Logged ${logTimeValue} hrs of operational time on task "${activeTask.title}"`);
    setLogTimeValue(1);
  };

  const handleAddComment = () => {
    if (!selectedTaskId || !commentText.trim()) return;
    const list = taskComments[selectedTaskId] || [];
    const newComment = {
      id: `comm_${Date.now()}`,
      text: commentText.trim(),
      sender: 'Lead Operations Co-Pilot',
      date: new Date().toISOString().split('T')[0]
    };
    setTaskComments({
      ...taskComments,
      [selectedTaskId]: [...list, newComment]
    });
    setCommentText('');
  };

  const triggerAISuggestedEscalation = (task: Task) => {
    // Dynamic escalation priority algorithm
    onUpdateTask(task.id, {
      priority: 'High'
    });
    logSystemActivity('AI Planner', `Automatically escalated task priority for "${task.title}" due to critical delay factors.`);
  };

  // Natural Language presets trigger
  const handleNLSearchPreset = (preset: string) => {
    setSearchQuery(preset);
    if (preset === "Show today's tasks") {
      const todayStr = new Date().toISOString().split('T')[0];
      setSearchQuery(todayStr);
    } else if (preset === "Show high priority work") {
      setPriorityFilter("High");
      setSearchQuery('');
    } else if (preset === "Show engineering tasks") {
      setDeptFilter("Engineering");
      setSearchQuery('');
    } else if (preset === "Show overdue RFQs") {
      setSearchQuery('RFQ');
      setStatusFilter('Pending');
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    
    // Extra fields fetched
    const tDept = (t as any).department || 'Engineering';
    const matchesDept = deptFilter === 'All' || tDept === deptFilter;

    const query = searchQuery.toLowerCase();
    const matchesSearch = query === '' || 
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.dueDate.toLowerCase().includes(query) ||
      t.tags.some(tag => tag.toLowerCase().includes(query)) ||
      ((t as any).category && (t as any).category.toLowerCase().includes(query)) ||
      ((t as any).department && (t as any).department.toLowerCase().includes(query));

    return matchesStatus && matchesPriority && matchesDept && matchesSearch;
  });

  // WORKLOAD CALCULATIONS
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const todayTasksCount = tasks.filter(t => t.dueDate === todayStr && t.status !== 'Completed').length;
  const tomorrowTasksCount = tasks.filter(t => t.dueDate === tomorrowStr && t.status !== 'Completed').length;
  
  const estimatedHoursSum = filteredTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
  const actualHoursSum = filteredTasks.reduce((acc, t) => acc + (t.actualHours || 0), 0);

  // Advanced KPIs
  const capacityHours = 40; // baseline capacity per week
  const overloadedTasks = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed' && t.dueDate <= todayStr);
  const availableCapacity = Math.max(0, capacityHours - estimatedHoursSum);
  const completionPercentage = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100) : 0;
  
  // Stress & Productivity Metrics
  const stressScore = Math.min(100, Math.round((overloadedTasks.length * 20) + (estimatedHoursSum > 35 ? 30 : estimatedHoursSum * 0.8)));
  const productivityScore = Math.min(100, Math.round((completionPercentage * 0.7) + (actualHoursSum > 0 ? (actualHoursSum / (estimatedHoursSum || 1)) * 30 : 15)));

  // Grouped work distribution for workload chart
  const deptHours: Record<string, number> = {};
  tasks.forEach(t => {
    const d = (t as any).department || 'Engineering';
    deptHours[d] = (deptHours[d] || 0) + (t.estimatedHours || 2);
  });

  // Kanban statuses
  const kanbanColumns: Task['status'][] = ['Pending', 'In Progress', 'Waiting', 'Completed'];

  return (
    <div onMouseMove={handleMouseMove} className="space-y-6 relative h-[calc(100vh-140px)] flex flex-col">
      
      {/* Sticky Pomodoro Timer and Idle Warnings Bar */}
      <div className="bg-slate-900 text-slate-100 px-6 py-3 rounded-2xl flex flex-wrap justify-between items-center gap-4 shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-rose-600 rounded-lg animate-pulse">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">AI Labor Focus Engine</span>
            <span className="text-xs font-semibold text-slate-200">
              {pomodoroTask ? `Focusing on: "${tasks.find(t => t.id === pomodoroTask)?.title || 'Selected Task'}"` : 'Independent Work Session'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Simulated Inactivity Warning */}
          {idleWarning && (
            <div className="flex items-center gap-1.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-xl animate-bounce">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Idle Detected: Refresh work tracking</span>
            </div>
          )}

          <div className="flex items-center gap-3 font-mono text-lg font-bold bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800">
            <Clock className="h-4 w-4 text-rose-500 shrink-0" />
            <span>
              {String(pomodoroMinutes).padStart(2, '0')}:{String(pomodoroSeconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded">
              {pomodoroMode}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPomodoroActive(!pomodoroActive)}
              className={`p-2 rounded-xl transition ${pomodoroActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'} text-white`}
              title={pomodoroActive ? 'Pause Session' : 'Start Pomodoro Session'}
            >
              {pomodoroActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={() => {
                setPomodoroActive(false);
                setPomodoroMinutes(25);
                setPomodoroSeconds(0);
                setPomodoroMode('work');
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300"
              title="Reset Timer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <select
            value={pomodoroTask}
            onChange={e => setPomodoroTask(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-800 focus:outline-none px-2.5 py-2 rounded-xl text-slate-300 max-w-[150px]"
          >
            <option value="">-- Associate Task --</option>
            {tasks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top action header bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'kanban', label: 'Kanban Board', icon: LayoutGrid },
            { id: 'list', label: 'List Queue', icon: ListTodo },
            { id: 'planner', label: 'Smart Planner', icon: Compass },
            { id: 'workload', label: 'Workload Analysis', icon: BarChart2 },
            { id: 'gantt', label: 'Timeline / Gantt', icon: Layers },
            { id: 'calendar', label: 'Task Calendar', icon: CalendarDays }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id}
                onClick={() => setViewMode(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${viewMode === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Global Toolbar and Add task triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-bold text-xs shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </button>
        </div>
      </div>

      {/* Search Bar & AI Natural Language Assistant Prompts */}
      <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks, category, tags, or type natural language command..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl text-xs font-medium"
          />
        </div>

        {/* NLP suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400">
          <span className="font-bold flex items-center gap-1 mr-1 text-gray-500">
            <Sparkles className="h-3 w-3 text-blue-500" /> AI Prompts:
          </span>
          {[
            "Show today's tasks",
            "Show high priority work",
            "Show engineering tasks",
            "Show overdue RFQs"
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleNLSearchPreset(preset)}
              className="px-2 py-1 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg border border-gray-100 transition text-[10px] font-semibold text-gray-600 cursor-pointer"
            >
              {preset}
            </button>
          ))}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-red-500 font-bold ml-2 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main Filter Toolbar */}
      {viewMode !== 'planner' && viewMode !== 'workload' && (
        <div className="bg-white border border-gray-100 p-3 rounded-2xl shadow-sm flex flex-wrap gap-2 text-xs items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <ListFilter className="h-3 w-3" /> Filters:
          </span>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 px-2 py-1.5 rounded-xl text-gray-600 font-medium focus:ring-1 focus:ring-blue-500"
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
            className="bg-gray-50 border border-gray-200 px-2 py-1.5 rounded-xl text-gray-600 font-medium focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 px-2 py-1.5 rounded-xl text-gray-600 font-medium focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
            <option value="Finance">Finance</option>
            <option value="Purchase">Purchase</option>
            <option value="QA">QA</option>
            <option value="General">General</option>
          </select>
        </div>
      )}

      {/* Viewport Render area */}
      <div className="flex-1 overflow-hidden">
        
        {/* 1. KANBAN BOARD VIEW */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full overflow-x-auto pb-2">
            {kanbanColumns.map(col => {
              const columnTasks = filteredTasks.filter(t => t.status === col);
              return (
                <div key={col} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col h-full min-w-[250px]">
                  {/* Column Header */}
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col === 'In Progress' ? 'bg-blue-500' : col === 'Completed' ? 'bg-emerald-500' : col === 'Waiting' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
                      {col}
                    </h3>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Column scroll area */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {columnTasks.length > 0 ? (
                      columnTasks.map(task => {
                        const cust = customers.find(c => c.id === task.customerId);
                        const proj = projects.find(p => p.id === task.projectId);
                        const completedItems = task.checklist?.filter(c => c.completed).length || 0;
                        const totalItems = task.checklist?.length || 0;
                        const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                        const hasDependencies = (task as any).blockingTaskId || (task as any).parentTaskId;

                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            className="bg-white border border-slate-100 hover:border-blue-300 cursor-pointer p-4 rounded-xl shadow-xs hover:shadow-md transition duration-200 space-y-3 relative group"
                          >
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-start gap-1">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono font-bold">
                                  {task.dueDate}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                                {task.title}
                              </h4>
                            </div>

                            {/* Client & Project context */}
                            {(cust || proj) && (
                              <div className="space-y-0.5 text-[10px] text-slate-500">
                                {cust && <p className="truncate font-semibold flex items-center gap-1 text-slate-600">🏢 {cust.company}</p>}
                                {proj && <p className="truncate flex items-center gap-1 text-slate-500">📁 {proj.name}</p>}
                              </div>
                            )}

                            {/* Subtask / Dependencies Flag */}
                            {hasDependencies && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {(task as any).parentTaskId && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 rounded-md font-bold font-mono">
                                    Subtask
                                  </span>
                                )}
                                {(task as any).blockingTaskId && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-md font-bold font-mono flex items-center gap-0.5">
                                    <ShieldAlert className="h-2 w-2" /> Blocked
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Progress indicators */}
                            {totalItems > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold">
                                  <span>Tasks: {completedItems}/{totalItems}</span>
                                  <span>{pct}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            )}

                            {/* Footer parameters */}
                            <div className="flex justify-between items-center pt-2 border-t border-slate-50 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1 font-mono font-bold text-slate-500">
                                <Clock className="h-3 w-3 text-slate-400" />
                                {task.actualHours || 0}/{task.estimatedHours || 0}h
                              </span>
                              
                              {task.tags.length > 0 && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-mono text-[9px] truncate max-w-[90px]">
                                  #{task.tags[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10 text-slate-300 text-xs border border-dashed border-slate-200 rounded-xl bg-white">No tasks in queue.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. QUEUE LIST VIEW */}
        {viewMode === 'list' && (
          <div className="bg-white border border-gray-100 rounded-2xl h-full flex flex-col shadow-sm">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Task Details</th>
                    <th className="p-4">Customer & Project</th>
                    <th className="p-4">Department</th>
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
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{task.title}</span>
                              {task.tags.map((tag, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-mono">#{tag}</span>
                              ))}
                            </div>
                            <p className="text-gray-500 line-clamp-1 max-w-sm mt-0.5">{task.description}</p>
                          </td>
                          <td className="p-4 space-y-0.5">
                            {cust && <p className="font-semibold text-gray-700">{cust.company}</p>}
                            {proj && <p className="text-gray-400">{proj.name}</p>}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-[10px] font-bold">
                              {(task as any).department || 'Engineering'}
                            </span>
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
                      <td colSpan={7} className="p-8 text-center text-gray-400">No tasks found matching current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. SMART DAILY PLANNER VIEW */}
        {viewMode === 'planner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-y-auto pb-4">
            
            {/* Left planner console (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-1.5 text-indigo-200">
                    <Sparkles className="h-4 w-4 text-indigo-400" /> Co-Pilot Daily Planner
                  </h3>
                  <div className="flex bg-slate-950/60 p-0.5 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setPlannerMode('morning')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition ${plannerMode === 'morning' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      Morning Briefing
                    </button>
                    <button
                      onClick={() => setPlannerMode('evening')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition ${plannerMode === 'evening' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      EOD Review
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h2 className="text-xl font-extrabold tracking-tight">
                    {plannerMode === 'morning' ? '☀️ Build Your Day for Focus' : '🌙 Review Daily Milestone Progress'}
                  </h2>
                  <p className="text-xs text-indigo-200/80 leading-relaxed">
                    {plannerMode === 'morning' 
                      ? 'AI rearranged today\'s workspace to accommodate tight deadlines, critical meetings, and pending high-value RFQs.' 
                      : 'Excellent! You achieved 80% completion of the targeted workload. Here is tomorrow\'s scheduling roadmap.'
                    }
                  </p>
                </div>

                {/* AI Summary Recommendation Badge */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-indigo-500/20 text-xs text-indigo-100 space-y-1.5">
                  <span className="font-bold flex items-center gap-1 text-[10px] text-indigo-300 uppercase tracking-widest">
                    <Zap className="h-3.5 w-3.5 text-amber-400" /> AI Suggested Focus
                  </span>
                  <p className="leading-relaxed">
                    "Tackle the Titanium Bracket drawing revisions first to clear the engineering blocker, then finalize the Reliance quotation due by 17:00 UTC."
                  </p>
                </div>
              </div>

              {/* Quick AI Recommended Actions list */}
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">AI Tactical Recommendations</h4>
                <div className="space-y-2">
                  {[
                    { title: 'Do First', desc: 'Titanium Bracket Drawing Revisions', cost: '1.5 hrs', action: 'focus' },
                    { title: 'Schedule Later', desc: 'CNC Supplier Quote Request', cost: '0.5 hrs', action: 'defer' },
                    { title: 'Delegate Option', desc: 'Document CAD standards assembly', cost: '3.0 hrs', action: 'delegate' },
                    { title: 'Follow-up Needed', desc: 'Contact James on Titanium Plate thickness', cost: 'Call', action: 'contact' }
                  ].map((rec, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-wide block">{rec.title}</span>
                        <span className="font-semibold text-slate-800">{rec.desc}</span>
                      </div>
                      <span className="text-[10px] bg-slate-200/60 font-mono font-bold px-2 py-0.5 rounded text-slate-600">
                        {rec.cost}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right scheduler viewport (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm">
                    {plannerMode === 'morning' ? 'Scheduled Today\'s Active Queue' : 'Historical completed logs & remaining backlog'}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Date: {todayStr}</span>
                </div>

                <div className="space-y-3">
                  {plannerMode === 'morning' ? (
                    // Scheduled Today's Tasks
                    tasks.filter(t => t.status !== 'Completed').map(t => {
                      const cust = customers.find(c => c.id === t.customerId);
                      return (
                        <div key={t.id} className="p-4 bg-slate-50/50 border border-slate-100 hover:border-blue-100 rounded-xl flex flex-wrap justify-between items-center gap-3 transition">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded border uppercase ${getPriorityColor(t.priority)}`}>
                                {t.priority}
                              </span>
                              <span className="font-bold text-slate-800 text-xs">{t.title}</span>
                            </div>
                            <p className="text-[11px] text-slate-500">{t.description}</p>
                            {cust && <span className="text-[10px] text-slate-400 font-semibold block">🏢 Client: {cust.company}</span>}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono font-bold">Est: {t.estimatedHours || 2}h</span>
                            <button
                              onClick={() => onUpdateTask(t.id, { status: 'In Progress' })}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition"
                            >
                              Start
                            </button>
                            <button
                              onClick={() => triggerAISuggestedEscalation(t)}
                              className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-lg text-[10px] font-bold transition"
                              title="AI Priority Escalation"
                            >
                              <Flame className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Evening EOD completed list
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Completed Today
                        </h4>
                        {tasks.filter(t => t.status === 'Completed').length > 0 ? (
                          tasks.filter(t => t.status === 'Completed').map(t => (
                            <div key={t.id} className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700">{t.title}</span>
                              <span className="text-emerald-700 font-bold font-mono">+{t.actualHours || 2}h Spent</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic">No tasks marked complete today yet.</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remaining Backlog / Tomorrow</h4>
                        {tasks.filter(t => t.status !== 'Completed').map(t => (
                          <div key={t.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">{t.title}</span>
                            <span className="text-slate-400 font-mono">Due: {t.dueDate}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. AI WORKLOAD & PRODUCTIVITY ANALYSIS */}
        {viewMode === 'workload' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-y-auto pb-4">
            
            {/* Left KPI summary pane (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                  <BarChart2 className="h-4 w-4 text-blue-500" /> Operational Capacity Metrics
                </h3>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100/50">
                    <span className="text-2xl font-extrabold text-blue-800">{estimatedHoursSum}h</span>
                    <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">Estimated Load</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-xl border border-purple-100/50">
                    <span className="text-2xl font-extrabold text-purple-800">{actualHoursSum}h</span>
                    <p className="text-[9px] text-purple-600 font-bold uppercase tracking-wider mt-0.5">Actual Logged</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-50">
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span className="font-semibold">Weekly Capacity Threshold:</span>
                    <span className="font-mono font-bold">{capacityHours} hrs</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span className="font-semibold">Remaining Free Buffer:</span>
                    <span className="font-mono font-bold text-emerald-600">{availableCapacity} hrs</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span className="font-semibold">Overloaded Deliverables:</span>
                    <span className={`font-mono font-bold ${overloadedTasks.length > 0 ? 'text-red-500' : 'text-slate-500'}`}>{overloadedTasks.length} tasks</span>
                  </div>
                </div>
              </div>

              {/* Stress & Productivity Score Rings */}
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Productivity Indexes</h3>
                
                <div className="space-y-4">
                  {/* Stress Score */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Backlog Stress Score
                      </span>
                      <span className="font-bold text-amber-600">{stressScore}/100</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stressScore}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-400 block italic">Calculated from ratio of overloaded high-priority items.</span>
                  </div>

                  {/* Productivity Score */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Focus Efficiency Score
                      </span>
                      <span className="font-bold text-emerald-600">{productivityScore}/100</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${productivityScore}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-400 block italic">Calculated from total completed vs total estimated backlog hours.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Heatmap & Work Distribution (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Daily Workload Heatmap */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Weekly Workload Allocation Heatmap</h3>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">Estimated hours</span>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs">
                  {[
                    { day: 'Mon', hours: 4, tasks: 2 },
                    { day: 'Tue', hours: 8, tasks: 4 },
                    { day: 'Wed', hours: 10, tasks: 5 },
                    { day: 'Thu', hours: 6, tasks: 3 },
                    { day: 'Fri', hours: 5, tasks: 2 },
                    { day: 'Sat', hours: 2, tasks: 1 },
                    { day: 'Sun', hours: 0, tasks: 0 }
                  ].map((item, idx) => {
                    const pct = Math.min(100, (item.hours / 10) * 100);
                    return (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">{item.day}</span>
                        <div className="h-24 w-full bg-slate-100 rounded-full flex flex-col justify-end overflow-hidden">
                          <div 
                            className={`rounded-full transition-all duration-500 ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-blue-600'}`}
                            style={{ height: `${pct}%` }}
                          ></div>
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">{item.hours}h</span>
                          <span className="text-[9px] text-slate-400">{item.tasks} tasks</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Department Distribution */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Labor hours by organization sector</h3>
                
                <div className="space-y-3 text-xs">
                  {Object.entries(deptHours).map(([dept, hours]) => {
                    const totalHours = Object.values(deptHours).reduce((a, b) => a + b, 0);
                    const pct = Math.round((hours / (totalHours || 1)) * 100);
                    return (
                      <div key={dept} className="space-y-1">
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-semibold">{dept}</span>
                          <span className="font-mono font-bold">{hours} hrs ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-100">
                          <div className="bg-purple-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. GANTT TIMELINE VIEW */}
        {viewMode === 'gantt' && (
          <div className="bg-white border border-gray-100 rounded-2xl h-full flex flex-col shadow-sm p-5 overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-gray-50 mb-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Engineering Project Roadmap (Gantt Chart)</h3>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-600 rounded"></span> In Progress</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded"></span> Completed</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded"></span> High Priority</span>
              </div>
            </div>

            <div className="space-y-4 min-w-[600px]">
              {filteredTasks.map((t, idx) => {
                // Determine simulated horizontal offset based on due date day offset
                const dayOffset = Math.max(5, (new Date(t.dueDate).getDate() % 15) * 5);
                const widthPercent = Math.min(60, (t.estimatedHours || 4) * 5);
                const isCompleted = t.status === 'Completed';

                return (
                  <div key={t.id} className="grid grid-cols-12 gap-4 items-center text-xs">
                    {/* Task Title label */}
                    <div className="col-span-4 pr-2 border-r border-gray-50 py-1.5">
                      <p className="font-bold text-slate-800 truncate" title={t.title}>{t.title}</p>
                      <span className="text-[10px] text-slate-400 font-mono">Due: {t.dueDate}</span>
                    </div>

                    {/* Timeline bar map */}
                    <div className="col-span-8 bg-slate-50 h-8 rounded-xl relative overflow-hidden border border-slate-100">
                      <div 
                        onClick={() => setSelectedTaskId(t.id)}
                        className={`absolute h-5 top-1.5 rounded-lg cursor-pointer transition flex items-center px-2 text-[9px] font-bold text-white shadow-xs ${isCompleted ? 'bg-emerald-500' : t.priority === 'High' ? 'bg-rose-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}`}
                        style={{ left: `${dayOffset}%`, width: `${widthPercent}%` }}
                      >
                        <span className="truncate">{t.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. TASK CALENDAR GRID VIEW */}
        {viewMode === 'calendar' && (
          <div className="bg-white border border-gray-100 rounded-2xl h-full flex flex-col shadow-sm p-4 overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50 mb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Deliverable Deadlines Calendar</h3>
              <span className="text-xs font-mono font-bold text-slate-500">June 2026</span>
            </div>

            {/* Month grid header */}
            <div className="grid grid-cols-7 text-center font-bold text-[10px] text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-50">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Calendar grid items (35 days block) */}
            <div className="grid grid-cols-7 grid-rows-5 gap-1.5 pt-2 flex-1 min-h-[400px]">
              {Array.from({ length: 35 }).map((_, idx) => {
                const dayNum = (idx % 30) + 1;
                const formattedDay = `2026-06-${String(dayNum).padStart(2, '0')}`;
                const dayTasks = tasks.filter(t => t.dueDate === formattedDay);

                return (
                  <div key={idx} className="bg-slate-50/50 border border-slate-100 p-1.5 rounded-xl min-h-[70px] flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400">{dayNum}</span>
                    <div className="flex-1 overflow-y-auto space-y-1 pt-1">
                      {dayTasks.map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => setSelectedTaskId(t.id)}
                          className={`text-[9px] font-bold p-1 rounded border truncate cursor-pointer ${t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : t.priority === 'High' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}
                          title={t.title}
                        >
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Task detail slide-over drawer Panel */}
      {selectedTaskId && activeTask && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-112 bg-white shadow-2xl border-l border-gray-100 p-6 flex flex-col z-30 transition-all">
          <div className="flex justify-between items-start pb-4 border-b border-gray-100">
            <div className="space-y-1">
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-extrabold uppercase tracking-widest ${getStatusColor(activeTask.status)}`}>
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
              <div className="bg-gray-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Due Date Target</span>
                <span className="font-bold text-gray-800 font-mono">{activeTask.dueDate}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Priority Rank</span>
                <span className={`font-bold uppercase ${activeTask.priority === 'High' ? 'text-red-600' : 'text-gray-700'}`}>{activeTask.priority}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Category Type</span>
                <span className="font-bold text-slate-700">{(activeTask as any).category || 'General'}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Assigned Team</span>
                <span className="font-bold text-slate-700">{(activeTask as any).department || 'Engineering'}</span>
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
                  className="w-16 px-2 py-1 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded bg-white text-center font-bold"
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
                {(activeTask.checklist || []).map(item => (
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

            {/* Task Comments Section */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Operational Remarks & Audits</span>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(taskComments[activeTask.id] || []).map((comm) => (
                  <div key={comm.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                      <span>{comm.sender}</span>
                      <span>{comm.date}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">{comm.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type comment or operational update..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg text-xs bg-white"
                />
                <button
                  onClick={handleAddComment}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-950 text-white rounded-lg text-xs font-bold transition"
                >
                  Send
                </button>
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
                className="w-full flex items-center justify-between p-3 border border-blue-100 bg-blue-50/20 hover:bg-blue-50/50 rounded-xl text-blue-600 text-xs font-semibold transition animate-pulse"
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
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Department Target</label>
                  <select
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Sales">Sales</option>
                    <option value="Finance">Finance</option>
                    <option value="Purchase">Purchase</option>
                    <option value="QA">QA</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Task Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="General">General</option>
                    <option value="RFQ">RFQ Review</option>
                    <option value="Quotation">Quotation Prep</option>
                    <option value="Invoice">Invoice Audit</option>
                    <option value="Drawing">CAD Drafting</option>
                    <option value="Manufacturing">CNC Manufacturing</option>
                    <option value="Meeting">Customer Meeting</option>
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

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Parent Task ID (Subtask link)</label>
                  <input
                    type="text"
                    placeholder="e.g., tsk_1"
                    value={parentTaskId}
                    onChange={e => setParentTaskId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Blocking Task ID</label>
                  <input
                    type="text"
                    placeholder="e.g., tsk_2"
                    value={blockingTaskId}
                    onChange={e => setBlockingTaskId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg"
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
