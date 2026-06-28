/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Mail, Phone, Clock, FileText, Briefcase, Plus, Search, 
  ChevronRight, Calendar, User, Activity, FileCheck, CheckSquare, Sparkles 
} from 'lucide-react';
import { Customer } from '../types';

interface CustomersProps {
  customers: Customer[];
  selectedCustomerId: string | null;
  onSelectCustomer: (id: string) => void;
  onCreateCustomer: (customer: Partial<Customer>) => void;
  onNavigate: (tab: string, param?: any) => void;
}

export default function Customers({
  customers, selectedCustomerId, onSelectCustomer, onCreateCustomer, onNavigate
}: CustomersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  
  // Add Customer form states
  const [newCompany, setNewCompany] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStatus, setNewStatus] = useState<'Active' | 'Lead' | 'Inactive'>('Lead');
  const [newNotes, setNewNotes] = useState('');

  const [activeTab, setActiveTab] = useState<'timeline' | 'projects' | 'tasks' | 'emails' | 'notes'>('timeline');

  // Load customer detailed relations from server
  useEffect(() => {
    if (selectedCustomerId) {
      fetch(`/api/customers/${selectedCustomerId}`)
        .then(res => res.json())
        .then(data => {
          setCustomerDetail(data);
        })
        .catch(err => console.error('Error fetching customer detail:', err));
    } else if (customers.length > 0 && !selectedCustomerId) {
      onSelectCustomer(customers[0].id);
    }
  }, [selectedCustomerId, customers]);

  const filteredCustomers = customers.filter(c => 
    c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newContact.trim()) return;

    onCreateCustomer({
      company: newCompany,
      contactName: newContact,
      email: newEmail,
      phone: newPhone,
      status: newStatus,
      notes: newNotes
    });

    // Reset Form
    setNewCompany('');
    setNewContact('');
    setNewEmail('');
    setNewPhone('');
    setNewStatus('Lead');
    setNewNotes('');
    setShowAddModal(false);
  };

  const getStatusBadgeColor = (status: Customer['status']) => {
    if (status === 'Active') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'Lead') return 'bg-blue-50 text-blue-700 border-blue-100';
    return 'bg-gray-100 text-gray-500 border-gray-200';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm h-[calc(100vh-140px)]">
      
      {/* Customers List Sidebar (4 cols) */}
      <div className="lg:col-span-4 border-r border-gray-50 flex flex-col h-full bg-white">
        {/* Header toolbar */}
        <div className="p-4 border-b border-gray-50 flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl text-sm"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
            title="Create Contact Profile"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Scroll list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(cust => {
              const active = cust.id === selectedCustomerId;
              return (
                <div
                  key={cust.id}
                  onClick={() => onSelectCustomer(cust.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50/40 transition flex items-center justify-between ${active ? 'bg-blue-50/30 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{cust.company}</h4>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{cust.contactName} • {cust.email}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase shrink-0 ${getStatusBadgeColor(cust.status)}`}>
                    {cust.status}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-gray-400 text-xs">No client records found.</div>
          )}
        </div>
      </div>

      {/* Customer Relations Details Pane (8 cols) */}
      <div className="lg:col-span-8 flex flex-col h-full bg-gray-50/10">
        {selectedCustomerId && customerDetail ? (
          <div className="flex-1 overflow-y-auto flex flex-col">
            
            {/* Header Identity Card */}
            <div className="p-6 bg-white border-b border-gray-50 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">{customerDetail.company}</h1>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getStatusBadgeColor(customerDetail.status)}`}>
                      {customerDetail.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Customer ID: {customerDetail.id} • Registered: {new Date(customerDetail.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Contacts info and brief biography */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2 border-t border-gray-50">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{customerDetail.contactName} (Primary)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="truncate">{customerDetail.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{customerDetail.phone}</span>
                </div>
              </div>

              {/* Bio notes */}
              {customerDetail.notes && (
                <div className="p-3.5 bg-gray-50 rounded-xl text-xs text-gray-500 leading-relaxed border border-gray-100">
                  <span className="font-semibold text-gray-700 block mb-0.5">SLA Account Notes:</span>
                  {customerDetail.notes}
                </div>
              )}

              {/* Relation summaries counters */}
              <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="font-bold text-gray-800 text-lg">{customerDetail.projects?.length || 0}</span>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Projects</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="font-bold text-gray-800 text-lg">
                    {customerDetail.tasks?.filter((t: any) => t.status !== 'Completed').length || 0}
                  </span>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Open Tasks</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="font-bold text-gray-800 text-lg">{customerDetail.emails?.length || 0}</span>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Emails</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="font-bold text-gray-800 text-lg">{customerDetail.files?.length || 0}</span>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Vault Files</p>
                </div>
              </div>
            </div>

            {/* Relations Tabs bar */}
            <div className="bg-white border-b border-gray-100 px-6 flex gap-4">
              {[
                { id: 'timeline', label: 'History Timeline' },
                { id: 'emails', label: 'Sync Emails' },
                { id: 'projects', label: 'Projects' },
                { id: 'tasks', label: 'Task List' },
                { id: 'notes', label: 'Notes' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`py-3 text-xs font-bold border-b-2 transition ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content area */}
            <div className="p-6 flex-1">
              
              {/* TIMELINE TAB */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  {customerDetail.timeline && customerDetail.timeline.length > 0 ? (
                    customerDetail.timeline.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-3 text-xs items-start relative">
                        {idx !== customerDetail.timeline.length - 1 && (
                          <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-100"></div>
                        )}
                        <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-[10px] shrink-0 font-bold uppercase">
                          {item.type.substring(0, 1)}
                        </span>
                        <div className="flex-1 bg-white border border-gray-100 p-3.5 rounded-xl space-y-0.5 shadow-xs">
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-bold text-gray-800">{item.title}</span>
                            <span className="text-[9px] text-gray-400 font-mono">
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-500">{item.subtitle}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-400">No timeline entries found.</div>
                  )}
                </div>
              )}

              {/* EMAILS TAB */}
              {activeTab === 'emails' && (
                <div className="space-y-3">
                  {customerDetail.emails && customerDetail.emails.length > 0 ? (
                    customerDetail.emails.map((em: any) => (
                      <div 
                        key={em.id} 
                        onClick={() => onNavigate('email', { emailId: em.id })}
                        className="bg-white border border-gray-100 hover:border-blue-100 cursor-pointer p-4 rounded-xl transition flex justify-between items-start gap-4"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{em.subject}</h4>
                          <p className="text-xs text-gray-400 line-clamp-2">{em.body}</p>
                          <div className="flex gap-2 items-center text-[10px] text-gray-400 pt-1">
                            <span className="px-1.5 py-0.5 border bg-gray-50 rounded font-bold uppercase">{em.category}</span>
                            <span>•</span>
                            <span className="font-mono">{new Date(em.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {em.aiAnalysis && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">
                            <Sparkles className="h-2 w-2" />
                            AI
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-400">No synced emails available.</div>
                  )}
                </div>
              )}

              {/* PROJECTS TAB */}
              {activeTab === 'projects' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customerDetail.projects && customerDetail.projects.length > 0 ? (
                    customerDetail.projects.map((proj: any) => (
                      <div 
                        key={proj.id} 
                        onClick={() => onNavigate('projects', { projectId: proj.id })}
                        className="bg-white border border-gray-100 hover:border-blue-100 cursor-pointer p-4 rounded-xl transition space-y-3 shadow-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                            {proj.code}
                          </span>
                          <h4 className="font-bold text-gray-800 text-xs truncate pt-1">{proj.name}</h4>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                            <span>SLA Delivery Progress</span>
                            <span>{proj.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-50">
                          <span>Status: {proj.status}</span>
                          <span>Budget: ${proj.budget?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-400 col-span-2">No projects associated with this client.</div>
                  )}
                </div>
              )}

              {/* TASKS TAB */}
              {activeTab === 'tasks' && (
                <div className="space-y-3">
                  {customerDetail.tasks && customerDetail.tasks.length > 0 ? (
                    customerDetail.tasks.map((tsk: any) => (
                      <div 
                        key={tsk.id} 
                        onClick={() => onNavigate('tasks')}
                        className="bg-white border border-gray-100 p-3.5 rounded-xl hover:border-blue-100 cursor-pointer transition flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-800 text-xs">{tsk.title}</p>
                          <p className="text-[10px] text-gray-400">Due: {tsk.dueDate} • Assigned: {tsk.assignedTo}</p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${tsk.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                          {tsk.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-400">No active operational tasks pending.</div>
                  )}
                </div>
              )}

              {/* NOTES TAB */}
              {activeTab === 'notes' && (
                <div className="space-y-3">
                  {customerDetail.notes_list && customerDetail.notes_list.length > 0 ? (
                    customerDetail.notes_list.map((note: any) => (
                      <div key={note.id} className="bg-white border border-gray-100 p-4 rounded-xl space-y-1 shadow-xs">
                        <h4 className="font-bold text-gray-800 text-xs">{note.title}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">{note.content}</p>
                        <p className="text-[10px] text-gray-400 font-mono text-right">Modified: {new Date(note.updatedAt).toLocaleDateString()}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-400">No knowledge base notes linked to this account.</div>
                  )}
                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center space-y-2">
            <Users className="h-12 w-12 text-gray-300 stroke-1" />
            <p className="text-sm font-semibold text-gray-500">No Client Selected</p>
            <p className="text-xs max-w-xs text-gray-400">Select a customer profile from the CRM list to view correspondence threads and project vaults.</p>
          </div>
        )}
      </div>

      {/* ADD LEAD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Add Customer Lead</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700 block uppercase">Company / Organization</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Tech Alloys Ltd"
                  value={newCompany}
                  onChange={e => setNewCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 block uppercase">Primary Contact Person</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Jane Cooper"
                  value={newContact}
                  onChange={e => setNewContact(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block uppercase">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block uppercase">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 block uppercase">Lifecycle Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                >
                  <option value="Lead">Lead Profile</option>
                  <option value="Active">Active Account</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 block uppercase">Account Briefing Details</label>
                <textarea
                  rows={3}
                  placeholder="Note business focus and requirements..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide shadow-sm"
              >
                Create Lead Profile
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
