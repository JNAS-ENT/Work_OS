/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Mail, Phone, Clock, FileText, Briefcase, Plus, Search, 
  ChevronRight, Calendar, User, Activity, FileCheck, CheckSquare, Sparkles,
  TrendingUp, ArrowUpRight, ShieldAlert, Heart, Building, Layers, MessageSquare,
  Network, KanbanSquare, Play, RefreshCw, Send, CheckCircle2, ChevronDown, Check, FileCode, DollarSign
} from 'lucide-react';
import { Customer } from '../types';

interface CustomersProps {
  customers: Customer[];
  selectedCustomerId: string | null;
  onSelectCustomer: (id: string) => void;
  onCreateCustomer: (customer: Partial<Customer>) => void;
  onNavigate: (tab: string, param?: any) => void;
}

type MainTab = 'dossier' | 'dashboard' | 'pipeline' | 'relationship' | 'chatSync';

export default function Customers({
  customers, selectedCustomerId, onSelectCustomer, onCreateCustomer, onNavigate
}: CustomersProps) {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('dossier');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Add Customer form states
  const [newCompany, setNewCompany] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStatus, setNewStatus] = useState<'Active' | 'Lead' | 'Inactive'>('Lead');
  const [newNotes, setNewNotes] = useState('');
  const [newIndustry, setNewIndustry] = useState('Aerospace & Precision');
  const [newTimezone, setNewTimezone] = useState('UTC+5:30');

  // Contact Department form state
  const [newContactDept, setNewContactDept] = useState('Purchase');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Active customer Dossier sub-tab selection
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'emails' | 'projects' | 'tasks' | 'notes' | 'contacts'>('timeline');

  // Sales Pipeline Stage filter
  const [pipelineFilter, setPipelineFilter] = useState('All');

  // WhatsApp/Telegram Sync Simulator State
  const [activeChatPlatform, setActiveChatPlatform] = useState<'whatsapp' | 'telegram'>('whatsapp');
  const [chatCommandInput, setChatCommandInput] = useState('today');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'bot', text: string, time: string }[]>([
    { sender: 'bot', text: '🤖 WORK OS Interactive Sync bot initialized. Type or select a command (e.g. today, workload, /tasks) to simulate mobile automation.', time: '02:40' }
  ]);

  const [connections, setConnections] = useState<any[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/integrations/connections')
      .then(res => res.json())
      .then(data => {
        setConnections(data || []);
        setConnectionsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setConnectionsLoading(false);
      });
  }, [activeMainTab]);

  // Load customer detailed relations from server
  useEffect(() => {
    if (selectedCustomerId) {
      setLoading(true);
      fetch(`/api/customers/${selectedCustomerId}`)
        .then(res => res.json())
        .then(data => {
          // Augment with mock data if fields are missing to ensure high-fidelity CRM
          const augmented = {
            industry: 'Aerospace Components',
            gst: '27AAAAA1111A1Z1',
            pan: 'AAAAA1111A',
            website: `www.${data.company?.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            address: 'Industrial Development Zone, Sector 4, Block C, Pune, Maharashtra',
            country: 'India',
            paymentTerms: 'NET 30',
            creditLimit: 500000,
            assignedManager: 'Elena Rostova',
            healthScore: data.status === 'Active' ? 92 : data.status === 'Lead' ? 78 : 34,
            riskScore: data.status === 'Inactive' ? 80 : data.status === 'Lead' ? 25 : 10,
            aiSummary: `Accounts manager: Elena Rostova. Key partner in titanium alloy procurement and precision lathe work. Consistently provides robust detailed STEP and PDF drawing templates for custom brackets.`,
            contacts: [
              { name: data.contactName, designation: 'Procurement Specialist', email: data.email, phone: data.phone, department: 'Purchase', preference: 'Email' },
              { name: 'Dr. Aaron Chen', designation: 'Technical Lead', email: `aaron.chen@${data.company?.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`, phone: '+91 (555) 1010-Chen', department: 'Engineering', preference: 'WhatsApp' },
              { name: 'Siddharth Nair', designation: 'Finance Comptroller', email: `billing@${data.company?.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`, phone: '+91 (555) 2020-Bill', department: 'Finance', preference: 'Email' }
            ],
            pipelineStage: data.status === 'Active' ? 'Production' : data.status === 'Lead' ? 'RFQ' : 'Completed',
            expectedRevenue: data.status === 'Active' ? 120000 : data.status === 'Lead' ? 45000 : 0,
            ...data
          };
          setCustomerDetail(augmented);
        })
        .catch(err => console.error('Error fetching customer detail:', err))
        .finally(() => setLoading(false));
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
      notes: `${newNotes} | Industry: ${newIndustry} | Timezone: ${newTimezone}`
    });

    setNewCompany('');
    setNewContact('');
    setNewEmail('');
    setNewPhone('');
    setNewStatus('Lead');
    setNewNotes('');
    setShowAddModal(false);
  };

  const handleAddCustomContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;

    const addedContact = {
      name: newContactName,
      designation: 'Department Associate',
      email: newContactEmail || 'n/a',
      phone: newContactPhone || 'n/a',
      department: newContactDept,
      preference: 'Email'
    };

    if (customerDetail) {
      const updatedContacts = [...(customerDetail.contacts || []), addedContact];
      setCustomerDetail({
        ...customerDetail,
        contacts: updatedContacts
      });
      
      // Update Notes as secondary persistence mapping
      fetch(`/api/customers/${customerDetail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: `${customerDetail.notes || ''} [Contact Added: ${newContactName} - ${newContactDept}]`
        })
      }).catch(e => console.error(e));
    }

    setNewContactName('');
    setNewContactEmail('');
    setNewContactPhone('');
  };

  // Chat Synchronizer bot triggers
  const executeChatCommand = (cmd: string) => {
    const term = cmd.trim().toLowerCase();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user' as const, text: cmd, time: now };
    
    let botReply = '';
    if (term.includes('today')) {
      botReply = `📅 **WORK OS Today's Task Load Brief:**\n` +
                 `- Total pending scheduled tasks: **4**\n` +
                 `- High priority items: **2**\n` +
                 `🔥 *Recommendation: Finish drawing revisions for Apex Ind immediately.*`;
    } else if (term.includes('workload')) {
      botReply = `📊 **AI Workload metrics for Elena Rostova:**\n` +
                 `- Active estimated workload: **25 hours**\n` +
                 `- Core focus: Mechanical & Drawing approvals\n` +
                 `- Stress score: **42/100** (Normal range)`;
    } else if (term.includes('tasks') || term.includes('pending')) {
      botReply = `📝 **Active Scheduled Deliverables:**\n` +
                 `1. **[High]** CNC Milling titanium sample fabrication (Due: Today)\n` +
                 `2. **[Medium]** Audit Global Aero billing invoice (Due: Tomorrow)\n` +
                 `3. **[Low]** Assemble CAD layout guidelines template.`;
    } else if (term.includes('overdue')) {
      botReply = `🚨 **Overdue Deliverables:**\n` +
                 `- **[RFQ #1024]:** Precision Robotics lab - Titan mounting plate quote conversion (Overdue 2 days).`;
    } else if (term.includes('meeting')) {
      botReply = `📅 **Upcoming Booked Meetings:**\n` +
                 `- **10:00 UTC:** Dr. Aaron Chen - orthographic CAD validation (Precision Robotics)\n` +
                 `- **15:30 UTC:** Siddharth Nair - outstanding payment review (Apex Ind).`;
    } else if (term.includes('invoice') || term.includes('pending payment')) {
      botReply = `💵 **Financial Pipeline Audit:**\n` +
                 `- Outstanding invoices: **$12,500**\n` +
                 `- Suggested Collection: Email Siddharth Nair with auto quotation reminder link.`;
    } else {
      botReply = `🤖 Unknown sync command. Available commands: **today**, **workload**, **tasks**, **overdue**, **meeting**, **invoice**, **summary**.`;
    }

    const botMsg = { sender: 'bot' as const, text: botReply, time: now };
    setChatHistory([...chatHistory, userMsg, botMsg]);
    setChatCommandInput('');
  };

  const getStatusBadgeColor = (status: Customer['status']) => {
    if (status === 'Active') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'Lead') return 'bg-blue-50 text-blue-700 border-blue-100';
    return 'bg-gray-100 text-gray-500 border-gray-200';
  };

  // CRM Analytics stats calculations
  const totalRevenueSum = customers.length * 60000;
  const activeLeadsCount = customers.filter(c => c.status === 'Lead').length;
  const activeClientsCount = customers.filter(c => c.status === 'Active').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm h-[calc(100vh-140px)]">
      
      {/* Sidebar Customer selector (3 cols) */}
      <div className="lg:col-span-3 border-r border-gray-100 flex flex-col h-full bg-white">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between gap-2 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl text-xs"
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

        {/* Global CRM Sub tabs switcher */}
        <div className="p-2 border-b border-gray-50 bg-slate-50/30 grid grid-cols-2 gap-1">
          <button
            onClick={() => setActiveMainTab('dossier')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold text-center transition ${activeMainTab === 'dossier' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Client Dossier
          </button>
          <button
            onClick={() => setActiveMainTab('dashboard')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold text-center transition ${activeMainTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            CRM Analytics
          </button>
          <button
            onClick={() => setActiveMainTab('pipeline')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold text-center transition ${activeMainTab === 'pipeline' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Sales Pipeline
          </button>
          <button
            onClick={() => setActiveMainTab('relationship')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold text-center transition ${activeMainTab === 'relationship' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Relation Web
          </button>
        </div>

        {/* Dynamic customer scroll list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(cust => {
              const active = cust.id === selectedCustomerId;
              return (
                <div
                  key={cust.id}
                  onClick={() => onSelectCustomer(cust.id)}
                  className={`p-3.5 cursor-pointer hover:bg-slate-50/40 transition flex items-center justify-between ${active ? 'bg-blue-50/40 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{cust.company}</h4>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{cust.contactName} • {cust.email}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase shrink-0 ${getStatusBadgeColor(cust.status)}`}>
                    {cust.status}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-gray-400 text-xs">No customer records found.</div>
          )}
        </div>
      </div>

      {/* Main interactive CRM Pane (9 cols) */}
      <div className="lg:col-span-9 flex flex-col h-full bg-slate-50/30">
        
        {/* VIEW 1: ACTIVE CLIENT DOSSIER DETAILS */}
        {activeMainTab === 'dossier' && selectedCustomerId && customerDetail && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            
            {/* Header Identity Card */}
            <div className="p-6 bg-white border-b border-gray-100 space-y-4 shadow-xs">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
                      <Building className="h-5 w-5 text-slate-500" />
                      {customerDetail.company}
                    </h1>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${getStatusBadgeColor(customerDetail.status)}`}>
                      {customerDetail.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    ID: {customerDetail.id} • Industry: <span className="font-semibold text-slate-600">{customerDetail.industry}</span> • Currency: <span className="font-semibold font-mono">INR (₹)</span>
                  </p>
                </div>

                {/* Micro KPI indicators */}
                <div className="flex gap-2">
                  <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100/40 text-center">
                    <span className="text-[9px] text-emerald-600 font-bold block uppercase tracking-wide">Health Score</span>
                    <span className="text-sm font-black text-emerald-700">{customerDetail.healthScore}/100</span>
                  </div>
                  <div className="bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100/40 text-center">
                    <span className="text-[9px] text-rose-600 font-bold block uppercase tracking-wide">Risk Level</span>
                    <span className="text-sm font-black text-rose-700">{customerDetail.riskScore}/100</span>
                  </div>
                </div>
              </div>

              {/* Bio & Automated AI Summary */}
              <div className="p-4 bg-blue-50/20 border border-blue-100/50 rounded-xl space-y-2">
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> AI Account Intel Summary
                </span>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">{customerDetail.aiSummary}</p>
              </div>

              {/* Detailed Business Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-black text-slate-800 text-base">{customerDetail.projects?.length || 0}</span>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Projects Linked</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-black text-slate-800 text-base">
                    {customerDetail.tasks?.filter((t: any) => t.status !== 'Completed').length || 0}
                  </span>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Open Tasks</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-black text-slate-800 text-base">₹{(customerDetail.expectedRevenue || 0).toLocaleString()}</span>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Expected Pipeline</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-black text-slate-800 text-base">{customerDetail.files?.length || 0}</span>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Vault Files</p>
                </div>
              </div>
            </div>

            {/* Relations Tabs bar */}
            <div className="bg-white border-b border-gray-100 px-6 flex gap-4 overflow-x-auto">
              {[
                { id: 'timeline', label: 'Relationship Timeline' },
                { id: 'contacts', label: 'Department Contacts' },
                { id: 'emails', label: 'Synced Mailbox' },
                { id: 'projects', label: 'Linked Projects' },
                { id: 'tasks', label: 'CRM Backlog' },
                { id: 'notes', label: 'Dossier Notes' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveSubTab(t.id as any)}
                  className={`py-3 text-xs font-bold border-b-2 transition shrink-0 ${activeSubTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-800'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content area */}
            <div className="p-6 flex-1">
              
              {/* TIMELINE TAB */}
              {activeSubTab === 'timeline' && (
                <div className="space-y-4">
                  {customerDetail.timeline && customerDetail.timeline.length > 0 ? (
                    customerDetail.timeline.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4 text-xs items-start relative">
                        {idx !== customerDetail.timeline.length - 1 && (
                          <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-slate-100"></div>
                        )}
                        <span className="w-6.5 h-6.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-[10px] shrink-0 font-bold uppercase">
                          {item.type.substring(0, 1)}
                        </span>
                        <div className="flex-1 bg-white border border-slate-100 p-4 rounded-xl space-y-1 shadow-xs">
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-extrabold text-slate-800">{item.title}</span>
                            <span className="text-[9px] text-slate-400 font-mono font-bold">
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-500 font-medium">{item.subtitle}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-400">No timeline events captured yet.</div>
                  )}
                </div>
              )}

              {/* DEPARTMENT CONTACTS TAB */}
              {activeSubTab === 'contacts' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerDetail.contacts?.map((contact: any, i: number) => (
                      <div key={i} className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs space-y-2 text-xs relative">
                        <span className="absolute right-3 top-3 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-md text-[9px] font-bold uppercase">
                          {contact.department}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm">{contact.name}</h4>
                          <p className="text-slate-400 font-semibold">{contact.designation}</p>
                        </div>
                        <div className="space-y-1 pt-1 text-slate-600">
                          <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> {contact.email}</p>
                          <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> {contact.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add contact to department form */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Register Contact Department Link</h4>
                    <form onSubmit={handleAddCustomContact} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Dept Sector</label>
                        <select
                          value={newContactDept}
                          onChange={e => setNewContactDept(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg"
                        >
                          {['Engineering', 'Purchase', 'Finance', 'Sales', 'Accounts', 'Production', 'Quality', 'Management', 'Store'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Full Name</label>
                        <input
                          type="text"
                          required
                          value={newContactName}
                          onChange={e => setNewContactName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Email</label>
                        <input
                          type="email"
                          value={newContactEmail}
                          onChange={e => setNewContactEmail(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg"
                        />
                      </div>

                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Phone No.</label>
                          <input
                            type="text"
                            value={newContactPhone}
                            onChange={e => setNewContactPhone(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition"
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* SYNC EMAILS TAB */}
              {activeSubTab === 'emails' && (
                <div className="space-y-3">
                  {customerDetail.emails && customerDetail.emails.length > 0 ? (
                    customerDetail.emails.map((em: any) => (
                      <div 
                        key={em.id} 
                        onClick={() => onNavigate('email', { emailId: em.id })}
                        className="bg-white border border-gray-100 hover:border-blue-100 cursor-pointer p-4 rounded-xl transition flex justify-between items-start gap-4 shadow-xs"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{em.subject}</h4>
                          <p className="text-xs text-gray-500 line-clamp-2">{em.body}</p>
                          <div className="flex gap-2 items-center text-[10px] text-gray-400 pt-1">
                            <span className="px-1.5 py-0.5 border bg-gray-50 rounded font-bold uppercase">{em.category}</span>
                            <span>•</span>
                            <span className="font-mono">{new Date(em.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {em.aiAnalysis && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0 border border-blue-100/50">
                            <Sparkles className="h-2.5 w-2.5" />
                            AI INGRESS
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-400">No synced email history found.</div>
                  )}
                </div>
              )}

              {/* PROJECTS TAB */}
              {activeSubTab === 'projects' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customerDetail.projects && customerDetail.projects.length > 0 ? (
                    customerDetail.projects.map((proj: any) => (
                      <div 
                        key={proj.id} 
                        onClick={() => onNavigate('projects', { projectId: proj.id })}
                        className="bg-white border border-slate-100 hover:border-blue-100 cursor-pointer p-4 rounded-xl transition space-y-3 shadow-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded font-bold font-mono uppercase">{proj.code}</span>
                          <h4 className="font-extrabold text-slate-800 text-sm pt-1">{proj.name}</h4>
                          <p className="text-xs text-slate-400 line-clamp-2">{proj.description}</p>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-slate-600 text-[10px]">
                            <span>Task Progress</span>
                            <span>{proj.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-400 col-span-2">No active projects linked.</div>
                  )}
                </div>
              )}

              {/* TASKS TAB */}
              {activeSubTab === 'tasks' && (
                <div className="space-y-3 text-xs">
                  {customerDetail.tasks && customerDetail.tasks.length > 0 ? (
                    customerDetail.tasks.map((task: any) => (
                      <div 
                        key={task.id} 
                        onClick={() => onNavigate('tasks')}
                        className="bg-white border border-slate-100 p-4 rounded-xl flex justify-between items-center hover:border-blue-100 cursor-pointer transition shadow-xs"
                      >
                        <div className="space-y-0.5">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase ${task.priority === 'High' ? 'text-red-700 bg-red-50 border-red-100' : 'text-slate-500 bg-slate-50 border-slate-100'}`}>
                            {task.priority}
                          </span>
                          <p className="font-bold text-slate-800 pt-0.5">{task.title}</p>
                          <p className="text-slate-400 text-[10px]">Due Date Target: {task.dueDate}</p>
                        </div>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600">{task.status}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-400">No active operational tasks scheduled.</div>
                  )}
                </div>
              )}

              {/* DOSSIER NOTES TAB */}
              {activeSubTab === 'notes' && (
                <div className="space-y-4 text-xs">
                  {customerDetail.notes ? (
                    <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-3">
                      <h4 className="font-bold text-slate-800">SLA & Procurement Guidelines</h4>
                      <p className="text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">{customerDetail.notes}</p>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400">No custom notes saved for this client.</div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* VIEW 2: GLOBAL CRM ANALYTICS DASHBOARD */}
        {activeMainTab === 'dashboard' && (
          <div className="p-6 overflow-y-auto h-full space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight">CRM Intelligence & Pipeline Analytics</h1>
                <p className="text-xs text-slate-400">Holistic operations health, client growth, and revenue statistics.</p>
              </div>
              <button 
                onClick={() => setActiveMainTab('chatSync')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                <MessageSquare className="h-4 w-4" /> Whatsapp/Telegram Sync
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Aggregated Revenue</span>
                <span className="text-2xl font-black text-slate-800">₹{totalRevenueSum.toLocaleString()}</span>
                <p className="text-[10px] text-emerald-600 font-bold">↑ 14% vs last quarter</p>
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Active Clients</span>
                <span className="text-2xl font-black text-slate-800">{activeClientsCount}</span>
                <p className="text-[10px] text-slate-500 font-bold">Stable retention rate</p>
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Active Leads Pipeline</span>
                <span className="text-2xl font-black text-slate-800">{activeLeadsCount}</span>
                <p className="text-[10px] text-blue-600 font-bold">3 awaiting Quotation convert</p>
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Avg Health Score</span>
                <span className="text-2xl font-black text-slate-800">82%</span>
                <p className="text-[10px] text-emerald-600 font-bold">Optimal communication SLAs</p>
              </div>
            </div>

            {/* List of High-Value Risk / VIP clients */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Customer Triage / Health Board</h3>
              
              <div className="space-y-3 text-xs">
                {customers.map((c, i) => {
                  const health = c.status === 'Active' ? 92 : c.status === 'Lead' ? 74 : 35;
                  const isRisk = health < 40;

                  return (
                    <div key={c.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center gap-4 hover:border-blue-100 transition">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-800 block">{c.company}</span>
                        <p className="text-slate-400 text-[10px]">{c.contactName} • {c.email}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Client Health</span>
                          <span className={`font-black ${isRisk ? 'text-red-600' : 'text-emerald-600'}`}>{health}%</span>
                        </div>
                        {isRisk ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-bold rounded-lg animate-pulse uppercase">At Risk</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold rounded-lg uppercase">VIP Partner</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SALES PIPELINE KANBAN BOARD */}
        {activeMainTab === 'pipeline' && (
          <div className="p-6 overflow-y-auto h-full space-y-6">
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Active Sales Pipeline Kanban</h1>
              <p className="text-xs text-slate-400">Track and progress opportunities from initial ingress to payment release.</p>
            </div>

            {/* Stages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
              {[
                { stage: 'Lead', bg: 'bg-slate-50', border: 'border-slate-100', color: 'bg-slate-400' },
                { stage: 'RFQ', bg: 'bg-blue-50/20', border: 'border-blue-100/30', color: 'bg-blue-500' },
                { stage: 'Quotation', bg: 'bg-purple-50/20', border: 'border-purple-100/30', color: 'bg-purple-500' },
                { stage: 'Production', bg: 'bg-emerald-50/20', border: 'border-emerald-100/30', color: 'bg-emerald-500' }
              ].map(col => {
                const stageCustomers = customers.filter(c => {
                  const s = c.status === 'Active' ? 'Production' : c.status === 'Lead' ? 'RFQ' : 'Lead';
                  return s === col.stage;
                });

                return (
                  <div key={col.stage} className={`${col.bg} border ${col.border} rounded-2xl p-4 flex flex-col min-h-[300px]`}>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.color}`}></span>
                      {col.stage} ({stageCustomers.length})
                    </h3>

                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {stageCustomers.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => {
                            onSelectCustomer(c.id);
                            setActiveMainTab('dossier');
                          }}
                          className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs hover:border-blue-200 transition cursor-pointer space-y-2"
                        >
                          <h4 className="font-extrabold text-slate-800 text-xs">{c.company}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{c.contactName}</p>
                          <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-50">
                            <span className="font-bold text-slate-600">Expected Val:</span>
                            <span className="font-bold text-blue-600">₹{(c.status === 'Active' ? 120000 : 45000).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 4: INTERACTIVE RELATIONSHIP MAP */}
        {activeMainTab === 'relationship' && (
          <div className="p-6 h-full flex flex-col space-y-4">
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Interactive Entity Relationship Web</h1>
              <p className="text-xs text-slate-400">Visual mapping of connected company departments, contacts, emails, and active project nodes.</p>
            </div>

            {/* SVG Relationship Graph */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex items-center justify-center p-4">
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Connecting Lines */}
                <line x1="50%" y1="50%" x2="20%" y2="25%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="50%" y1="50%" x2="80%" y2="25%" stroke="#3b82f6" strokeWidth="2" />
                <line x1="50%" y1="50%" x2="20%" y2="75%" stroke="#8b5cf6" strokeWidth="2" />
                <line x1="50%" y1="50%" x2="80%" y2="75%" stroke="#10b981" strokeWidth="2" />
              </svg>

              {/* Node Elements */}
              {customerDetail ? (
                <div className="relative w-full h-full flex items-center justify-center text-xs text-white">
                  {/* Central Node */}
                  <div className="absolute z-10 w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 flex flex-col items-center justify-center p-3 text-center shadow-lg border-4 border-slate-950">
                    <span className="font-black text-[10px] uppercase block">Selected Co.</span>
                    <span className="font-bold leading-tight truncate w-full">{customerDetail.company}</span>
                  </div>

                  {/* Node 1: Purchase Dept */}
                  <div className="absolute top-10 left-10 w-24 h-24 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-2 text-center">
                    <Users className="h-4 w-4 text-blue-400 mb-1" />
                    <span className="font-bold text-[9px] block">Purchase Sector</span>
                    <span className="text-[10px] text-slate-400 truncate w-full">{customerDetail.contactName}</span>
                  </div>

                  {/* Node 2: Engineering Dept */}
                  <div className="absolute top-10 right-10 w-24 h-24 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-2 text-center">
                    <Network className="h-4 w-4 text-indigo-400 mb-1" />
                    <span className="font-bold text-[9px] block">Engineering Sector</span>
                    <span className="text-[10px] text-slate-400">Dr. Aaron Chen</span>
                  </div>

                  {/* Node 3: Linked Project */}
                  <div className="absolute bottom-10 left-10 w-24 h-24 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-2 text-center">
                    <Layers className="h-4 w-4 text-purple-400 mb-1" />
                    <span className="font-bold text-[9px] block">Active Project</span>
                    <span className="text-[10px] text-slate-400 truncate w-full">{customerDetail.projects?.[0]?.name || 'N/a'}</span>
                  </div>

                  {/* Node 4: Finance Department */}
                  <div className="absolute bottom-10 right-10 w-24 h-24 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-2 text-center">
                    <Users className="h-4 w-4 text-emerald-400 mb-1" />
                    <span className="font-bold text-[9px] block">Finance Sector</span>
                    <span className="text-[10px] text-slate-400">Siddharth Nair</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-xs font-semibold">Select a customer profile to render relationship graph.</div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 5: WHATSAPP / TELEGRAM CHAT SIMULATOR */}
        {activeMainTab === 'chatSync' && (
          <div className="p-6 h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Active WhatsApp & Telegram Sync Simulator</h1>
                <p className="text-xs text-slate-400 font-medium">Test automatic Work OS command pipelines and notifications.</p>
              </div>

              {/* Platform Switcher */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setActiveChatPlatform('whatsapp')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeChatPlatform === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}
                >
                  WhatsApp Bot
                </button>
                <button
                  onClick={() => setActiveChatPlatform('telegram')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeChatPlatform === 'telegram' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
                >
                  Telegram Bot
                </button>
              </div>
            </div>

            {/* Chat viewport box */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col overflow-hidden max-h-[400px]">
              
              {!connections.some(c => c.providerId === activeChatPlatform && c.status === 'Connected') ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    activeChatPlatform === 'whatsapp' 
                      ? 'bg-emerald-950/30 border-emerald-900 text-emerald-500' 
                      : 'bg-blue-950/30 border-blue-900 text-blue-500'
                  }`}>
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <h3 className="text-xs font-bold text-slate-200">
                      {activeChatPlatform === 'whatsapp' ? 'WhatsApp Business is not connected.' : 'No Telegram Bot configured.'}
                    </h3>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      {activeChatPlatform === 'whatsapp' 
                        ? 'Connect your WhatsApp Business account via Settings to start orchestrating real-time customer workflows and briefings.'
                        : 'Configure your Telegram Bot token via Settings to start dispatching notifications and managing pipeline triggers.'
                      }
                    </p>
                  </div>
                  <button 
                    onClick={() => onNavigate('settings')}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold text-white transition cursor-pointer ${
                      activeChatPlatform === 'whatsapp' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {activeChatPlatform === 'whatsapp' ? 'Connect WhatsApp' : 'Connect Telegram'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Messages log */}
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
                    {chatHistory.map((chat, idx) => {
                      const isBot = chat.sender === 'bot';
                      return (
                        <div key={idx} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                          <div className={`p-3.5 rounded-2xl max-w-[80%] text-xs font-medium leading-relaxed whitespace-pre-wrap ${isBot ? 'bg-slate-900 text-slate-100 border border-slate-800' : 'bg-blue-600 text-white'}`}>
                            {chat.text}
                          </div>
                          <span className="text-[9px] text-slate-500 font-bold mt-1 font-mono">{chat.time}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bot Commands Presets bar */}
                  <div className="pt-3 border-t border-slate-900 flex flex-wrap gap-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">Quick Command:</span>
                    {[
                      activeChatPlatform === 'whatsapp' ? 'today' : '/today',
                      activeChatPlatform === 'whatsapp' ? 'workload' : '/workload',
                      activeChatPlatform === 'whatsapp' ? 'tasks' : '/tasks',
                      activeChatPlatform === 'whatsapp' ? 'overdue' : '/overdue',
                      activeChatPlatform === 'whatsapp' ? 'meeting' : '/meetings',
                      'invoice'
                    ].map((cmd, i) => (
                      <button
                        key={i}
                        onClick={() => executeChatCommand(cmd)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg border border-slate-800 text-[10px] font-bold transition cursor-pointer"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>

                  {/* Input field */}
                  <div className="pt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder={activeChatPlatform === 'whatsapp' ? "Type command (e.g. workload)..." : "Type command (e.g. /tasks)..."}
                      value={chatCommandInput}
                      onChange={e => setChatCommandInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 px-4 py-2 rounded-xl text-xs text-white"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          executeChatCommand(chatCommandInput);
                        }
                      }}
                    />
                    <button
                      onClick={() => executeChatCommand(chatCommandInput)}
                      className={`p-2 rounded-xl text-white ${activeChatPlatform === 'whatsapp' ? 'bg-emerald-600' : 'bg-blue-600'}`}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        )}

      </div>

      {/* CREATE CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Add Customer / Lead Dossier</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase tracking-wide block">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Reliance Precision Tech"
                  value={newCompany}
                  onChange={e => setNewCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Industry Sector</label>
                  <select
                    value={newIndustry}
                    onChange={e => setNewIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="Aerospace & Precision">Aerospace & Precision</option>
                    <option value="Automotive & R&D">Automotive & R&D</option>
                    <option value="Power Grid Utilities">Power Grid Utilities</option>
                    <option value="Heavy Machinery">Heavy Machinery</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Timezone</label>
                  <input
                    type="text"
                    value={newTimezone}
                    onChange={e => setNewTimezone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase tracking-wide block">Primary Contact Person</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Siddharth Nair"
                  value={newContact}
                  onChange={e => setNewContact(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase tracking-wide block">CRM Lead Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-bold text-slate-700"
                >
                  <option value="Lead">Lead Profile</option>
                  <option value="Active">Active SLA Partner</option>
                  <option value="Inactive">Inactive Account</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase tracking-wide block">Procurement Notes / Guidelines</label>
                <textarea
                  rows={3}
                  placeholder="Insert critical account specs, shipping targets, credit notes..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide shadow-sm transition"
              >
                Register Customer Dossier
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
