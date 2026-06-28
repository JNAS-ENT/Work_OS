/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, ShieldCheck, RefreshCw, Send, Play, Square,
  AlertTriangle, CheckSquare, Settings, Bell, FileText, CheckCircle2,
  Clock, Plus, Trash2, ArrowRight, Phone, Volume2, Download, Check
} from 'lucide-react';
import { Email, Task, Project, Customer, Rfq, Drawing, Quotation, Invoice, PurchaseOrder } from '../types';

interface WhatsappCenterProps {
  emails: Email[];
  tasks: Task[];
  projects: Project[];
  customers: Customer[];
  rfqs: Rfq[];
  drawings: Drawing[];
  quotations: Quotation[];
  invoices: Invoice[];
  pos: PurchaseOrder[];
  onNavigate: (tab: string, param?: any) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export default function WhatsappCenter({
  emails, tasks, projects, customers, rfqs, drawings, quotations, invoices, pos, onNavigate
}: WhatsappCenterProps) {
  // Connections
  const [accounts, setAccounts] = useState([
    { id: 'wa-1', name: 'Work OS Sales Desk', number: '+1 (555) 934-2920', status: 'Connected', health: 'Excellent', lastSync: '1 min ago' },
    { id: 'wa-2', name: 'Factory Dispatch Core', number: '+1 (555) 231-5089', status: 'Connected', health: 'Optimal', lastSync: '5 mins ago' },
    { id: 'wa-3', name: 'Admin Personal Bridge', number: '+1 (555) 441-0012', status: 'Disconnected', health: 'None', lastSync: 'Never' }
  ]);

  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [pairingStep, setPairingStep] = useState<number>(0); // 0: off, 1: QR code loading, 2: scan animation
  const [activeTab, setActiveTab] = useState<'summaries' | 'chat' | 'alerts' | 'rules' | 'reports'>('summaries');

  // Stats calculation from live data
  const urgentEmails = emails.filter(e => !e.deleted && !e.archived && e.priority === 'High');
  const overdueTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled' && t.dueDate < new Date().toISOString().split('T')[0]);
  const activeRfqs = rfqs.filter(r => r.status === 'Pending');
  const totalOutstandingCount = urgentEmails.length + overdueTasks.length + activeRfqs.length;

  // Summaries
  const [summaryMode, setSummaryMode] = useState<'morning' | 'evening'>('morning');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { id: 'm-1', sender: 'ai', text: "👋 Hello! I am your Work OS WhatsApp AI Dispatcher. Send me queries like 'summary', 'urgent tasks', 'any pending RFQs', or 'financial report' to get instant business triage briefings.", time: '09:00 AM' }
  ]);

  // Rules state
  const [rules, setRules] = useState([
    { id: 'r-1', trigger: 'Customer Complaint Received', condition: 'Sentiment is Negative', action: 'Send SMS Alert to Operations Core', active: true },
    { id: 'r-2', trigger: 'Incoming RFQ', condition: 'Estimated Value > $50,000', action: 'Ping Executive Group on WhatsApp with Draft Quote', active: true },
    { id: 'r-3', trigger: 'SLA Breach Approaching', condition: 'Task Due in < 4 Hours', action: 'Trigger Red Alert WhatsApp Ping to Assignee', active: false },
    { id: 'r-4', trigger: 'Drawing Released', condition: 'CAD Review Approved', action: 'Auto-dispatch Client Notification with CAD PDF Download', active: true }
  ]);

  const [newRuleTrigger, setNewRuleTrigger] = useState('Incoming RFQ');
  const [newRuleCondition, setNewRuleCondition] = useState('Estimated Value > $10,000');
  const [newRuleAction, setNewRuleAction] = useState('Send SMS Alert');

  // Active Alert Feed (Simulated logs of matches)
  const [whatsappAlerts, setWhatsappAlerts] = useState([
    { id: 'a-1', time: '10 mins ago', type: 'Negative Sentiment', desc: 'Complaint from James (Apex Engineering): CAD offset discrepancies', actionTaken: 'Dispatched to Manager Core', status: 'Sent' },
    { id: 'a-2', time: '1 hour ago', type: 'Urgent RFQ', desc: 'Turbine Bracket Batch C ($82,000) from Apex Engineering', actionTaken: 'Quotation drafted, notify CEO', status: 'Sent' },
    { id: 'a-3', time: '3 hours ago', type: 'Drawing Released', desc: 'Bracket-V2-Mount CAD drawing approved by inspector', actionTaken: 'Drawing dispatched to client desk', status: 'Sent' }
  ]);

  // Report State
  const [selectedReport, setSelectedReport] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [sentReport, setSentReport] = useState(false);

  // Auto scroll chat
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  // Handle generating summary on state change
  useEffect(() => {
    generateOperationalSummary();
  }, [summaryMode, emails, tasks, rfqs]);

  // Generate real dynamic summary text based on active data
  const generateOperationalSummary = () => {
    setSummaryLoading(true);
    setTimeout(() => {
      if (summaryMode === 'morning') {
        const primaryFocus = activeRfqs.length > 0 
          ? `Your absolute primary objective today is processing the **${activeRfqs[0].title}** Commercial RFQ, estimated at **$${activeRfqs[0].estimatedValue.toLocaleString()}**.` 
          : "Your primary objective is clearing outstanding SLA deliverables.";

        const text = `🌅 **WORK OS MORNING OPERATIONS SUMMARY**
Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
System Mailbox Health: **Excellent** (Synced across Yahoo & Corporate Gmail)

📊 **Core Pipeline Health Matrices:**
• **Inbox Action Items:** **${emails.filter(e => e.unread).length}** unread customer emails.
• **High-Risk/Urgent Threads:** **${urgentEmails.length}** client threads flagged with critical priority.
• **Overdue Milestones:** **${overdueTasks.length}** outstanding tasks breaching target committed SLA dates.
• **Commercial RFQs Pending:** **${activeRfqs.length}** pending technical RFQs to quote.
• **Production Pipeline:** **${pos.filter(p => p.status === 'In Production').length}** active production purchase orders.

🎯 **AI Strategic Recommendations:**
1. ${primaryFocus}
2. Please reply to the complaint from **James** regarding the **CAD drawing offset tolerance mismatch** to avoid escalation.
3. Review and sign off on **${drawings.filter(d => d.status === 'In Review').length}** CAD drawings awaiting quality assurance approval.

Have an efficient operations day!`;
        setSummaryText(text);
      } else {
        const text = `🌃 **WORK OS EVENING PERFORMANCE SUMMARY**
System Status: **Stable** | All pipelines fully synchronized

📈 **Daily Accomplishments:**
• Completed **${tasks.filter(t => t.status === 'Completed').length}** operational task milestones.
• Approved and released **${drawings.filter(d => d.status === 'Approved').length}** engineering CAD models.
• Generated and sent **${quotations.filter(q => q.status === 'Sent').length}** customer quotes.

📅 **Tomorrow's Ingress Brief (Scheduled):**
• **${tasks.filter(t => t.status !== 'Completed' && t.dueDate === new Date(Date.now() + 86400000).toISOString().split('T')[0]).length}** core deliverables due tomorrow.
• **3** synchronized customer follow-up meetings scheduled on the calendar.

💡 **AI Evening Retrospective:**
The factory floor production of Titanium mounts is running optimal. Make sure to dispatch the Bracket-Batch-C quotation draft early tomorrow morning to lock in the material price index.`;
        setSummaryText(text);
      }
      setSummaryLoading(false);
    }, 450);
  };

  // Chat Trigger Queries
  const handleSendChat = (textToSend?: string) => {
    const rawText = textToSend || chatInput;
    if (!rawText.trim()) return;

    const userMsg: ChatMessage = {
      id: `m-u-${Date.now()}`,
      sender: 'user',
      text: rawText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setIsTyping(true);

    // AI Simulated Reply
    setTimeout(() => {
      let responseText = "I received your request! Let me fetch that information from the Work OS central database.";
      const lower = rawText.toLowerCase();

      if (lower.includes('summary') || lower.includes('morning') || lower.includes('brief')) {
        responseText = `🌅 *Here is your Morning Operational Briefing:*
• **Pending Emails**: ${emails.filter(e => e.unread).length} requiring action.
• **Overdue Tasks**: ${overdueTasks.length} past SLA due dates.
• **Critical Risks**: ${urgentEmails.length} threads marked high risk.
• **Open RFQs**: ${activeRfqs.length} awaiting quotes.
*AI Priority Tip:* Process the Apex Engineering Quote immediately to prevent scheduling delays.`;
      } else if (lower.includes('task') || lower.includes('pending') || lower.includes('overdue')) {
        if (overdueTasks.length > 0) {
          responseText = `⚠️ *You have ${overdueTasks.length} Overdue SLA Deliverables:*
${overdueTasks.slice(0, 3).map((t, i) => `${i + 1}. **${t.title}** (Commit: ${t.dueDate})`).join('\n')}
Please update statuses to prevent customer dissatisfaction alerts.`;
        } else {
          responseText = "✅ All tasks are currently on schedule! No overdue tasks or SLA violations detected.";
        }
      } else if (lower.includes('rfq') || lower.includes('quote') || lower.includes('commercial')) {
        if (activeRfqs.length > 0) {
          responseText = `💼 *Active Commercial RFQs needing quotations:*
${activeRfqs.map((r, i) => `• **${r.title}** (Target: $${r.estimatedValue.toLocaleString()} | Due: ${r.targetDeliveryDate})`).join('\n')}`;
        } else {
          responseText = "No active pending RFQs detected. Great job!";
        }
      } else if (lower.includes('financial') || lower.includes('invoice') || lower.includes('report')) {
        const totalDraft = invoices.filter(i => i.status === 'Draft').reduce((acc, curr) => acc + curr.amount, 0);
        const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
        const totalOverdue = invoices.filter(i => i.status === 'Overdue').reduce((acc, curr) => acc + curr.amount, 0);
        responseText = `📊 *Work OS Financial Ledger Briefing:*
• **Total Paid Invoices**: $${totalPaid.toLocaleString()}
• **Draft / Pending Dispatch**: $${totalDraft.toLocaleString()}
• **Overdue SLA Invoices**: $${totalOverdue.toLocaleString()} 🚨
*Action Required:* Follow up on the outstanding invoice for Apex Engineering immediately.`;
      } else if (lower.includes('hello') || lower.includes('hi')) {
        responseText = "Hello! I am connected to your Work OS operations center. Ask me for summaries, pending commercial RFQs, overdue tasks, or system logs.";
      }

      const aiMsg: ChatMessage = {
        id: `m-ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 700);
  };

  // QR Code / Pairing simulator
  const triggerPairingFlow = (id: string) => {
    setConnectingId(id);
    setPairingStep(1);
    setTimeout(() => {
      setPairingStep(2);
      setTimeout(() => {
        setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, status: 'Connected', health: 'Optimal', lastSync: 'Just now' } : acc));
        setPairingStep(0);
        setConnectingId(null);
        // Alert notification
        setWhatsappAlerts(prev => [
          { id: `a-${Date.now()}`, time: 'Just now', type: 'System Bridge', desc: `Successfully connected WhatsApp bridge number: +1 (555) 441-0012`, actionTaken: 'Authorized and synchronized keys', status: 'Sent' },
          ...prev
        ]);
      }, 4000);
    }, 1500);
  };

  const disconnectAccount = (id: string) => {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, status: 'Disconnected', health: 'None', lastSync: 'Never' } : acc));
  };

  // Custom rules builder
  const handleAddRule = () => {
    const newRule = {
      id: `r-${Date.now()}`,
      trigger: newRuleTrigger,
      condition: newRuleCondition,
      action: newRuleAction,
      active: true
    };
    setRules(prev => [...prev, newRule]);
    // Alert log
    setWhatsappAlerts(prev => [
      { id: `a-${Date.now()}`, time: 'Just now', type: 'Automation Modified', desc: `New WhatsApp routing rule created: "${newRuleTrigger}"`, actionTaken: 'Registered to events listener', status: 'Active' },
      ...prev
    ]);
  };

  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const toggleRuleActive = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  // Speech/Voice Notes synthesis simulator with Equalizer
  const toggleAudioSpeech = () => {
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      setIsPlayingAudio(true);
      // Clean md format from summary text for cleaner synthesis
      const cleanText = summaryText.replace(/[\*\#\`\•]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        setIsPlayingAudio(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };

      utterance.onerror = () => {
        setIsPlayingAudio(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };

      window.speechSynthesis.speak(utterance);
      // Start equalizer animation
      drawEqualizer();
    }
  };

  // Equalizer visualizer code
  const drawEqualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 160;
    canvas.height = 36;

    const barCount = 18;
    const barWidth = 6;
    const gap = 3;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < barCount; i++) {
        // Generate values simulating dynamic sound wave amplitude
        const randomFactor = Math.sin(Date.now() * 0.005 + i * 0.2) * 0.5 + 0.5;
        const amplitude = Math.random() * 0.3 + 0.7;
        const height = randomFactor * amplitude * canvas.height;
        
        ctx.fillStyle = '#2563eb'; // blue-600 color
        ctx.fillRect(i * (barWidth + gap), canvas.height - height, barWidth, height);
      }
      if (isPlayingAudio) {
        animationRef.current = requestAnimationFrame(render);
      }
    };

    render();
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Dispatch reports via WhatsApp simulation
  const handleDispatchReport = () => {
    setSentReport(true);
    setTimeout(() => {
      setSentReport(false);
      setWhatsappAlerts(prev => [
        { id: `a-${Date.now()}`, time: 'Just now', type: 'Report Dispatched', desc: `Sent Work OS ${selectedReport.toUpperCase()} report PDF & HTML payload to target contacts.`, actionTaken: 'Delivered to WhatsApp group', status: 'Sent' },
        ...prev
      ]);
    }, 2000);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] overflow-y-auto pr-1">
      
      {/* Top Header Panel */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            <MessageSquare className="h-3 w-3" />
            WhatsApp AI Integration Ready
          </div>
          <h2 className="text-xl font-bold text-slate-800">WhatsApp Business AI Operations Center</h2>
          <p className="text-xs text-slate-400">Dispatch morning briefings, automate negative sentiment triggers, and query metrics instantly via SMS/WhatsApp</p>
        </div>

        <div className="flex gap-2">
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            WhatsApp Server: Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Channel Bridges (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Linked accounts & configuration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Operational Bridges</h3>
            <p className="text-xs text-slate-400">Configure phone numbers, system-authorized tokens, and device status</p>
            
            <div className="space-y-3">
              {accounts.map(acc => {
                const isConnected = acc.status === 'Connected';
                return (
                  <div key={acc.id} className="p-4 border border-slate-100 rounded-xl space-y-2 hover:border-blue-100 transition">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">{acc.name}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {acc.number}
                        </p>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 font-bold uppercase tracking-wide rounded-full ${isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                        {acc.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-50">
                      <div className="flex gap-2 text-slate-400">
                        <span>Sync: <strong className="text-slate-600">{acc.lastSync}</strong></span>
                        <span>Health: <strong className={isConnected ? 'text-emerald-600' : 'text-slate-400'}>{acc.health}</strong></span>
                      </div>
                      
                      {isConnected ? (
                        <button 
                          onClick={() => disconnectAccount(acc.id)}
                          className="text-[9px] font-bold text-rose-600 hover:text-rose-700 hover:underline"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button 
                          onClick={() => triggerPairingFlow(acc.id)}
                          className="text-[9px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Link Device
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simulated Pairing Screen UI */}
            {pairingStep > 0 && (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-3 animate-fade-in">
                <p className="text-xs font-bold text-slate-700">Link WhatsApp Account Bridge</p>
                
                {pairingStep === 1 && (
                  <div className="space-y-2 py-2">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-[10px] text-slate-400">Generating secure connection keys...</p>
                  </div>
                )}

                {pairingStep === 2 && (
                  <div className="space-y-3">
                    <div className="w-32 h-32 bg-white border border-slate-200 p-2 mx-auto relative overflow-hidden rounded-lg">
                      {/* Grid scanning visual */}
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent animate-pulse h-1 border-b-2 border-blue-500"></div>
                      <div className="grid grid-cols-5 gap-1.5 opacity-80 h-full w-full">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div key={i} className={`rounded-xs ${i % 3 === 0 || i % 4 === 1 ? 'bg-slate-800' : 'bg-transparent'}`}></div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-600">Scan QR Code with WhatsApp app</p>
                      <p className="text-[9px] text-slate-400">Settings &gt; Linked Devices &gt; Link Device</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions and Shortcuts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Quick Testing Bench</h3>
            <p className="text-xs text-slate-400">Dispatch simulated alerts to verify routing parameters are functioning correctly</p>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                onClick={() => setWhatsappAlerts(prev => [
                  { id: `a-${Date.now()}`, time: 'Just now', type: 'Negative Sentiment', desc: 'Alert: Customer James filed warning regarding sheet metal spec mismatch', actionTaken: 'Slack/WhatsApp broadcasted to Quality Team', status: 'Delivered' },
                  ...prev
                ])}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-center border border-rose-100 font-bold transition cursor-pointer"
              >
                Simulate Negative Alert
              </button>
              <button 
                onClick={() => setWhatsappAlerts(prev => [
                  { id: `a-${Date.now()}`, time: 'Just now', type: 'Urgent RFQ', desc: 'Alert: James sent a turbine drawing mount bracket batch F ($120,000)', actionTaken: 'CEO notified, quote pipeline initiated', status: 'Delivered' },
                  ...prev
                ])}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-center border border-emerald-100 font-bold transition cursor-pointer"
              >
                Simulate RFQ Alert
              </button>
            </div>
          </div>

        </div>

        {/* Right column: Tabbed Interactive Panes (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Navigation Tab Bar */}
          <div className="flex border-b border-slate-200 bg-white p-2 rounded-2xl border">
            {[
              { id: 'summaries', label: 'AI Summaries', icon: FileText },
              { id: 'chat', label: 'AI Chat Simulator', icon: MessageSquare },
              { id: 'alerts', label: 'Real-time Alerts Feed', icon: Bell },
              { id: 'rules', label: 'Custom Automation Rules', icon: Settings },
              { id: 'reports', label: 'Operations Reports', icon: CheckSquare }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl text-xs font-bold transition ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: AI Summaries */}
          {activeTab === 'summaries' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Dynamic AI Briefings</h3>
                  <p className="text-xs text-slate-400">Operations-wide summary parsed directly from active mail pipelines, RFQs, and SLA trackers</p>
                </div>

                {/* Morning/Evening Toggle */}
                <div className="flex border border-slate-200 p-1 rounded-xl shrink-0">
                  <button 
                    onClick={() => setSummaryMode('morning')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${summaryMode === 'morning' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Morning 🌅
                  </button>
                  <button 
                    onClick={() => setSummaryMode('evening')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${summaryMode === 'evening' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Evening 🌃
                  </button>
                </div>
              </div>

              {/* Summary Text Canvas */}
              <div className="relative">
                {summaryLoading ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-400">Loading metrics & compiling AI brief...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <pre className="text-xs text-slate-700 bg-slate-50/50 p-5 rounded-2xl border border-slate-200 overflow-x-auto whitespace-pre-wrap font-sans leading-relaxed">
                      {summaryText}
                    </pre>

                    {/* Speech/Voice notes player simulator */}
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-blue-50/40 p-4 border border-blue-100 rounded-2xl gap-3">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={toggleAudioSpeech}
                          className="w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
                        >
                          {isPlayingAudio ? <Square className="h-4.5 w-4.5 fill-current" /> : <Play className="h-4.5 w-4.5 fill-current ml-0.5" />}
                        </button>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Listen to AI Operations Summary</p>
                          <p className="text-[10px] text-slate-400">Generates text-to-speech audio with dynamic visual synthesizer</p>
                        </div>
                      </div>

                      {/* Canvas equalizer */}
                      <div className="flex items-center gap-2">
                        <canvas ref={canvasRef} className="w-40 h-9 rounded bg-slate-100 border border-slate-200/50"></canvas>
                        {isPlayingAudio && <Volume2 className="h-4 w-4 text-blue-600 animate-pulse" />}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AI Chat Simulator */}
          {activeTab === 'chat' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-[500px] animate-fade-in shadow-xs">
              
              {/* Chat Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold">Work OS AI Mobile Bridge</h3>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Direct dispatch pipeline active
                    </p>
                  </div>
                </div>

                <div className="text-[10px] bg-white/10 px-2.5 py-1 rounded font-bold uppercase tracking-wider font-mono">
                  WhatsApp Sandbox
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
                {chatHistory.map(msg => {
                  const isAi = msg.sender === 'ai';
                  return (
                    <div 
                      key={msg.id}
                      className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-xs md:max-w-md p-3.5 rounded-2xl text-xs space-y-1 shadow-2xs leading-relaxed whitespace-pre-wrap ${isAi ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100' : 'bg-emerald-600 text-white rounded-tr-none'}`}>
                        <p>{msg.text}</p>
                        <p className={`text-[9px] text-right ${isAi ? 'text-slate-400' : 'text-emerald-100'}`}>{msg.time}</p>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-slate-500 px-4 py-2.5 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions shortcuts */}
              <div className="p-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
                {[
                  'Morning summary',
                  'Urgent tasks list',
                  'Any pending RFQs?',
                  'Financial report'
                ].map(sug => (
                  <button 
                    key={sug}
                    onClick={() => handleSendChat(sug)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 shrink-0 cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ask Work OS dispatcher (e.g. 'summary' or 'pending')..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <button 
                  onClick={() => handleSendChat()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: Real-time Alerts Feed */}
          {activeTab === 'alerts' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Operational Dispatch Feed</h3>
                <p className="text-xs text-slate-400">Live history of matched automation logs pushing immediately to linked mobile terminals</p>
              </div>

              <div className="divide-y divide-slate-100">
                {whatsappAlerts.map(alert => {
                  let badge = "bg-slate-50 text-slate-600 border-slate-200";
                  if (alert.type === 'Negative Sentiment') badge = "bg-rose-50 text-rose-700 border-rose-100";
                  if (alert.type === 'Urgent RFQ') badge = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  if (alert.type === 'Drawing Released') badge = "bg-purple-50 text-purple-700 border-purple-100";

                  return (
                    <div key={alert.id} className="py-4 flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 border rounded ${badge}`}>
                            {alert.type}
                          </span>
                          <span className="text-[10px] text-slate-400">{alert.time}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">{alert.desc}</p>
                        <p className="text-[11px] text-slate-500"><strong>Action Registered:</strong> {alert.actionTaken}</p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <span className="text-[10px] px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-md font-bold flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          {alert.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: Custom Automation Rules */}
          {activeTab === 'rules' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-slate-800">WhatsApp Alert Rules Builder</h3>
                <p className="text-xs text-slate-400">Configure visual conditions to trigger real-time push events to WhatsApp/SMS targets</p>
              </div>

              {/* Rules List */}
              <div className="space-y-3">
                {rules.map(rule => (
                  <div key={rule.id} className="p-4 border border-slate-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{rule.trigger}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                          {rule.condition}
                        </span>
                      </div>
                      <p className="text-slate-500">Action: <strong className="text-blue-600">{rule.action}</strong></p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.active}
                          onChange={() => toggleRuleActive(rule.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        {rule.active ? 'Active' : 'Muted'}
                      </label>
                      <button 
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rule Creator */}
              <div className="p-5 bg-slate-50/50 border border-slate-200 rounded-2xl space-y-4">
                <p className="text-xs font-bold text-slate-800">Add New WhatsApp Automation Rule</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Trigger Event</label>
                    <select 
                      value={newRuleTrigger}
                      onChange={e => setNewRuleTrigger(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-hidden"
                    >
                      <option value="Customer Complaint Received">Customer Complaint Received</option>
                      <option value="Incoming RFQ">Incoming RFQ</option>
                      <option value="SLA Breach Approaching">SLA Breach Approaching</option>
                      <option value="Drawing Released">Drawing Released</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Condition Match</label>
                    <input 
                      type="text"
                      value={newRuleCondition}
                      onChange={e => setNewRuleCondition(e.target.value)}
                      placeholder="e.g. Sentiment is Negative"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Action Relay</label>
                    <input 
                      type="text"
                      value={newRuleAction}
                      onChange={e => setNewRuleAction(e.target.value)}
                      placeholder="e.g. Ping Admin on WhatsApp"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddRule}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer ml-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Automation Rule
                </button>
              </div>

            </div>
          )}

          {/* TAB 5: Operations Reports */}
          {activeTab === 'reports' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Operational PDF & Excel Reports</h3>
                  <p className="text-xs text-slate-400">Generate instantly compiled metrics, financial logs, and SLA charts ready to push to directors</p>
                </div>

                <div className="flex border border-slate-200 p-1 rounded-xl shrink-0">
                  {['daily', 'weekly', 'monthly'].map(rep => (
                    <button
                      key={rep}
                      onClick={() => setSelectedReport(rep as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition uppercase ${selectedReport === rep ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {rep}
                    </button>
                  ))}
                </div>
              </div>

              {/* Report Preview */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200/50">
                  <span className="font-bold text-slate-700">Preview: WORK_OS_${selectedReport.toUpperCase()}_REPORT.pdf</span>
                  <span className="text-slate-400 font-mono text-[10px]">Size: 1.4 MB</span>
                </div>

                <div className="space-y-3 text-xs text-slate-600 font-mono">
                  <p className="font-bold text-slate-800 text-xs">Geometric Work OS – Production Triage Registry Summary</p>
                  <p>--------------------------------------------------</p>
                  <p>Reporting Span: ${selectedReport === 'daily' ? 'Last 24 Hours' : selectedReport === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}</p>
                  <p>Sync Integrity: 100% Correct</p>
                  <p>SLA Performance Compliance Index: 98.4%</p>
                  <p>Total Completed Tasks: {tasks.filter(t => t.status === 'Completed').length} units</p>
                  <p>Revenue Pipeline Invoices Processed: ${invoices.reduce((a, c) => a + c.amount, 0).toLocaleString()} USD</p>
                  <p>Outstanding Overdue SLA Backlog Count: {overdueTasks.length} modules</p>
                  <p>--------------------------------------------------</p>
                  <p>### Generated securely via system telemetry hooks.</p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-200/50">
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition">
                      <Download className="h-4 w-4 text-slate-500" />
                      Download Excel
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition">
                      <Download className="h-4 w-4 text-slate-500" />
                      Download HTML
                    </button>
                  </div>

                  <button 
                    onClick={handleDispatchReport}
                    disabled={sentReport}
                    className={`flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer ${sentReport ? 'opacity-80' : ''}`}
                  >
                    {sentReport ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Dispatched...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send PDF report to WhatsApp Group
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
