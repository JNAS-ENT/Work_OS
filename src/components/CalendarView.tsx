import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Plus, Users, ChevronLeft, ChevronRight, Video, 
  MapPin, CheckCircle2, AlertCircle, FileCheck, PhoneCall, Sparkles, 
  Bot, RefreshCw, FileText, Check, Trash2, HelpCircle, AlertTriangle, Send
} from 'lucide-react';
import { Meeting, Task, Customer, Project } from '../types';

interface CalendarViewProps {
  meetings: Meeting[];
  tasks: Task[];
  customers: Customer[];
  projects?: Project[];
  onCreateMeeting?: (meeting: any) => void;
}

export default function CalendarView({
  meetings: initialMeetings, 
  tasks: initialTasks, 
  customers, 
  projects: initialProjects,
  onCreateMeeting
}: CalendarViewProps) {
  // Calendar Navigation
  const [currentDate, setCurrentDate] = useState(new Date('2026-06-28'));
  const [selectedDay, setSelectedDay] = useState<number>(28); // System mock date: June 28
  
  // Data states (full-stack synchronization)
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects, setProjects] = useState<Project[]>(initialProjects || []);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Syncing states
  const [syncing, setSyncing] = useState(false);
  
  // Book modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCustId, setNewCustId] = useState('');
  const [newProjId, setNewProjId] = useState('');
  const [newType, setNewType] = useState<'Call' | 'Review' | 'FollowUp' | 'Meeting'>('Meeting');
  const [newTime, setNewTime] = useState('14:00');
  const [newDuration, setNewDuration] = useState(45);
  const [newDesc, setNewDesc] = useState('');
  const [newAttendees, setNewAttendees] = useState('');
  const [clashWarning, setClashWarning] = useState<string | null>(null);

  // AI Smart Scheduler states
  const [showAiScheduler, setShowAiScheduler] = useState(false);
  const [aiSchedDate, setAiSchedDate] = useState('2026-06-28');
  const [aiSchedDuration, setAiSchedDuration] = useState(30);
  const [aiSchedType, setAiSchedType] = useState('Review');
  const [aiSchedDesc, setAiSchedDesc] = useState('');
  const [aiSchedRecommendations, setAiSchedRecommendations] = useState<{ time: string; reason: string }[]>([]);
  const [aiSchedLoading, setAiSchedLoading] = useState(false);

  // AI Meeting Minutes & Tasks states
  const [notesText, setNotesText] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [extractingTasks, setExtractingTasks] = useState(false);
  const [recentlyExtractedTasks, setRecentlyExtractedTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchMeetings();
    fetchProjects();
  }, []);

  useEffect(() => {
    // Keep internal meeting list synced when props change
    if (initialMeetings) {
      setMeetings(initialMeetings);
    }
  }, [initialMeetings]);

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
        if (data.length > 0 && !selectedMeetingId) {
          setSelectedMeetingId(data[0].id);
          setNotesText(data[0].notes || '');
        }
      }
    } catch (err) {
      console.error('Error loading meetings:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  // ----------------------------------------------------
  // CALENDAR NAVIGATION & CALCULATIONS
  // ----------------------------------------------------
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const blankDays = Array(firstDayIndex).fill(null);
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // ----------------------------------------------------
  // TWO-WAY SYNC
  // ----------------------------------------------------
  const handleSyncGoogleCalendar = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/meetings/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google' })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Google Calendar synchronization complete!\nSynced: ${data.syncedCount} slots.`);
        fetchMeetings();
      }
    } catch (err) {
      console.error('Calendar sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  // ----------------------------------------------------
  // BOOKING & EDITING SLOTS
  // ----------------------------------------------------
  const handleScheduleMeeting = async (e?: React.FormEvent, customTime?: string) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) return;

    const bookingTime = customTime || newTime;
    const dateFormatted = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}T${bookingTime}:00.000Z`;

    const payload = {
      title: newTitle.trim(),
      description: newDesc.trim(),
      date: dateFormatted,
      duration: Number(newDuration),
      customerId: newCustId || undefined,
      projectId: newProjId || undefined,
      type: newType,
      attendees: newAttendees.split(',').map(email => email.trim()).filter(Boolean),
      notes: newDesc.trim(),
      calendarId: 'local'
    };

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        if (data.clashWith) {
          alert(`⚠️ Conflict Detected: This slot overlaps with "${data.clashWith.title}". System notification has been logged.`);
        }
        
        // Reset form
        setNewTitle('');
        setNewDesc('');
        setNewCustId('');
        setNewProjId('');
        setNewAttendees('');
        setShowAddModal(false);
        setClashWarning(null);
        
        // Trigger parent callback if present
        if (onCreateMeeting) {
          onCreateMeeting(data.meeting);
        }
        
        fetchMeetings();
        setSelectedMeetingId(data.meeting.id);
        setNotesText(data.meeting.notes || '');
      }
    } catch (err) {
      console.error('Error scheduling meeting:', err);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    const confirmed = window.confirm('Are you sure you want to cancel this scheduled meeting?');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/meetings/${meetingId}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedMeetingId === meetingId) {
          setSelectedMeetingId(null);
        }
        fetchMeetings();
      }
    } catch (err) {
      console.error('Error cancelling meeting:', err);
    }
  };

  const handleUpdateNotes = async () => {
    if (!selectedMeetingId) return;
    try {
      await fetch(`/api/meetings/${selectedMeetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesText })
      });
      fetchMeetings();
      alert('Meeting notes successfully saved.');
    } catch (err) {
      console.error('Error updating notes:', err);
    }
  };

  // ----------------------------------------------------
  // AI SCHEDULER & CONFLICT RESOLUTION
  // ----------------------------------------------------
  const handleFindOptimalSlot = async () => {
    setAiSchedLoading(true);
    try {
      const res = await fetch('/api/meetings/schedule-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredDate: aiSchedDate,
          duration: aiSchedDuration,
          type: aiSchedType,
          description: aiSchedDesc
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSchedRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error('AI Scheduling failed:', err);
    } finally {
      setAiSchedLoading(false);
    }
  };

  const handleBookAiRecommendedSlot = (time: string) => {
    // Pre-fill form and submit
    setNewTitle(`AI Recommended: ${aiSchedType} (${aiSchedDesc || 'Sync'})`);
    setNewDuration(aiSchedDuration);
    setNewType(aiSchedType as any);
    setNewDesc(aiSchedDesc);
    setNewTime(time);
    
    // Parse target day
    const day = Number(aiSchedDate.split('-')[2]);
    setSelectedDay(day);

    setTimeout(() => {
      // Trigger schedule save
      setShowAddModal(true);
    }, 100);
  };

  // ----------------------------------------------------
  // AI MINUTES & ACTION ITEMS TO WORKFLOW TASKS
  // ----------------------------------------------------
  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);

  const handleGenerateAiMinutes = async () => {
    if (!selectedMeeting) return;
    setSummarizing(true);
    try {
      const res = await fetch(`/api/meetings/${selectedMeeting.id}/generate-summary`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        fetchMeetings();
        // Update local transcript notes with the generated summary
        setNotesText(data.aiMinutes);
      }
    } catch (err) {
      console.error('Error compiling AI minutes:', err);
    } finally {
      setSummarizing(false);
    }
  };

  const handleExtractActionItems = async () => {
    if (!selectedMeeting) return;
    setExtractingTasks(true);
    setRecentlyExtractedTasks([]);
    try {
      const res = await fetch(`/api/meetings/${selectedMeeting.id}/extract-action-items`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setRecentlyExtractedTasks(data.createdTasks || []);
        fetchMeetings();
        alert(`Successfully extracted and automated ${data.createdTasks?.length || 0} tasks! Pushed to task database.`);
      } else {
        alert(data.error || 'Failed to extract tasks.');
      }
    } catch (err) {
      console.error('Error extracting action items:', err);
    } finally {
      setExtractingTasks(false);
    }
  };

  // Check for clashes across all scheduled meetings
  const hasClashes = () => {
    for (let i = 0; i < meetings.length; i++) {
      for (let j = i + 1; j < meetings.length; j++) {
        const m1 = meetings[i];
        const m2 = meetings[j];
        if (m1.status !== 'Scheduled' || m2.status !== 'Scheduled') continue;
        
        const m1Start = new Date(m1.date).getTime();
        const m1End = m1Start + (m1.duration * 60 * 1000);
        const m2Start = new Date(m2.date).getTime();
        const m2End = m2Start + (m2.duration * 60 * 1000);

        if (m1Start < m2End && m1End > m2Start) {
          return true; // Overlap found!
        }
      }
    }
    return false;
  };

  // Get events on selected calendar day
  const getDayEvents = (dayNum: number) => {
    const formattedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    
    const dayMeetings = meetings.filter(m => m.date.startsWith(formattedDateStr));
    const dayTasks = tasks.filter(t => t.dueDate === formattedDateStr && t.priority === 'High' && t.status !== 'Completed');

    return [
      ...dayMeetings.map(m => ({ ...m, category: 'meeting' as const })),
      ...dayTasks.map(t => ({ id: t.id, title: `🚨 Deadline: ${t.title}`, category: 'task' as const }))
    ];
  };

  const selectedDayEvents = getDayEvents(selectedDay);
  const activeDayMeetings = selectedDayEvents.filter(e => e.category === 'meeting');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      
      {/* LEFT PANEL: INTERACTIVE GRID CALENDAR (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col h-full overflow-hidden">
        
        {/* Header navigation & Sync */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-50 gap-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-blue-600" />
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <p className="text-[10px] text-gray-400 font-medium">Timezone: Coordinated Universal Time (UTC)</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition border border-gray-150">
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition border border-gray-150">
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
            
            <button
              onClick={handleSyncGoogleCalendar}
              disabled={syncing}
              className="px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-xl transition text-[11px] font-bold flex items-center gap-1.5"
            >
              {syncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Sync Google Calendar
            </button>

            <button
              onClick={() => setShowAiScheduler(!showAiScheduler)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Slot Finder
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition text-[11px] font-bold flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Book Slot
            </button>
          </div>
        </div>

        {/* Clash warning banner */}
        {hasClashes() && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-xs font-bold leading-normal">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Calendar Conflict Detected: Overlapping meeting intervals exist on the schedule. Reorganize slots.</span>
          </div>
        )}

        {/* AI SMART SCHEDULER SECTION (EXPANDABLE PANEL) */}
        {showAiScheduler && (
          <div className="mt-3 p-4 bg-blue-50/25 border border-blue-100 rounded-2xl space-y-3 relative">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                Gemini AI Smart Scheduling Assistant
              </h4>
              <button onClick={() => setShowAiScheduler(false)} className="text-[10px] text-gray-400 hover:text-gray-600">Close</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-blue-700 uppercase">Target Date</label>
                <input 
                  type="date" 
                  value={aiSchedDate} 
                  onChange={e => setAiSchedDate(e.target.value)}
                  className="w-full px-2.5 py-1 border border-blue-200 bg-white rounded-lg text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-blue-700 uppercase">Duration (mins)</label>
                <input 
                  type="number" 
                  value={aiSchedDuration} 
                  onChange={e => setAiSchedDuration(Number(e.target.value))}
                  className="w-full px-2.5 py-1 border border-blue-200 bg-white rounded-lg text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-blue-700 uppercase">Meeting Type</label>
                <select 
                  value={aiSchedType} 
                  onChange={e => setAiSchedType(e.target.value)}
                  className="w-full px-2.5 py-1 border border-blue-200 bg-white rounded-lg text-xs"
                >
                  <option value="Review">Review</option>
                  <option value="Call">Call</option>
                  <option value="Meeting">Meeting</option>
                  <option value="FollowUp">Follow-up</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-blue-700 uppercase">Context / Goal</label>
                <input 
                  type="text" 
                  placeholder="e.g. Discuss drawings v2"
                  value={aiSchedDesc} 
                  onChange={e => setAiSchedDesc(e.target.value)}
                  className="w-full px-2.5 py-1 border border-blue-200 bg-white rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleFindOptimalSlot}
                disabled={aiSchedLoading}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                {aiSchedLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
                Find Optimal Clashing-Free Slots
              </button>
            </div>

            {aiSchedRecommendations.length > 0 && (
              <div className="space-y-1.5 border-t border-blue-100 pt-3">
                <span className="text-[10px] font-bold text-blue-800 uppercase block">Recommended Clashing-Free Slots</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {aiSchedRecommendations.map((rec, idx) => (
                    <div key={idx} className="p-2.5 bg-white border border-blue-100 rounded-xl space-y-1.5 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-blue-700 font-mono">⏱️ {rec.time} UTC</span>
                          <span className="text-[9px] font-bold text-emerald-600 px-1.5 bg-emerald-50 rounded-full">Optimal</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-normal mt-1">{rec.reason}</p>
                      </div>
                      <button
                        onClick={() => handleBookAiRecommendedSlot(rec.time)}
                        className="w-full py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-bold transition"
                      >
                        Book This Slot
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Days of Week header */}
        <div className="grid grid-cols-7 gap-1 text-center py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mt-2 shrink-0">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Calendar Days viewport */}
        <div className="grid grid-cols-7 gap-1 flex-1 mt-2 overflow-y-auto">
          {blankDays.map((_, i) => (
            <div key={`blank-${i}`} className="bg-gray-50/20 rounded-xl p-1"></div>
          ))}

          {calendarDays.map(dayNum => {
            const isTarget = dayNum === selectedDay;
            const isToday = dayNum === 28; // Standard UTC mock system clock date
            const events = getDayEvents(dayNum);
            
            return (
              <div 
                key={dayNum} 
                onClick={() => setSelectedDay(dayNum)}
                className={`border rounded-xl p-1.5 flex flex-col justify-between text-xs cursor-pointer transition min-h-[75px] ${isTarget ? 'border-blue-500 bg-blue-50/25 ring-1 ring-blue-500' : 'border-gray-100 hover:bg-gray-50/40 bg-white'} ${isToday && !isTarget ? 'bg-indigo-50/30' : ''}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'} ${isTarget && !isToday ? 'bg-gray-100 text-gray-900' : ''}`}>
                    {dayNum}
                  </span>
                  {events.length > 0 && (
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"></span>
                  )}
                </div>

                <div className="flex-1 space-y-1 overflow-y-auto max-h-[50px] pr-0.5">
                  {events.map((ev: any, i) => (
                    <div 
                      key={i} 
                      className={`text-[8px] px-1.5 py-0.5 rounded leading-tight font-bold truncate ${ev.category === 'task' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL: SELECTED DAY AGENDA, DISCUSSIONS & AI WRITER (4 cols) */}
      <div className="lg:col-span-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col h-full overflow-hidden">
        
        {/* Toggle tabs */}
        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          
          <div className="shrink-0">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Timeline Agenda (June {selectedDay})</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Live scheduling meetings and task sync</p>
          </div>

          {/* List of active day meetings */}
          <div className="space-y-2.5 overflow-y-auto max-h-[160px] shrink-0 pr-1">
            {activeDayMeetings.length > 0 ? (
              activeDayMeetings.map((meet: any) => {
                const isSelected = meet.id === selectedMeetingId;
                const startTime = new Date(meet.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                return (
                  <div 
                    key={meet.id} 
                    onClick={() => { setSelectedMeetingId(meet.id); setNotesText(meet.notes || ''); }}
                    className={`cursor-pointer border transition p-3 rounded-xl space-y-1.5 text-xs ${isSelected ? 'border-blue-500 bg-blue-50/10' : 'border-gray-150 hover:border-blue-100 bg-white'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-bold uppercase text-[8px]">
                        {meet.type}
                      </span>
                      <span className="font-mono text-gray-400 text-[10px] font-bold">{startTime} UTC</span>
                    </div>
                    <h4 className="font-bold text-gray-800 truncate leading-snug">{meet.title}</h4>
                    <div className="flex justify-between text-[9px] text-gray-400 font-bold border-t border-gray-50 pt-1 mt-1">
                      <span>⏱️ {meet.duration} mins</span>
                      <span className="flex items-center gap-1">
                        {meet.calendarId === 'google' ? '🟢 Google synced' : '🔵 Local'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-6 text-gray-400 text-[11px] italic border border-dashed border-gray-100 rounded-xl">
                No meetings scheduled on this date.
              </p>
            )}
          </div>

          {/* Selected meeting AI Notes & Automated Task Generator */}
          {selectedMeeting ? (
            <div className="flex-1 flex flex-col border-t border-gray-100 pt-3 overflow-hidden">
              <div className="flex justify-between items-center shrink-0 mb-2">
                <span className="text-[10px] text-indigo-600 font-bold uppercase block flex items-center gap-1">
                  <Bot className="h-3.5 w-3.5 text-indigo-500" />
                  Meeting Discussion Intelligence
                </span>
                <button
                  onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                  title="Cancel Meeting"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Editable Transcription Notes / AI Minutes Panel */}
              <div className="flex-1 flex flex-col overflow-hidden space-y-2">
                <textarea
                  value={notesText}
                  onChange={e => setNotesText(e.target.value)}
                  placeholder="Record discussions, notes, or raw meeting transcriptions here..."
                  className="flex-1 w-full p-2.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl text-xs font-medium resize-none bg-gray-50/50 leading-relaxed overflow-y-auto"
                />

                <div className="grid grid-cols-2 gap-2 shrink-0">
                  <button
                    onClick={handleUpdateNotes}
                    className="py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] font-bold rounded-lg transition"
                  >
                    Save Notes
                  </button>

                  <button
                    onClick={handleGenerateAiMinutes}
                    disabled={summarizing}
                    className="py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {summarizing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Compile AI Minutes
                  </button>
                </div>

                {/* Extract action items trigger */}
                <button
                  onClick={handleExtractActionItems}
                  disabled={extractingTasks}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold transition shrink-0 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {extractingTasks ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileCheck className="h-3.5 w-3.5" />}
                  Extract Action Items & Create Tasks
                </button>

                {/* Recently extracted tasks visual confirmation */}
                {recentlyExtractedTasks.length > 0 && (
                  <div className="p-2 bg-emerald-50 border border-emerald-150 rounded-xl space-y-1 mt-2 shrink-0 max-h-[80px] overflow-y-auto">
                    <span className="text-[9px] font-bold text-emerald-800 uppercase block">Automated Work OS Tasks Created:</span>
                    {recentlyExtractedTasks.map(t => (
                      <div key={t.id} className="text-[9px] text-emerald-600 flex items-center gap-1 font-semibold">
                        <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                        <span className="truncate">{t.title} (Assigned: {t.assignedTo})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 border-t border-gray-100 pt-6 flex flex-col items-center justify-center text-center text-gray-400 space-y-1.5 p-4">
              <HelpCircle className="h-8 w-8 text-gray-200 stroke-1" />
              <p className="font-semibold text-gray-500 text-[11px]">No Meeting Selected</p>
              <p className="text-[10px] text-gray-400 max-w-[200px]">Select any scheduled agenda slot to run AI summaries or automate your project task dispatching.</p>
            </div>
          )}

        </div>
      </div>

      {/* CREATE APPOINTMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-gray-900 border border-gray-100">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Clock className="h-4.5 w-4.5 text-blue-600" />
                Book Work OS Briefing Slot
              </h3>
              <button 
                onClick={() => { setShowAddModal(false); setClashWarning(null); }}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={e => handleScheduleMeeting(e)} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block uppercase text-[10px]">Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CNC Housing Tolerance Review"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block uppercase text-[10px]">Appointment Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Call">Phone Call</option>
                    <option value="Review">CAD Review</option>
                    <option value="FollowUp">Follow-up Call</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block uppercase text-[10px]">Client Link</label>
                  <select
                    value={newCustId}
                    onChange={e => setNewCustId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="">None (Internal)</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block uppercase text-[10px]">Time Slot</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block uppercase text-[10px]">Duration (mins)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={newDuration}
                    onChange={e => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block uppercase text-[10px]">Participants (Comma-separated Emails)</label>
                <input
                  type="text"
                  placeholder="e.g. pm@apex.com, eng@workos.com"
                  value={newAttendees}
                  onChange={e => setNewAttendees(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block uppercase text-[10px]">Description / Meeting Agenda</label>
                <textarea
                  rows={2}
                  placeholder="Record briefing specifications or agenda outline..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide transition shadow-sm"
              >
                Schedule Meeting Slot
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
