/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, CheckSquare, Clock, Calendar, AlertCircle, Trash2, 
  ChevronRight, AlignLeft, Paperclip, MessageSquare, Tag, 
  User, CheckCircle2, ListFilter, LayoutGrid, Play, Pause, ListTodo,
  Sparkles, TrendingUp, ShieldAlert, Zap, Layers, RefreshCw, Eye, 
  BookOpen, Activity, Compass, Coffee, Check, Search, CalendarDays, BarChart2,
  AlertTriangle, RotateCcw, Flame, CheckCircle, ExternalLink, HelpCircle
} from 'lucide-react';
import { Task, Customer, Project } from '../types';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
type BoardSource = 'tasks' | 'customers' | 'rfqs' | 'quotations' | 'drawings' | 'projects';
type KanbanGroupView = 'status' | 'priority';

// Unified Card Data for reusable board
interface BoardCard {
  id: string;
  title: string;
  description: string;
  customerName?: string;
  dueDate: string;
  assignedTo?: string;
  status: 'Pending' | 'In Progress' | 'Review' | 'Completed' | string;
  priority: 'Today' | 'Critical' | 'High' | 'Medium' | 'Low' | 'Later' | string;
  tags: string[];
  columnOrder: number;
  originalItem: any;
}

export default function TaskManager({
  tasks, customers, projects, onCreateTask, onUpdateTask, onDeleteTask, onNavigate
}: TaskManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [boardSource, setBoardSource] = useState<BoardSource>('tasks');
  const [kanbanGroupView, setKanbanGroupView] = useState<KanbanGroupView>('status');
  
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected cards for multi-select drag & bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Gemini AI Connection state
  const [geminiEnabled, setGeminiEnabled] = useState(false);

  // Extra board entities fetched locally
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [drawings, setDrawings] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);

  // Fetch local sources
  const fetchLocalSources = async () => {
    try {
      const [rfqsRes, drawingsRes, quotesRes] = await Promise.all([
        fetch('/api/engineering/rfqs').then(r => r.json()).catch(() => []),
        fetch('/api/engineering/drawings').then(r => r.json()).catch(() => []),
        fetch('/api/engineering/quotations').then(r => r.json()).catch(() => [])
      ]);
      setRfqs(rfqsRes || []);
      setDrawings(drawingsRes || []);
      setQuotations(quotesRes || []);
    } catch (err) {
      console.error("Error fetching board entity sources:", err);
    }
  };

  useEffect(() => {
    fetchLocalSources();
    
    // Check if Gemini AI Integration is active
    fetch('/api/integrations/connections')
      .then(r => r.json())
      .then(data => {
        const geminiConn = data.find((c: any) => c.providerId === 'gemini');
        setGeminiEnabled(geminiConn?.status === 'Connected');
      })
      .catch(err => console.error("Error reading integration connections:", err));
  }, []);

  // Configure high fidelity dnd-kit sensors (Pointer constraints prevent scroll/click conflicts)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Drag begins only after dragging 8px
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Press and hold for 200ms to drag on touch devices
        tolerance: 8,
      },
    })
  );

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
  const [newPriority, setNewPriority] = useState<string>('Medium');
  const [newStatus, setNewStatus] = useState<string>('Pending');
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

  const handleMouseMove = () => {
    setIdleTicks(0);
    if (idleWarning) {
      setIdleWarning(false);
    }
  };

  const getPriorityColor = (prio: string) => {
    const p = prio?.toLowerCase();
    if (p === 'critical' || p === '🔥 critical') return 'text-red-700 bg-red-100/60 border-red-200';
    if (p === 'high' || p === '🔴 high') return 'text-orange-700 bg-orange-100/60 border-orange-200';
    if (p === 'today' || p === '⭐ today') return 'text-yellow-800 bg-yellow-100/60 border-yellow-200';
    if (p === 'medium' || p === '🟡 medium') return 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (p === 'low' || p === '🟢 low') return 'text-teal-700 bg-teal-50 border-teal-100';
    return 'text-slate-600 bg-slate-100 border-slate-200';
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed') return 'bg-emerald-100/60 text-emerald-800 border-emerald-200';
    if (s === 'in progress') return 'bg-yellow-100/60 text-yellow-800 border-yellow-200';
    if (s === 'review' || s === 'waiting') return 'bg-purple-100/60 text-purple-800 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
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
      ...({
        department: newDept,
        category: newCategory,
        parentTaskId: parentTaskId || undefined,
        blockingTaskId: blockingTaskId || undefined,
        createdAt: new Date().toISOString()
      } as any)
    });

    logSystemActivity('Task Engine', `Scheduled new task: "${newTitle}" under ${newDept}`);

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
    onUpdateTask(task.id, { priority: 'High' });
    logSystemActivity('AI Planner', `Automatically escalated task priority for "${task.title}" due to critical delay factors.`);
  };

  // Switch filter values based on AI suggestion buttons
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

  // Normalize source entities to unified board item format
  const rawItems: BoardCard[] = useMemo(() => {
    if (boardSource === 'tasks') {
      return tasks.map((t, index) => {
        const cust = customers.find(c => c.id === t.customerId);
        return {
          id: t.id,
          title: t.title,
          description: t.description || '',
          customerName: cust?.company,
          dueDate: t.dueDate,
          assignedTo: t.assignedTo || 'Unassigned',
          status: t.status === 'Waiting' ? 'Review' : t.status === 'Cancelled' ? 'Pending' : t.status,
          priority: t.priority,
          tags: t.tags || [],
          columnOrder: t.columnOrder !== undefined ? t.columnOrder : index,
          originalItem: t
        };
      });
    } else if (boardSource === 'customers') {
      return customers.map((c, index) => ({
        id: c.id,
        title: c.company,
        description: `Contact: ${c.contactName} • Email: ${c.email}`,
        dueDate: c.createdAt?.split('T')[0] || '',
        assignedTo: 'Sales Manager',
        status: c.status === 'Lead' ? 'Pending' : c.status === 'Active' ? 'Completed' : 'Review',
        priority: c.status === 'Lead' ? 'High' : 'Medium',
        tags: ['CRM', `Status: ${c.status}`],
        columnOrder: index,
        originalItem: c
      }));
    } else if (boardSource === 'rfqs') {
      return rfqs.map((r, index) => {
        const cust = customers.find(c => c.id === r.customerId);
        return {
          id: r.id,
          title: r.title,
          description: `RFQ: ${r.rfqNumber} • Est Value: $${r.estimatedValue || 0}`,
          customerName: cust?.company,
          dueDate: r.targetDeliveryDate,
          assignedTo: 'Procurement Specialist',
          status: r.status === 'Pending' ? 'Pending' : r.status === 'Quoted' ? 'In Progress' : r.status === 'Approved' ? 'Completed' : 'Review',
          priority: (r.estimatedValue || 0) > 40000 ? 'Critical' : (r.estimatedValue || 0) > 15000 ? 'High' : 'Medium',
          tags: ['RFQ', `Ref: ${r.drawingRef || 'None'}`],
          columnOrder: index,
          originalItem: r
        };
      });
    } else if (boardSource === 'quotations') {
      return quotations.map((q, index) => {
        const cust = customers.find(c => c.id === q.customerId);
        return {
          id: q.id,
          title: `Quote: ${q.quoteNumber}`,
          description: `RFQ ID Ref: ${q.rfqId} • Amount: $${q.amount}`,
          customerName: cust?.company,
          dueDate: q.validUntil,
          assignedTo: 'Finance Controller',
          status: q.status === 'Draft' ? 'Pending' : q.status === 'Sent' ? 'In Progress' : q.status === 'Accepted' ? 'Completed' : 'Review',
          priority: q.amount > 50000 ? 'Critical' : q.amount > 20000 ? 'High' : 'Medium',
          tags: ['Quotation', `Terms: ${q.terms || 'COD'}`],
          columnOrder: index,
          originalItem: q
        };
      });
    } else if (boardSource === 'drawings') {
      return drawings.map((d, index) => {
        const cust = customers.find(c => c.id === d.customerId);
        return {
          id: d.id,
          title: d.title,
          description: `CAD Drg: ${d.drawingNumber} • Rev: ${d.revision}`,
          customerName: cust?.company,
          dueDate: d.updatedAt?.split('T')[0] || '',
          assignedTo: d.approvedBy || 'Engineering Team',
          status: d.status === 'In Review' ? 'Review' : d.status === 'Released' ? 'Completed' : d.status === 'Approved' ? 'In Progress' : 'Pending',
          priority: d.fileType === 'STEP' || d.fileType === 'SolidWorks' ? 'Critical' : 'Medium',
          tags: ['CAD', d.fileType, `Rev: ${d.revision}`],
          columnOrder: index,
          originalItem: d
        };
      });
    } else if (boardSource === 'projects') {
      return projects.map((p, index) => {
        const cust = customers.find(c => c.id === p.customerId);
        return {
          id: p.id,
          title: p.name,
          description: p.description,
          customerName: cust?.company,
          dueDate: p.endDate,
          assignedTo: 'Project Director',
          status: p.status === 'Planning' ? 'Pending' : p.status === 'Active' ? 'In Progress' : p.status === 'Completed' ? 'Completed' : 'Review',
          priority: p.progress < 30 ? 'High' : p.progress < 80 ? 'Medium' : 'Low',
          tags: ['Project', `Progress: ${p.progress}%`],
          columnOrder: index,
          originalItem: p
        };
      });
    }
    return [];
  }, [boardSource, tasks, customers, projects, rfqs, drawings, quotations]);

  // Filter Board Items
  const filteredBoardItems = useMemo(() => {
    return rawItems.filter(t => {
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || t.priority?.includes(priorityFilter);
      
      const tDept = (t.originalItem as any)?.department || 'Engineering';
      const matchesDept = deptFilter === 'All' || tDept === deptFilter;

      const query = searchQuery.toLowerCase();
      const matchesSearch = query === '' || 
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.dueDate.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (t.customerName && t.customerName.toLowerCase().includes(query));

      return matchesStatus && matchesPriority && matchesDept && matchesSearch;
    });
  }, [rawItems, statusFilter, priorityFilter, deptFilter, searchQuery]);

  // Dynamic Workload Calculations for status review
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const estimatedHoursSum = tasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
  const actualHoursSum = tasks.reduce((acc, t) => acc + (t.actualHours || 0), 0);
  const completionPercentage = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100) : 0;

  // AI Suggestion Priority logic
  const getSuggestedPriority = (item: BoardCard) => {
    if (item.status === 'Completed') return null;
    const dueTime = new Date(item.dueDate).getTime();
    const todayTime = new Date(todayStr).getTime();
    const isOverdue = dueTime < todayTime;
    const isDueToday = dueTime === todayTime;

    if (isOverdue) return 'Critical';
    if (isDueToday) return 'Today';
    
    // Count active tasks for due date to estimate high workload
    const sameDayActiveCount = rawItems.filter(r => r.dueDate === item.dueDate && r.status !== 'Completed').length;
    if (sameDayActiveCount > 3) return 'High';
    if (dueTime - todayTime < 3 * 24 * 60 * 60 * 1000) return 'High';
    
    return 'Medium';
  };

  // Columns definition based on Group Mode
  const columns = useMemo(() => {
    if (kanbanGroupView === 'status') {
      return [
        { id: 'Pending', title: 'Pending', color: 'bg-slate-400' },
        { id: 'In Progress', title: 'In Progress', color: 'bg-yellow-500' },
        { id: 'Review', title: 'Review / On Hold', color: 'bg-purple-500' },
        { id: 'Completed', title: 'Completed', color: 'bg-emerald-500' }
      ];
    } else {
      return [
        { id: 'Today', title: '⭐ Today', color: 'bg-yellow-600' },
        { id: 'Critical', title: '🔥 Critical', color: 'bg-red-600' },
        { id: 'High', title: '🔴 High', color: 'bg-orange-500' },
        { id: 'Medium', title: '🟡 Medium', color: 'bg-emerald-600' },
        { id: 'Low', title: '🟢 Low', color: 'bg-teal-500' },
        { id: 'Later', title: '⚪ Later', color: 'bg-slate-400' }
      ];
    }
  }, [kanbanGroupView]);

  // Handle Drag Over column boundaries to re-distribute arrays
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) return;
  };

  // Save the dragged property back to the correct DB endpoint instantly
  const updateEntityProperty = async (id: string, groupKey: KanbanGroupView, targetValue: string) => {
    const propertyUpdates: Record<string, any> = {};
    if (groupKey === 'status') {
      // Map simplified UI status back to specific model status if necessary
      if (boardSource === 'customers') {
        propertyUpdates.status = targetValue === 'Completed' ? 'Active' : targetValue === 'Review' ? 'Inactive' : 'Lead';
      } else if (boardSource === 'rfqs') {
        propertyUpdates.status = targetValue === 'Completed' ? 'Approved' : targetValue === 'In Progress' ? 'Quoted' : 'Pending';
      } else if (boardSource === 'quotations') {
        propertyUpdates.status = targetValue === 'Completed' ? 'Accepted' : targetValue === 'In Progress' ? 'Sent' : 'Draft';
      } else if (boardSource === 'drawings') {
        propertyUpdates.status = targetValue === 'Completed' ? 'Released' : targetValue === 'In Progress' ? 'Approved' : 'In Review';
      } else if (boardSource === 'projects') {
        propertyUpdates.status = targetValue === 'Completed' ? 'Completed' : targetValue === 'In Progress' ? 'Active' : 'Planning';
      } else {
        propertyUpdates.status = targetValue;
      }
    } else {
      propertyUpdates.priority = targetValue;
    }

    // Apply REST updates
    let url = `/api/tasks/${id}`;
    if (boardSource === 'customers') url = `/api/customers/${id}`;
    else if (boardSource === 'projects') url = `/api/projects/${id}`;
    else if (boardSource === 'rfqs') url = `/api/engineering/rfqs/${id}`;
    else if (boardSource === 'quotations') url = `/api/engineering/quotations/${id}`;
    else if (boardSource === 'drawings') url = `/api/engineering/drawings/${id}`;

    try {
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyUpdates)
      });
      logSystemActivity('Board Sync', `Instantly synchronized board property [${groupKey}] for "${id}" to "${targetValue}"`);
    } catch (e) {
      console.error("Board sync failed:", e);
    }
  };

  // Drag End handler containing reorder calculation & instant DB synchronization
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Find if over is a column ID itself or a card ID
    let targetColId = '';
    const isColumnOver = columns.some(col => col.id === overId);
    if (isColumnOver) {
      targetColId = overId;
    } else {
      const overCard = filteredBoardItems.find(item => item.id === overId);
      if (overCard) {
        targetColId = kanbanGroupView === 'status' ? overCard.status : overCard.priority;
      }
    }

    if (!targetColId) return;

    // Check if dragged card was part of multi-selected cards
    const dragSet = selectedIds.includes(activeId) ? selectedIds : [activeId];

    // Optimistically update React state immediately for snappy lag-free dragging
    if (boardSource === 'tasks') {
      const updatedTasks = tasks.map(t => {
        if (dragSet.includes(t.id)) {
          const updates: Partial<Task> = {};
          if (kanbanGroupView === 'status') updates.status = targetColId;
          else updates.priority = targetColId;
          return { ...t, ...updates };
        }
        return t;
      });

      // Handle re-ordering index calculations inside column
      const sortedInCol = updatedTasks.filter(t => (kanbanGroupView === 'status' ? t.status === targetColId : t.priority === targetColId));
      sortedInCol.forEach((t, index) => {
        t.columnOrder = index;
      });

      // Instantly save task updates in background
      dragSet.forEach(id => {
        updateEntityProperty(id, kanbanGroupView, targetColId);
      });

      // Trigger standard callback to refresh top parent states
      dragSet.forEach(id => {
        const updates: Partial<Task> = {};
        if (kanbanGroupView === 'status') updates.status = targetColId;
        else updates.priority = targetColId;
        onUpdateTask(id, updates);
      });

      setSelectedIds([]);
    } else {
      // Re-route other entities
      dragSet.forEach(id => {
        updateEntityProperty(id, kanbanGroupView, targetColId);
      });
      setTimeout(() => {
        fetchLocalSources();
      }, 300);
      setSelectedIds([]);
    }
  };

  // Multi-select helpers
  const toggleSelectCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Bulk Apply updates
  const applyBulkUpdate = async (type: 'status' | 'priority', value: string) => {
    if (selectedIds.length === 0) return;
    
    await Promise.all(selectedIds.map(id => updateEntityProperty(id, type, value)));
    logSystemActivity('Bulk Operations', `Batch updated ${selectedIds.length} cards to ${type}: ${value}`);
    setSelectedIds([]);

    if (boardSource === 'tasks') {
      selectedIds.forEach(id => {
        onUpdateTask(id, type === 'status' ? { status: value } : { priority: value });
      });
    } else {
      fetchLocalSources();
    }
  };

  return (
    <div onMouseMove={handleMouseMove} className="space-y-4 relative h-[calc(100vh-140px)] flex flex-col">
      
      {/* Sticky Pomodoro Timer and Idle Warnings Bar */}
      <div className="bg-slate-900 text-slate-100 px-6 py-3 rounded-2xl flex flex-wrap justify-between items-center gap-4 shadow-sm border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-rose-600 rounded-lg animate-pulse">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block font-display">AI LABOR FOCUS ENGINE</span>
            <span className="text-xs font-semibold text-slate-200">
              {pomodoroTask ? `Focusing on: "${tasks.find(t => t.id === pomodoroTask)?.title || 'Selected Task'}"` : 'Independent Work Session'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
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

      {/* Reusable Board Selector & Navigation Toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white border border-slate-200 p-3 rounded-2xl shadow-xs">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'kanban', label: 'Interactive Board', icon: LayoutGrid },
            { id: 'list', label: 'List Queue', icon: ListTodo },
            { id: 'planner', label: 'Smart Planner', icon: Compass },
            { id: 'workload', label: 'Workload Analysis', icon: BarChart2 },
            { id: 'calendar', label: 'Task Calendar', icon: CalendarDays }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id}
                onClick={() => setViewMode(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${viewMode === tab.id ? 'bg-blue-200 text-slate-800 border border-slate-300/50 shadow-xs' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Board Source Switcher (Tasks, CRM, Drawings, etc.) */}
        {viewMode === 'kanban' && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-display">WorkSpace Board:</span>
            <select
              value={boardSource}
              onChange={(e) => {
                setBoardSource(e.target.value as BoardSource);
                setSelectedIds([]);
              }}
              className="text-xs font-bold bg-slate-100 border border-slate-200 focus:outline-none px-3 py-1.5 rounded-xl text-slate-700 cursor-pointer"
            >
              <option value="tasks">📋 Tasks Board</option>
              <option value="customers">👥 CRM Customers</option>
              <option value="rfqs">📄 Inbound RFQs</option>
              <option value="quotations">💰 Quotations</option>
              <option value="drawings">📐 CAD Drawings</option>
              <option value="projects">📁 Active Projects</option>
            </select>
          </div>
        )}

        {/* Global Toolbar and Add task triggers */}
        <div className="flex items-center gap-2">
          {boardSource === 'tasks' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 px-4 py-2 bg-blue-200 hover:bg-blue-300 text-slate-800 rounded-xl transition font-bold text-xs shadow-xs border border-slate-300/40 cursor-pointer"
            >
              <Plus className="h-4 w-4 text-slate-700" />
              Create Task
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions banner if items are selected */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200/50 px-4 py-2.5 rounded-2xl flex flex-wrap justify-between items-center gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-xs font-bold text-slate-800 font-display">
              {selectedIds.length} {boardSource} items selected for Bulk Drag & Action
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {kanbanGroupView === 'status' ? (
              <>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Move to status:</span>
                <div className="flex gap-1.5">
                  {columns.map(col => (
                    <button
                      key={col.id}
                      onClick={() => applyBulkUpdate('status', col.id)}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-[10px]"
                    >
                      {col.title}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Move to priority:</span>
                <div className="flex gap-1.5">
                  {columns.map(col => (
                    <button
                      key={col.id}
                      onClick={() => applyBulkUpdate('priority', col.id)}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-[10px]"
                    >
                      {col.title}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-500 hover:text-slate-800 underline font-bold"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Search Bar & AI Natural Language Assistant Prompts */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search board title, customer metadata, specific tags, or type natural language filters..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 rounded-xl text-xs font-medium text-slate-800"
          />
        </div>

        {/* NLP suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
          <span className="font-bold flex items-center gap-1 mr-1 text-slate-700 font-display">
            <Sparkles className="h-3 w-3 text-emerald-600" /> AI CLASSIFICATION PILOT:
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
              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100/50 rounded-lg border border-slate-200 transition text-[10px] font-semibold text-slate-700 cursor-pointer"
            >
              {preset}
            </button>
          ))}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-rose-600 font-bold ml-2 underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Filter and Board Settings View Switcher */}
      {viewMode === 'kanban' && (
        <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex flex-wrap justify-between items-center gap-4 text-xs">
          
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-display">
              <ListFilter className="h-3 w-3" /> Filters:
            </span>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-600 font-medium focus:ring-1 focus:ring-blue-200"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-600 font-medium focus:ring-1 focus:ring-blue-200"
            >
              <option value="All">All Priorities</option>
              <option value="Today">⭐ Today</option>
              <option value="Critical">🔥 Critical</option>
              <option value="High">🔴 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
              <option value="Later">⚪ Later</option>
            </select>
          </div>

          {/* Group View switch (Status vs Priority Columns) */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-display">Group View Mode:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setKanbanGroupView('status')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition ${kanbanGroupView === 'status' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Status View Columns
              </button>
              <button
                onClick={() => setKanbanGroupView('priority')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition ${kanbanGroupView === 'priority' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Priority View Columns
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Render area */}
      <div className="flex-1 overflow-hidden">
        
        {/* 1. KANBAN INTERACTIVE DRAG AND DROP VIEW */}
        {viewMode === 'kanban' && (
          <DndContext sensors={sensors} onDragStart={(e) => setActiveDragId(e.active.id.toString())} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 h-full overflow-x-auto pb-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(280px, 1fr))` }}>
              {columns.map(col => {
                const columnItems = filteredBoardItems
                  .filter(t => (kanbanGroupView === 'status' ? t.status === col.id : t.priority?.includes(col.id)))
                  .sort((a, b) => a.columnOrder - b.columnOrder);

                const columnItemIds = columnItems.map(item => item.id);

                return (
                  <DroppableColumn key={col.id} id={col.id} title={col.title} count={columnItems.length} color={col.color}>
                    <SortableContext items={columnItemIds} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3 min-h-[400px]">
                        {columnItems.length > 0 ? (
                          columnItems.map(item => (
                            <SortableCard
                              key={item.id}
                              item={item}
                              isSelected={selectedIds.includes(item.id)}
                              onSelect={(e) => toggleSelectCard(item.id, e)}
                              onCardClick={() => setSelectedTaskId(item.id)}
                              geminiEnabled={geminiEnabled}
                              suggestedPriority={getSuggestedPriority(item)}
                              onApplySuggestion={(suggestedPrio) => {
                                if (boardSource === 'tasks') {
                                  onUpdateTask(item.id, { priority: suggestedPrio });
                                  logSystemActivity('AI Assist', `Accepted suggested priority "${suggestedPrio}" for "${item.title}"`);
                                }
                              }}
                              getPriorityColor={getPriorityColor}
                              getStatusColor={getStatusColor}
                            />
                          ))
                        ) : (
                          <div className="text-center py-10 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50">
                            Drop workspace items here
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </DroppableColumn>
                );
              })}
            </div>

            {/* Drag Overlay for seamless and smooth interactive visuals */}
            <DragOverlay dropAnimation={{ duration: 150, easing: 'ease-out' }}>
              {activeDragId ? (
                <div className="bg-white border-2 border-blue-300 shadow-xl p-4 rounded-xl rotate-2 opacity-95 scale-105 pointer-events-none">
                  <div className="flex justify-between items-start gap-1 mb-2">
                    <span className="text-[9px] px-2 py-0.5 rounded-full border bg-blue-100 text-blue-800 font-bold">
                      DRAGGING
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono font-bold">
                      {selectedIds.includes(activeDragId) ? `+${selectedIds.length} Selected` : 'Active'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                    {rawItems.find(t => t.id === activeDragId)?.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    {rawItems.find(t => t.id === activeDragId)?.description}
                  </p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* 2. QUEUE LIST VIEW */}
        {viewMode === 'list' && (
          <div className="bg-white border border-slate-200 rounded-2xl h-full flex flex-col shadow-xs">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Workspace Element Details</th>
                    <th className="p-4">Assigned Pilot</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filteredBoardItems.length > 0 ? (
                    filteredBoardItems.map(item => (
                      <tr 
                        key={item.id}
                        onClick={() => setSelectedTaskId(item.id)}
                        className="hover:bg-slate-50/80 cursor-pointer transition"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{item.title}</span>
                            {item.tags.map((tag, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-mono">#{tag}</span>
                            ))}
                          </div>
                          <p className="text-slate-500 line-clamp-1 max-w-sm mt-0.5">{item.description}</p>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">
                          {item.assignedTo}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-500">{item.dueDate}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">No board items found matching current filters.</td>
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
              <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-1.5 text-blue-200 font-display">
                    <Sparkles className="h-4 w-4 text-emerald-400" /> CO-PILOT PLANNER
                  </h3>
                  <div className="flex bg-slate-950/40 p-0.5 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setPlannerMode('morning')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${plannerMode === 'morning' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                    >
                      Morning Briefing
                    </button>
                    <button
                      onClick={() => setPlannerMode('evening')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${plannerMode === 'evening' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                    >
                      EOD Review
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h2 className="text-lg font-bold tracking-tight">
                    {plannerMode === 'morning' ? '☀️ Build Your Day for Focus' : '🌙 Review Daily Milestone Progress'}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {plannerMode === 'morning' 
                      ? 'AI rearranged today\'s workspace to accommodate tight deadlines, critical meetings, and pending high-value RFQs.' 
                      : 'Excellent! You achieved 80% completion of the targeted workload. Here is tomorrow\'s scheduling roadmap.'
                    }
                  </p>
                </div>

                {/* AI Summary Recommendation Badge */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-emerald-500/20 text-xs text-emerald-100 space-y-1.5">
                  <span className="font-bold flex items-center gap-1 text-[10px] text-emerald-300 uppercase tracking-widest">
                    <Zap className="h-3.5 w-3.5 text-amber-400" /> AI Suggested Focus
                  </span>
                  <p className="leading-relaxed text-slate-300">
                    "Tackle the Titanium Bracket drawing revisions first to clear the engineering blocker, then finalize the Reliance quotation due by 17:00 UTC."
                  </p>
                </div>
              </div>

              {/* Quick AI Recommended Actions list */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-display">AI Tactical Recommendations</h4>
                <div className="space-y-2">
                  {[
                    { title: 'Do First', desc: 'Titanium Bracket Drawing Revisions', cost: '1.5 hrs' },
                    { title: 'Schedule Later', desc: 'CNC Supplier Quote Request', cost: '0.5 hrs' },
                    { title: 'Delegate Option', desc: 'Document CAD standards assembly', cost: '3.0 hrs' }
                  ].map((rec, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
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
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm">
                    {plannerMode === 'morning' ? 'Scheduled Today\'s Active Queue' : 'Historical completed logs & remaining backlog'}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Date: {todayStr}</span>
                </div>

                <div className="space-y-3">
                  {plannerMode === 'morning' ? (
                    tasks.filter(t => t.status !== 'Completed').map(t => {
                      const cust = customers.find(c => c.id === t.customerId);
                      return (
                        <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 hover:border-blue-200/50 rounded-xl flex flex-wrap justify-between items-center gap-3 transition">
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
                              className="px-3 py-1 bg-blue-200 hover:bg-blue-300 text-slate-800 rounded-lg text-[10px] font-bold transition border border-slate-300/40 cursor-pointer"
                            >
                              Start
                            </button>
                            <button
                              onClick={() => triggerAISuggestedEscalation(t)}
                              className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-lg text-[10px] font-bold transition cursor-pointer"
                              title="AI Priority Escalation"
                            >
                              <Flame className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
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
                          <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
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

        {/* 4. AI WORKLOAD & CAPACITY CHART VIEW */}
        {viewMode === 'workload' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto pb-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-display">Operational Capacity</h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-2xl font-bold text-slate-800">{estimatedHoursSum}h</span>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Estimated Load</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-2xl font-bold text-slate-800">{actualHoursSum}h</span>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Actual Spent</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Completion Target</span>
                  <span className="font-bold text-slate-800">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${completionPercentage}%` }}></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-display">Active Staff workload distribution</h3>
              <div className="space-y-3">
                {rawItems.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">{item.title}</span>
                      <span className="text-slate-500 text-[10px] font-mono">{item.assignedTo}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full" style={{ width: `${Math.min(100, (idx + 1) * 20)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. TASK CALENDAR VIEW */}
        {viewMode === 'calendar' && (
          <div className="bg-white border border-slate-200 p-6 rounded-2xl h-full flex flex-col shadow-xs overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-800 mb-4 font-display">WorkSpace Deadlines Calendar</h3>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="p-2 text-center text-xs font-bold text-slate-500 bg-slate-100 rounded-lg">{d}</div>
              ))}
              {Array.from({ length: 35 }).map((_, idx) => {
                const dayNum = (idx % 30) + 1;
                const dateStr = `2026-06-${String(dayNum).padStart(2, '0')}`;
                const matched = rawItems.filter(item => item.dueDate === dateStr);

                return (
                  <div key={idx} className="min-h-[80px] p-2 bg-slate-50/50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">{dayNum}</span>
                    {matched.slice(0, 2).map(item => (
                      <div key={item.id} className="p-1 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-700 truncate">
                        {item.title}
                      </div>
                    ))}
                    {matched.length > 2 && (
                      <span className="text-[8px] text-blue-600 font-bold block">+{matched.length - 2} more</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Task Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-display">
                <Plus className="h-4.5 w-4.5 text-blue-500" /> Create New Task
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Finalize structural CAD templates"
                  className="w-full p-2 border border-slate-200 bg-slate-100 rounded-xl text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Description</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Task instructions..."
                  className="w-full p-2 border border-slate-200 bg-slate-100 rounded-xl text-slate-800 h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className="w-full p-2 border border-slate-200 bg-slate-100 rounded-xl text-slate-800"
                  >
                    <option value="Today">⭐ Today</option>
                    <option value="Critical">🔥 Critical</option>
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                    <option value="Later">⚪ Later</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Status</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="w-full p-2 border border-slate-200 bg-slate-100 rounded-xl text-slate-800"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 bg-slate-100 rounded-xl text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Est Hours</label>
                  <input
                    type="number"
                    value={newEstHours}
                    onChange={e => setNewEstHours(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 bg-slate-100 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Associated Customer</label>
                  <select
                    value={newCustId}
                    onChange={e => setNewCustId(e.target.value)}
                    className="w-full p-2 border border-slate-200 bg-slate-100 rounded-xl text-slate-800"
                  >
                    <option value="">None</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Associated Project</label>
                  <select
                    value={newProjId}
                    onChange={e => setNewProjId(e.target.value)}
                    className="w-full p-2 border border-slate-200 bg-slate-100 rounded-xl text-slate-800"
                  >
                    <option value="">None</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="cad, steel, urgent"
                  className="w-full p-2 border border-slate-200 bg-slate-100 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-200 hover:bg-blue-300 text-slate-800 border border-slate-300/40 rounded-xl font-bold transition"
                >
                  Schedule Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task detail card view modal */}
      {selectedTaskId && boardSource === 'tasks' && activeTask && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${getPriorityColor(activeTask.priority)}`}>
                  {activeTask.priority} Priority
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{activeTask.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedTaskId(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{activeTask.description || 'No description supplied.'}</p>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-400 font-bold text-[10px] uppercase font-display">Timeline Due</p>
                <p className="font-semibold text-slate-700">{activeTask.dueDate}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold text-[10px] uppercase font-display">Associated Customer</p>
                <p className="font-semibold text-slate-700">
                  {customers.find(c => c.id === activeTask.customerId)?.company || 'Unspecified'}
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 uppercase tracking-wide text-[10px] font-display">Operational Checklist</h4>
              <div className="space-y-1.5">
                {activeTask.checklist?.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={item.completed} 
                        onChange={() => toggleCheckitemActiveTask(item.id)}
                        className="rounded cursor-pointer"
                      />
                      <span className={`text-xs ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
                    </div>
                    <button onClick={() => deleteCheckitemActiveTask(item.id)} className="text-rose-500 hover:text-rose-700">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add item..."
                  value={newCheckItem}
                  onChange={e => setNewCheckItem(e.target.value)}
                  className="flex-1 p-1.5 border border-slate-200 bg-slate-100 rounded-lg text-xs"
                />
                <button 
                  onClick={() => addCheckitemToActiveTask(newCheckItem)}
                  className="px-3 bg-blue-200 hover:bg-blue-300 text-slate-800 rounded-lg font-bold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Close button */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  if (confirm("Delete this task permanently?")) {
                    onDeleteTask(activeTask.id);
                    setSelectedTaskId(null);
                  }
                }}
                className="text-rose-600 hover:text-rose-800 font-bold text-xs flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" /> Delete Task
              </button>
              <button
                onClick={() => setSelectedTaskId(null)}
                className="px-4 py-1.5 bg-blue-200 hover:bg-blue-300 text-slate-800 border border-slate-300/40 rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// ---------------- COLUMN COMPONENT FOR DRAG AND DROP ----------------
interface DroppableColumnProps {
  id: string;
  title: string;
  count: number;
  color: string;
  children: React.ReactNode;
  key?: string | number;
}

import { useDroppable } from '@dnd-kit/core';

function DroppableColumn({ id, title, count, color, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl p-4 flex flex-col h-full min-w-[270px] border transition-colors ${isOver ? 'bg-slate-100 border-blue-400/50' : 'bg-slate-50/50 border-slate-200'}`}
    >
      {/* Column Header */}
      <div className="flex justify-between items-center mb-3 shrink-0">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 font-display">
          <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>
          {title}
        </h3>
        <span className="text-[10px] bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
          {count}
        </span>
      </div>

      {/* Scrollable drag target viewport */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {children}
      </div>
    </div>
  );
}

// ---------------- SORTABLE TASK CARD COMPONENT ----------------
interface SortableCardProps {
  item: BoardCard;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onCardClick: () => void;
  geminiEnabled: boolean;
  suggestedPriority: string | null;
  onApplySuggestion: (prio: string) => void;
  getPriorityColor: (prio: string) => string;
  getStatusColor: (status: string) => string;
  key?: string | number;
}

function SortableCard({
  item,
  isSelected,
  onSelect,
  onCardClick,
  geminiEnabled,
  suggestedPriority,
  onApplySuggestion,
  getPriorityColor,
  getStatusColor
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 100 : 'auto'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border ${isSelected ? 'border-blue-400 ring-2 ring-blue-100/40 bg-blue-50/10' : 'border-slate-200 hover:border-slate-300'} cursor-pointer p-4 rounded-xl shadow-xs hover:shadow-sm transition-all duration-150 space-y-3 relative group`}
    >
      <div className="space-y-1.5">
        <div className="flex justify-between items-start gap-1">
          {/* Card selection checkbox for multi-select support */}
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={isSelected}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onSelect(e as any)}
              className="w-3.5 h-3.5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-100 cursor-pointer"
            />
            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getPriorityColor(item.priority)}`}>
              {item.priority || 'Medium'}
            </span>
          </div>

          <span className="text-[9px] text-slate-400 font-mono font-bold shrink-0">
            {item.dueDate}
          </span>
        </div>

        {/* Real drag handles listeners are targeted on the text container to support text selection in other layouts */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <h4 
            onClick={onCardClick}
            className="text-xs font-bold text-slate-800 hover:text-blue-700 transition leading-snug line-clamp-2"
          >
            {item.title}
          </h4>
          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mt-1">
            {item.description}
          </p>
        </div>
      </div>

      {/* Client Context details */}
      {item.customerName && (
        <p className="truncate font-semibold text-[10px] text-slate-600 flex items-center gap-1 pt-1 border-t border-slate-100">
          🏢 {item.customerName}
        </p>
      )}

      {/* AI Suggested Priority Badge */}
      {geminiEnabled && suggestedPriority && item.priority !== suggestedPriority && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onApplySuggestion(suggestedPriority);
          }}
          className="w-full mt-2 flex items-center justify-between px-2 py-1 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 text-[9px] font-bold text-emerald-800 rounded-lg transition"
          title="Click to accept AI priority recommendation"
        >
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-emerald-600 animate-pulse" />
            AI Suggests: {suggestedPriority}
          </span>
          <span className="underline text-[8px] uppercase tracking-wider">Accept</span>
        </button>
      )}

      {/* Footer tags & Assigned Pilot details */}
      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px] text-slate-500">
        <span className="flex items-center gap-1 font-mono font-bold text-slate-500">
          <User className="h-3 w-3 text-slate-400" />
          {item.assignedTo || 'Unassigned'}
        </span>
        
        {item.tags.length > 0 && (
          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-mono text-[9px] truncate max-w-[100px]">
            #{item.tags[0]}
          </span>
        )}
      </div>
    </div>
  );
}
