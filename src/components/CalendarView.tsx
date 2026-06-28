/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, Clock, Plus, Users, ChevronLeft, ChevronRight, Video, 
  MapPin, CheckCircle2, AlertCircle, FileCheck, PhoneCall 
} from 'lucide-react';

interface CalendarViewProps {
  meetings: any[];
  tasks: any[];
  customers: any[];
  onCreateMeeting: (meeting: any) => void;
}

export default function CalendarView({
  meetings, tasks, customers, onCreateMeeting
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date('2026-06-28'));
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newCustId, setNewCustId] = useState('');
  const [newType, setNewType] = useState('Client Briefing');
  const [newTime, setNewTime] = useState('10:00');
  const [newDuration, setNewDuration] = useState(30);

  // Render variables
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Create empty offset days
  const blankDays = Array(firstDayIndex).fill(null);
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onCreateMeeting({
      title: newTitle,
      customerId: newCustId || undefined,
      type: newType,
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-28T${newTime}:00.000Z`, // seed on current date slot
      duration: newDuration
    });

    setNewTitle('');
    setNewCustId('');
    setNewType('Client Briefing');
    setNewTime('10:00');
    setNewDuration(30);
    setShowAddModal(false);
  };

  const getDayEvents = (dayNum: number) => {
    // Only map events on June 28 (which matches our mock system clock date)
    if (dayNum !== 28) return [];
    
    return [
      ...meetings.map(m => ({ ...m, category: 'meeting' })),
      ...tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').map(t => ({ id: t.id, title: `🚨 Deadline: ${t.title}`, category: 'task' }))
    ];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      
      {/* Calendar Grid (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col h-full">
        {/* Navigation header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-50">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <p className="text-[10px] text-gray-400">Timezone: UTC (Active system clock sync)</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition border border-gray-100">
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition border border-gray-100">
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition text-xs font-bold shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Book Slot
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Month grid days */}
        <div className="grid grid-cols-7 gap-1 flex-1 mt-2">
          {blankDays.map((_, i) => (
            <div key={`blank-${i}`} className="bg-gray-50/20 rounded-xl p-1 text-xs"></div>
          ))}

          {calendarDays.map(dayNum => {
            const isToday = dayNum === 28; // System date: June 28
            const events = getDayEvents(dayNum);
            return (
              <div 
                key={dayNum} 
                className={`border border-gray-50 rounded-xl p-2 flex flex-col justify-between text-xs transition min-h-[70px] ${isToday ? 'bg-blue-50/30 border-blue-200' : 'bg-white hover:bg-gray-50/20'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${isToday ? 'bg-blue-600 text-white font-black' : 'text-gray-700'}`}>
                    {dayNum}
                  </span>
                  {events.length > 0 && (
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  )}
                </div>

                {/* Micro events list on June 28 */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[60px] pr-0.5">
                  {events.map((ev, i) => (
                    <div 
                      key={i} 
                      className={`text-[9px] px-1.5 py-0.5 rounded leading-tight font-semibold truncate ${ev.category === 'task' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}
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

      {/* Agenda schedule checklist (4 cols) */}
      <div className="lg:col-span-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col h-full justify-between">
        <div className="space-y-4 flex-1 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Schedule Agenda (June 28)</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Live scheduling timeline and customer deadlines</p>
          </div>

          <div className="space-y-3">
            {meetings.map((meet, idx) => (
              <div key={meet.id || idx} className="border border-gray-50 hover:border-blue-100 transition p-3.5 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-start gap-2">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-bold uppercase text-[9px]">
                    {meet.type}
                  </span>
                  <span className="font-mono text-gray-400 text-[10px]">
                    {new Date(meet.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                  </span>
                </div>
                <h4 className="font-bold text-gray-800 leading-snug">{meet.title}</h4>
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold pt-1 border-t border-gray-50">
                  <span className="flex items-center gap-1">⏱️ {meet.duration} mins</span>
                  {meet.customerId && <span>🏢 Associated Partner</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create slot brief panel */}
        <div className="pt-4 border-t border-gray-50">
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full py-2.5 bg-gray-50 border border-gray-150 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Clock className="h-4 w-4 text-gray-400" />
            Configure Call Slot
          </button>
        </div>
      </div>

      {/* CREATE APPOINTMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Book Briefing Slot</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700 block uppercase">Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CNC Blueprints Review"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block uppercase">Appointment Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="Client Briefing">Client Briefing</option>
                    <option value="CAD Technical Review">CAD Technical Review</option>
                    <option value="RFQ Discussion">RFQ Discussion</option>
                    <option value="Follow-up Call">Follow-up Call</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block uppercase">Client Link</label>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block uppercase">Time Slot</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block uppercase">Duration (mins)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={newDuration}
                    onChange={e => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide shadow-sm"
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
