import fs from 'fs';
import path from 'path';
import { 
  User, Customer, Email, Project, Task, Note, 
  Activity, Notification, Meeting, FileItem, Folder,
  AutomationWorkflow, SystemLog, AiAnalysis, Attachment,
  Rfq, Drawing, Quotation, PurchaseOrder, Invoice, DrawingRevision, Ecr,
  UserSession, AuditLog, MailAccount, RolePermission,
  ServiceProvider, ServiceConnection, OAuthToken, ProviderSetting, SyncLog, IntegrationError
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  users: User[];
  customers: Customer[];
  emails: Email[];
  attachments: Attachment[];
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  activities: Activity[];
  notifications: Notification[];
  meetings: Meeting[];
  files: FileItem[];
  folders: Folder[];
  automations: AutomationWorkflow[];
  logs: SystemLog[];
  rfqs: Rfq[];
  drawings: Drawing[];
  quotations: Quotation[];
  purchaseOrders: PurchaseOrder[];
  invoices: Invoice[];
  revisions: DrawingRevision[];
  ecrs: Ecr[];
  userSessions: UserSession[];
  auditLogs: AuditLog[];
  mailAccounts: MailAccount[];
  rolePermissions: RolePermission[];
  serviceProviders?: ServiceProvider[];
  serviceConnections?: ServiceConnection[];
  oauthTokens?: OAuthToken[];
  providerSettings?: ProviderSetting[];
  syncLogs?: SyncLog[];
  integrationErrors?: IntegrationError[];
}

export function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    if (!fs.existsSync(DB_FILE)) {
      const initial = getSeedData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content) as DatabaseSchema;
    if (!parsed.folders) {
      parsed.folders = [];
    }
    if (parsed.files) {
      parsed.files.forEach(f => {
        if (!f.provider) f.provider = 'local';
        if (f.folderId === undefined) f.folderId = null;
      });
    }
    if (!parsed.serviceProviders || parsed.serviceProviders.length === 0) {
      // Lazy load standard providers
      parsed.serviceProviders = [
        { id: 'gmail', name: 'Gmail', category: 'email', description: 'Connect using secure Google OAuth 2.0 to access, sync, and reply to your corporate Gmail mailboxes.' },
        { id: 'yahoo', name: 'Yahoo Mail', category: 'email', description: 'Sync your business mailboxes using generic IMAP/SMTP or custom App Password credentials.' },
        { id: 'outlook', name: 'Outlook', category: 'email', description: 'Authenticate using Microsoft Graph API to access mail, calendar events, and contacts.' },
        { id: 'm365', name: 'Microsoft 365', category: 'email', description: 'Enterprise suite authentication for Azure AD / Microsoft 365 services.' },
        { id: 'gdrive', name: 'Google Drive', category: 'storage', description: 'Browse Google Drive directories, download drawings, and synchronize project vaults.' },
        { id: 'gemini', name: 'Gemini AI', category: 'ai', description: 'Secure enterprise connection using Gemini API Keys to run automated email triage and minutes compilation.' },
        { id: 'telegram', name: 'Telegram', category: 'chat', description: 'Automated notification relay dispatching critical alerts to active group threads using Bot Tokens.' },
        { id: 'whatsapp', name: 'WhatsApp', category: 'chat', description: 'Business messaging endpoint architecture for real-time customer support pipelines.' },
        { id: 'supabase', name: 'Supabase', category: 'database', description: 'Connect directly to your relational PostgreSQL storage, storage buckets, and realtime queues.' },
        { id: 'future', name: 'Future APIs', category: 'other', description: 'Reserved hooks for custom Zoho, Proton, and Active Exchange Server integrations.' }
      ];
    }
    if (!parsed.serviceConnections) parsed.serviceConnections = [];
    if (!parsed.oauthTokens) parsed.oauthTokens = [];
    if (!parsed.providerSettings) parsed.providerSettings = [];
    if (!parsed.syncLogs) parsed.syncLogs = [];
    if (!parsed.integrationErrors) parsed.integrationErrors = [];
    return parsed;
  } catch (err) {
    console.error('Error reading DB, returning empty schema:', err);
    return getSeedData(); // Fallback
  }
}

export function writeDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to DB:', err);
  }
}

// Helper to log activities
export function logActivity(type: Activity['type'], title: string, description: string, refId?: string) {
  const db = readDb();
  const newActivity: Activity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type,
    title,
    description,
    refId,
    timestamp: new Date().toISOString()
  };
  db.activities.unshift(newActivity);
  // Keep logs to latest 200 items
  if (db.activities.length > 200) {
    db.activities = db.activities.slice(0, 200);
  }
  writeDb(db);
}

// Helper to create notifications
export function createNotification(type: Notification['type'], title: string, message: string) {
  const db = readDb();
  const newNotif: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title,
    message,
    type,
    status: 'Unread',
    createdAt: new Date().toISOString()
  };
  db.notifications.unshift(newNotif);
  writeDb(db);
}

// Helper to log system events
export function logSystem(level: SystemLog['level'], message: string) {
  const db = readDb();
  const newLog: SystemLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    level,
    message,
    timestamp: new Date().toISOString()
  };
  db.logs.unshift(newLog);
  if (db.logs.length > 500) {
    db.logs = db.logs.slice(0, 500);
  }
  writeDb(db);
}

function getSeedData(): DatabaseSchema {
  const customerIds = {
    apex: 'cust_apex_101',
    global: 'cust_global_102',
    robotics: 'cust_robotics_103',
    nexus: 'cust_nexus_104'
  };

  const projectIds = {
    bracket: 'proj_bracket_201',
    sensor: 'proj_sensor_202',
    drone: 'proj_drone_203'
  };

  const emailIds = {
    rfq: 'em_rfq_301',
    dwg: 'em_dwg_302',
    complaint: 'em_complaint_303',
    billing: 'em_billing_304',
    meeting: 'em_meeting_305'
  };

  const customers: Customer[] = [
    {
      id: customerIds.apex,
      company: 'Apex Industrial Engineering',
      contactName: 'James Henderson',
      email: 'james.henderson@apexind.com',
      phone: '+1 (555) 234-5678',
      status: 'Active',
      notes: 'Premium engineering partner. Focused on custom mechanical structures, CNC components, and aerospace turbine mounting solutions.',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
    },
    {
      id: customerIds.global,
      company: 'Global Aero Systems LLC',
      contactName: 'Sarah Jenkins',
      email: 'sjenkins@globalaero.io',
      phone: '+1 (555) 876-5432',
      status: 'Active',
      notes: 'Leading supplier of avionics sub-assemblies. Requires continuous drawing updates and compliance tracking.',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: customerIds.robotics,
      company: 'Precision Robotics Lab',
      contactName: 'Dr. Aaron Chen',
      email: 'aaron.chen@pr-labs.edu',
      phone: '+1 (555) 432-1098',
      status: 'Lead',
      notes: 'R&D Lab requesting quotes for lightweight multi-axis drone housing structures.',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: customerIds.nexus,
      company: 'Nexus Smart Utilities',
      contactName: 'Elena Rostova',
      email: 'e.rostova@nexus-smart.com',
      phone: '+49 89 1234 567',
      status: 'Inactive',
      notes: 'Smart grid instrumentation supplier. No active engagements in the last 30 days.',
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const projects: Project[] = [
    {
      id: projectIds.bracket,
      name: 'Titanium Bracket Manufacturing',
      customerId: customerIds.apex,
      description: 'Production and validation of custom multi-axis aircraft bracket structures with tight dimensional tolerancing.',
      status: 'Active',
      progress: 68,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: 85000,
      code: 'PRJ-APX-001'
    },
    {
      id: projectIds.sensor,
      name: 'Avionics Sensor Housing Redraw',
      customerId: customerIds.global,
      description: 'Updating older 2D legacy blueprint CAD models into unified 3D STEP formats and validating wall tolerances.',
      status: 'Active',
      progress: 35,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: 18500,
      code: 'PRJ-GLB-008'
    },
    {
      id: projectIds.drone,
      name: 'Drone Enclosure Rapid Prototyping',
      customerId: customerIds.robotics,
      description: 'Initial architectural evaluation and SLS 3D printing of drone sensor rigs for Aaron Chen.',
      status: 'Planning',
      progress: 10,
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: 6200,
      code: 'PRJ-ROB-015'
    }
  ];

  const emails: Email[] = [
    {
      id: emailIds.rfq,
      customerId: customerIds.apex,
      senderName: 'James Henderson',
      senderEmail: 'james.henderson@apexind.com',
      subject: 'URGENT: Request for Quote (RFQ) - Turbine Mount Bracket Batch C',
      body: `Hi Team,\n\nWe urgently need a quotation for an additional batch of 150 titanium mounting brackets based on drawing Apex-M4-v2.pdf. The delivery schedule is critical—we must receive these on-site within 3 weeks (by July 18).\n\nPlease review the mechanical tolerances in Section B of the drawing and let me know if you can meet these specifications. I have attached the design drawing for your review.\n\nBest regards,\nJames Henderson\nSenior Procurement Manager\nApex Industrial Engineering`,
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hrs ago
      unread: true,
      starred: true,
      archived: false,
      spam: false,
      deleted: false,
      priority: 'High',
      category: 'RFQ',
      aiAnalysis: {
        id: 'ana_rfq_01',
        emailId: emailIds.rfq,
        customerName: 'James Henderson',
        company: 'Apex Industrial Engineering',
        project: 'Titanium Bracket Manufacturing',
        subject: 'Request for Quote (RFQ) - Turbine Mount Bracket Batch C',
        priority: 'High',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Response due in 2 days
        taskType: 'Quotation',
        requiredAction: 'Create formal price quote for 150 titanium units and confirm lead times under 3 weeks.',
        riskLevel: 'Medium',
        waitingFor: 'Engineering review of tight mechanical tolerances in Section B',
        nextAction: 'Calculate machining cost metrics and verify inventory of Grade 5 titanium billet.',
        confidenceScore: 98,
        aiSummary: 'James Henderson is requesting an urgent quotation for 150 units of mounting brackets based on drawing Apex-M4-v2.pdf with a tight 3-week delivery target.',
        sentiment: 'Neutral',
        category: 'RFQ'
      }
    },
    {
      id: emailIds.dwg,
      customerId: customerIds.global,
      senderName: 'Sarah Jenkins',
      senderEmail: 'sjenkins@globalaero.io',
      subject: 'Updated CAD Drawings for Avionics Enclosure (v1.4)',
      body: `Hello Work OS Team,\n\nI have uploaded the latest revisions for the Avionics Sensor Housing project. We adjusted the mounting boss spacing from 45mm to 48mm to fit the newer internal PCB revision.\n\nPlease update the active tooling model and verify that this does not impact our draft angle calculations on the plastic injection side.\n\nFiles attached: \n- sensor_enclosure_v1.4.step\n- revision_notes_av.pdf\n\nThanks,\nSarah`,
      date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hrs ago
      unread: true,
      starred: false,
      archived: false,
      spam: false,
      deleted: false,
      priority: 'Medium',
      category: 'Drawing',
      aiAnalysis: {
        id: 'ana_dwg_02',
        emailId: emailIds.dwg,
        customerName: 'Sarah Jenkins',
        company: 'Global Aero Systems LLC',
        project: 'Avionics Sensor Housing Redraw',
        subject: 'Updated CAD Drawings for Avionics Enclosure (v1.4)',
        priority: 'Medium',
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        taskType: 'Drawing Update',
        requiredAction: 'Analyze STEP model boss revision, check draft angle clearance, update working drawing files.',
        riskLevel: 'Low',
        nextAction: 'Open CAD file and perform draft angle verification on the modified spacing.',
        confidenceScore: 95,
        aiSummary: 'Sarah has sent revised CAD models (v1.4) shifting boss spacing to 48mm, requiring drawing and draft clearance updates.',
        sentiment: 'Neutral',
        category: 'Drawing'
      }
    },
    {
      id: emailIds.complaint,
      customerId: customerIds.apex,
      senderName: 'James Henderson',
      senderEmail: 'james.henderson@apexind.com',
      subject: 'Billing discrepancy - Invoice INV-2026-089',
      body: `Hello,\n\nWe received invoice INV-2026-089 for the titanium raw stock. However, the price matches our old rate of $42/lb instead of the negotiated contract price of $38/lb for this quarter.\n\nPlease issue a corrected invoice as soon as possible so we can process the payment promptly.\n\nRegards,\nJames`,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      unread: false,
      starred: false,
      archived: false,
      spam: false,
      deleted: false,
      priority: 'High',
      category: 'Complaint',
      aiAnalysis: {
        id: 'ana_compl_03',
        emailId: emailIds.complaint,
        customerName: 'James Henderson',
        company: 'Apex Industrial Engineering',
        project: 'Titanium Bracket Manufacturing',
        subject: 'Billing discrepancy - Invoice INV-2026-089',
        priority: 'High',
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        taskType: 'Billing Revision',
        requiredAction: 'Verify quarter contract pricing sheet, adjust rate from $42 to $38/lb, issue revised credit note.',
        riskLevel: 'High',
        waitingFor: 'Accounting verification of quarter pricing agreements',
        nextAction: 'Re-issue invoice and email Henderson with an apology.',
        confidenceScore: 99,
        aiSummary: 'James claims a rate discrepancy on invoice INV-2026-089, noting it is billed at $42/lb instead of the quarter contract price of $38/lb.',
        sentiment: 'Negative',
        category: 'Complaint'
      }
    },
    {
      id: emailIds.billing,
      customerId: customerIds.global,
      senderName: 'Accounts Payable',
      senderEmail: 'ap@globalaero.io',
      subject: 'Payment Confirmation: INV-2026-082',
      body: `Hello, \n\nPlease find attached the remittance statement for wire transaction ref-98234798 confirming the settlement of invoice INV-2026-082 in the amount of $12,450.00.\n\nThank you for your services.\n\nGlobal Aero AP`,
      date: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 1.5 days ago
      unread: false,
      starred: false,
      archived: true,
      spam: false,
      deleted: false,
      priority: 'Low',
      category: 'Invoice',
      aiAnalysis: {
        id: 'ana_bill_04',
        emailId: emailIds.billing,
        customerName: 'Global Aero AP',
        company: 'Global Aero Systems LLC',
        project: 'Avionics Sensor Housing Redraw',
        subject: 'Payment Confirmation: INV-2026-082',
        priority: 'Low',
        taskType: 'Reconciliation',
        requiredAction: 'Mark Invoice INV-2026-082 as Paid, log remittance token ref-98234798.',
        riskLevel: 'Low',
        nextAction: 'Log transaction in general ledger and close task.',
        confidenceScore: 97,
        aiSummary: 'Payment remittance of $12,450.00 confirmed for invoice INV-2026-082.',
        sentiment: 'Positive',
        category: 'Invoice'
      }
    },
    {
      id: emailIds.meeting,
      customerId: customerIds.robotics,
      senderName: 'Aaron Chen',
      senderEmail: 'aaron.chen@pr-labs.edu',
      subject: 'Schedule Meeting: Drone Housing Feasibility Review',
      body: `Hi Work OS,\n\nI would like to schedule a 30-minute MS Teams meeting on Tuesday morning to discuss our structural CAD models for the drone multi-axis housing.\n\nDoes 10:00 AM PST work on your side? Let me know and I will send over the calendar invite.\n\nRegards,\nAaron`,
      date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
      unread: false,
      starred: false,
      archived: false,
      spam: false,
      deleted: false,
      priority: 'Medium',
      category: 'Meeting',
      aiAnalysis: {
        id: 'ana_meet_05',
        emailId: emailIds.meeting,
        customerName: 'Aaron Chen',
        company: 'Precision Robotics Lab',
        project: 'Drone Enclosure Rapid Prototyping',
        subject: 'Schedule Meeting: Drone Housing Feasibility Review',
        priority: 'Medium',
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        taskType: 'Calendar Sync',
        requiredAction: 'Confirm 10:00 AM PST Tuesday, create calendar slot, link Aaron Chen.',
        riskLevel: 'Low',
        nextAction: 'Send calendar confirmation reply and add details to dashboard.',
        confidenceScore: 94,
        aiSummary: 'Dr. Aaron Chen requests a 30-minute MS Teams meeting on Tuesday at 10:00 AM PST to conduct feasibility analysis of drone enclosures.',
        sentiment: 'Positive',
        category: 'Meeting'
      }
    }
  ];

  const attachments: Attachment[] = [
    {
      id: 'att_1',
      emailId: emailIds.rfq,
      fileName: 'Apex-M4-v2.pdf',
      fileType: 'PDF',
      fileSize: '4.2 MB',
      fileUrl: '/api/files/download/Apex-M4-v2.pdf',
      customerId: customerIds.apex,
      projectId: projectIds.bracket
    },
    {
      id: 'att_2',
      emailId: emailIds.dwg,
      fileName: 'sensor_enclosure_v1.4.step',
      fileType: 'CAD',
      fileSize: '12.8 MB',
      fileUrl: '/api/files/download/sensor_enclosure_v1.4.step',
      customerId: customerIds.global,
      projectId: projectIds.sensor
    },
    {
      id: 'att_3',
      emailId: emailIds.dwg,
      fileName: 'revision_notes_av.pdf',
      fileType: 'PDF',
      fileSize: '850 KB',
      fileUrl: '/api/files/download/revision_notes_av.pdf',
      customerId: customerIds.global,
      projectId: projectIds.sensor
    }
  ];

  const tasks: Task[] = [
    {
      id: 'tsk_1',
      title: 'Generate Quote: 150 Titanium Mount Brackets',
      description: 'Perform complete CNC machining and surface validation costing for James Henderson. Verify titanium grade billet lead times.',
      customerId: customerIds.apex,
      projectId: projectIds.bracket,
      priority: 'High',
      status: 'Pending',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reminder: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: 'Lead Account Manager',
      estimatedHours: 4,
      actualHours: 0,
      emailId: emailIds.rfq,
      checklist: [
        { id: 'chk_1', text: 'Verify Gr.5 stock billet price index', completed: false },
        { id: 'chk_2', text: 'Calculate custom CNC toolpaths setup cost', completed: false },
        { id: 'chk_3', text: 'Draft quotation letter in PDF', completed: false }
      ],
      tags: ['RFQ', 'CNC-Production', 'Titanium'],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tsk_2',
      title: 'Analyze Avionics CAD revision v1.4',
      description: 'Check modified 48mm spacing wall dimensions. Run initial simulation to confirm draft clearance angles for injection mold.',
      customerId: customerIds.global,
      projectId: projectIds.sensor,
      priority: 'Medium',
      status: 'In Progress',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedTo: 'Senior Design Engineer',
      estimatedHours: 6,
      actualHours: 2,
      emailId: emailIds.dwg,
      checklist: [
        { id: 'chk_4', text: 'Import step file into CAD visualizer', completed: true },
        { id: 'chk_5', text: 'Verify wall thickness metrics', completed: false },
        { id: 'chk_6', text: 'Simulate mold ejection clearance', completed: false }
      ],
      tags: ['CAD', 'STEP', 'Avionics'],
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tsk_3',
      title: 'Adjust Invoice INV-2026-089 billing rate',
      description: 'Discrepancy reported. Correct titanium stock invoice rate from $42 to $38/lb based on quarter-level SLA contracts.',
      customerId: customerIds.apex,
      projectId: projectIds.bracket,
      priority: 'High',
      status: 'Waiting',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedTo: 'Financial Operations Lead',
      estimatedHours: 2,
      actualHours: 1,
      emailId: emailIds.complaint,
      notes: 'Waiting for billing manager approval on rate adjustment authorization.',
      checklist: [
        { id: 'chk_7', text: 'Review contract SLA page 4', completed: true },
        { id: 'chk_8', text: 'Draft revised credit note', completed: false }
      ],
      tags: ['Billing', 'Contract', 'Discrepancy'],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tsk_4',
      title: 'Reconcile Remittance: Global Aero INV-2026-082',
      description: 'Reconcile payment ledger entry wire hash ref-98234798 for avionics housing drawings deposit.',
      customerId: customerIds.global,
      projectId: projectIds.sensor,
      priority: 'Low',
      status: 'Completed',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedTo: 'Financial Operations Lead',
      estimatedHours: 1,
      actualHours: 1,
      emailId: emailIds.billing,
      checklist: [
        { id: 'chk_9', text: 'Locate bank ledger wire confirmation', completed: true },
        { id: 'chk_10', text: 'Update QuickBooks ledger state', completed: true }
      ],
      tags: ['Payment', 'Ledger'],
      createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tsk_5',
      title: 'Coordinate Drone Housing Teams Meeting',
      description: 'Setup teams channel and prepare drawing package for Tuesday morning technical review with Dr. Aaron Chen.',
      customerId: customerIds.robotics,
      projectId: projectIds.drone,
      priority: 'Medium',
      status: 'Completed',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedTo: 'Project Architect',
      estimatedHours: 3,
      actualHours: 3,
      emailId: emailIds.meeting,
      checklist: [
        { id: 'chk_11', text: 'Confirm Tuesday 10am Teams calendar slot', completed: true },
        { id: 'chk_12', text: 'Compile initial SLA drone drawing draft', completed: true }
      ],
      tags: ['R&D', 'Review', 'Meeting'],
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    }
  ];

  const notes: Note[] = [
    {
      id: 'nt_1',
      title: 'Apex Mechanical Bracket Tolerances',
      content: 'Apex requires an extremely tight dimensional control of ±0.02mm on the primary alignment bosses. Grade 5 titanium undergoes high thermal expansion during CNC toolpaths, so coolant streams must remain at peak flow levels.',
      customerId: customerIds.apex,
      projectId: projectIds.bracket,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'nt_2',
      title: 'Sarah Jenkins Feedback on Injection Drafting',
      content: 'SARAH NOTES: Keep drafts to at least 1.5 degrees on outer perimeter flanges. Spacing can shrink under structural compression, so double-check boss shear factors.',
      customerId: customerIds.global,
      projectId: projectIds.sensor,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const meetings: Meeting[] = [
    {
      id: 'meet_1',
      title: 'Drone Housing CAD Feasibility Review',
      description: 'Discuss 3D CAD modeling structure, tolerance indexes, and initial SLA 3D print parameters with Dr. Aaron Chen.',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T10:00:00.000Z', // Tomorrow at 10 AM UTC
      duration: 30,
      customerId: customerIds.robotics,
      projectId: projectIds.drone,
      type: 'Review',
      status: 'Scheduled'
    },
    {
      id: 'meet_2',
      title: 'Apex Bracket Tooling Alignment Call',
      description: 'Technical sync with James Henderson regarding Section B machining specifications.',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T14:30:00.000Z',
      duration: 45,
      customerId: customerIds.apex,
      projectId: projectIds.bracket,
      type: 'Call',
      status: 'Scheduled'
    },
    {
      id: 'meet_3',
      title: 'Weekly Production Standup',
      description: 'Global active work queue alignment, inventory update on titanium stock billets, and automation pipeline check.',
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T09:00:00.000Z',
      duration: 30,
      type: 'Meeting',
      status: 'Completed'
    }
  ];

  const files: FileItem[] = [
    {
      id: 'fl_1',
      name: 'Apex-M4-v2.pdf',
      size: '4.2 MB',
      type: 'PDF',
      customerId: customerIds.apex,
      projectId: projectIds.bracket,
      path: 'Apex-M4-v2.pdf',
      uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'fl_2',
      name: 'sensor_enclosure_v1.4.step',
      size: '12.8 MB',
      type: 'CAD',
      customerId: customerIds.global,
      projectId: projectIds.sensor,
      path: 'sensor_enclosure_v1.4.step',
      uploadedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'fl_3',
      name: 'revision_notes_av.pdf',
      size: '850 KB',
      type: 'PDF',
      customerId: customerIds.global,
      projectId: projectIds.sensor,
      path: 'revision_notes_av.pdf',
      uploadedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'fl_4',
      name: 'TurbineBracket_3D_Sim.png',
      size: '1.4 MB',
      type: 'Image',
      customerId: customerIds.apex,
      projectId: projectIds.bracket,
      path: 'TurbineBracket_3D_Sim.png',
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const automations: AutomationWorkflow[] = [
    {
      id: 'auto_1',
      name: 'AI Email Auto-Triage Parser',
      description: 'Triggered when a new email is downloaded. Automatically calls the Gemini API to analyze subject, sender, customer profile, and extracts formal action items, auto-creating related high-priority tasks.',
      active: true,
      trigger: 'New Email',
      actions: [
        { type: 'AI Summary', config: { generateSummary: true, analyzeSentiment: true } },
        { type: 'Create Task', config: { mapFields: true, defaultPriority: 'High' } },
        { type: 'Send Notification', config: { channel: 'In-App & Email', alertLevel: 'Immediate' } }
      ],
      lastTriggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'auto_2',
      name: 'Invoice Reconciliation Tracker',
      description: 'Triggered upon customer ledger payment wire confirmation. Auto-closes waiting billing tasks and transitions project milestones.',
      active: true,
      trigger: 'Task Completed',
      actions: [
        { type: 'Update Status', config: { targetModel: 'Project', transitionStatus: 'Active' } },
        { type: 'Send Notification', config: { channel: 'In-App', message: 'Payment wire reconciled successfully.' } }
      ],
      lastTriggeredAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'auto_3',
      name: 'Onboarding System Catalyst',
      description: 'Triggered when a new Customer Lead profile is created. Schedules a morning follow-up call, opens a Notion notes template, and tags accounts.',
      active: false,
      trigger: 'Customer Created',
      actions: [
        { type: 'Create Task', config: { title: 'Schedule Onboarding Discovery', priority: 'Medium' } }
      ]
    }
  ];

  const notifications: Notification[] = [
    {
      id: 'notif_1',
      title: 'Urgent RFQ Email Received',
      message: 'New RFQ from James Henderson at Apex Industrial regarding "Turbine Mount Bracket Batch C" (High Priority). Task auto-created.',
      type: 'Email',
      status: 'Unread',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'notif_2',
      title: 'Drawing File Revision Uploaded',
      message: 'Sarah Jenkins uploaded sensor_enclosure_v1.4.step for Avionics Sensor Housing.',
      type: 'Email',
      status: 'Unread',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'notif_3',
      title: 'Billing Discrepancy Flagged',
      message: 'Invoice discrepancy flagged for Apex Mount Brackets. Status set to: Waiting.',
      type: 'Task',
      status: 'Read',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const activities: Activity[] = [
    {
      id: 'act_1',
      type: 'email',
      title: 'Received Email RFQ',
      description: 'New RFQ from James Henderson (james.henderson@apexind.com) regarding "Turbine Mount Bracket Batch C"',
      refId: emailIds.rfq,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'act_2',
      type: 'task',
      title: 'Task Created Automatically',
      description: 'Auto-generated high priority task: "Generate Quote: 150 Titanium Mount Brackets" via AI Email Auto-Triage Engine.',
      refId: 'tsk_1',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'act_3',
      type: 'email',
      title: 'Received CAD Drawing Attachment',
      description: 'Sarah Jenkins (sjenkins@globalaero.io) uploaded step revision sensor_enclosure_v1.4.step.',
      refId: emailIds.dwg,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'act_4',
      type: 'task',
      title: 'Task Marked Completed',
      description: 'Reconcile Remittance wire INV-2026-082 for Global Aero Systems.',
      refId: 'tsk_4',
      timestamp: new Date(Date.now() - 35 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'act_5',
      type: 'system',
      title: 'Work OS Initialized',
      description: 'Database and workflow systems initialized with 4 customers and seed projects.',
      timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const logs: SystemLog[] = [
    {
      id: 'log_1',
      level: 'info',
      message: 'Workflow Automation "AI Email Auto-Triage Parser" executed on email em_rfq_301. Status: Success.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'log_2',
      level: 'info',
      message: 'Downloaded attachments Apex-M4-v2.pdf and synced to Apex Project Directory folder.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'log_3',
      level: 'info',
      message: 'Incoming drawing ingestion pipeline processed CAD STEP asset v1.4.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'log_4',
      level: 'info',
      message: 'SMTP-Yahoo YahooMailSync client successfully checked mailbox folders: Inbox, Archive.',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    }
  ];

  const users: User[] = [
    {
      id: 'usr_1',
      name: 'Admin Jilanee',
      email: 'programjilanee@gmail.com',
      role: 'admin',
      password: 'adminpassword',
      status: 'Active',
      department: 'IT & Security',
      designation: 'Principal Architect',
      company: 'Geometric Suite',
      timezone: 'UTC',
      language: 'English',
      themePreference: 'dark',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      connectedMailAccounts: ['mail_gmail_1', 'mail_yahoo_1']
    },
    {
      id: 'usr_2',
      name: 'Sarah (Operations Manager)',
      email: 'sarah.mgr@workos.com',
      role: 'manager',
      password: 'managerpassword',
      status: 'Active',
      department: 'Commercial Ops',
      designation: 'Operations Director',
      company: 'Geometric Suite',
      timezone: 'America/New_York',
      language: 'English',
      themePreference: 'system',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      connectedMailAccounts: ['mail_gmail_1']
    },
    {
      id: 'usr_3',
      name: 'Alex (Technical Engineer)',
      email: 'alex.eng@workos.com',
      role: 'user',
      password: 'userpassword',
      status: 'Active',
      department: 'Engineering',
      designation: 'CAD Specialist',
      company: 'Geometric Suite',
      timezone: 'Europe/London',
      language: 'English',
      themePreference: 'light',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      connectedMailAccounts: []
    },
    {
      id: 'usr_4',
      name: 'Guest Inspector',
      email: 'guest.viewer@external.com',
      role: 'viewer',
      password: 'guestpassword',
      status: 'Active',
      department: 'External Audit',
      designation: 'Lead Auditor',
      company: 'Apex Industrial',
      timezone: 'Europe/Paris',
      language: 'French',
      themePreference: 'light',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      connectedMailAccounts: []
    }
  ];

  const mailAccounts: MailAccount[] = [
    {
      id: 'mail_gmail_1',
      name: 'Personal Gmail',
      email: 'programjilanee@gmail.com',
      provider: 'gmail',
      syncStatus: 'success',
      lastSyncedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      storageUsed: '4.8 GB of 15 GB',
      isDefault: true,
      isActive: true
    },
    {
      id: 'mail_yahoo_1',
      name: 'Yahoo Corporate',
      email: 'info@geometricsuite.yahoo',
      provider: 'yahoo',
      syncStatus: 'success',
      lastSyncedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      storageUsed: '12.5 GB of 100 GB',
      isDefault: false,
      isActive: true
    },
    {
      id: 'mail_outlook_1',
      name: 'Outlook Engineering',
      email: 'engineering@geometricsuite.outlook',
      provider: 'outlook',
      syncStatus: 'idle',
      storageUsed: '0 GB of 50 GB',
      isDefault: false,
      isActive: false
    }
  ];

  const rolePermissions: RolePermission[] = [
    {
      id: 'perm_1',
      roleName: 'admin',
      permissions: ['view_dashboard', 'manage_users', 'manage_roles', 'view_audit_logs', 'sync_emails', 'manage_tasks', 'manage_projects', 'manage_customers', 'manage_engineering', 'manage_automations', 'view_logs', 'ai_assistant']
    },
    {
      id: 'perm_2',
      roleName: 'manager',
      permissions: ['view_dashboard', 'sync_emails', 'manage_tasks', 'manage_projects', 'manage_customers', 'manage_engineering', 'manage_automations', 'ai_assistant']
    },
    {
      id: 'perm_3',
      roleName: 'user',
      permissions: ['view_dashboard', 'sync_emails', 'manage_tasks', 'manage_projects', 'manage_customers', 'manage_engineering', 'ai_assistant']
    },
    {
      id: 'perm_4',
      roleName: 'viewer',
      permissions: ['view_dashboard', 'view_projects', 'view_tasks', 'view_customers', 'view_engineering']
    },
    {
      id: 'perm_5',
      roleName: 'guest',
      permissions: ['view_dashboard']
    }
  ];

  const userSessions: UserSession[] = [
    {
      id: 'sess_1',
      userId: 'usr_1',
      device: 'MacBook Pro 16"',
      browser: 'Google Chrome',
      ipAddress: '192.168.1.45',
      loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      lastActiveTime: new Date().toISOString(),
      status: 'Active'
    },
    {
      id: 'sess_2',
      userId: 'usr_1',
      device: 'iPhone 15 Pro Max',
      browser: 'Safari Mobile',
      ipAddress: '172.56.21.109',
      loginTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      lastActiveTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      status: 'Active'
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud_1',
      userId: 'usr_1',
      userName: 'Admin Jilanee',
      action: 'LOGIN',
      details: 'User authenticated successfully via credentials token from browser cache.',
      ipAddress: '192.168.1.45',
      device: 'MacBook Pro 16"',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'aud_2',
      userId: 'usr_1',
      userName: 'Admin Jilanee',
      action: 'SETTINGS_UPDATE',
      details: 'Updated global IMAP poll interval setting to 5 minutes.',
      ipAddress: '192.168.1.45',
      device: 'MacBook Pro 16"',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }
  ];

  const rfqs: Rfq[] = [
    {
      id: 'rfq_1',
      rfqNumber: 'RFQ-2026-001',
      customerId: customerIds.apex,
      projectId: projectIds.bracket,
      title: 'Titanium Bracket Batch C',
      status: 'Pending',
      estimatedValue: 45000,
      targetDeliveryDate: '2026-07-18',
      drawingRef: 'Apex-M4-v2.pdf',
      notes: 'Requires Grade 5 titanium, very tight Section B mechanical tolerances.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'rfq_2',
      rfqNumber: 'RFQ-2026-002',
      customerId: customerIds.robotics,
      projectId: projectIds.drone,
      title: 'SLS Nylon Drone Housing Shells',
      status: 'Approved',
      estimatedValue: 8500,
      targetDeliveryDate: '2026-07-25',
      drawingRef: 'Drone_Housing_v1.step',
      notes: 'Prototypes for aerospace sensor housing review.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const drawings: Drawing[] = [
    {
      id: 'dwg_1',
      drawingNumber: 'DWG-APX-M4',
      title: 'Turbine Mount Bracket Orthographic',
      customerId: customerIds.apex,
      projectId: projectIds.bracket,
      revision: 'B',
      status: 'Released',
      fileType: 'PDF',
      fileName: 'Apex-M4-v2.pdf',
      fileSize: '2.4 MB',
      approvedBy: 'Lead Engineer',
      approvalDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      approvalNotes: 'Meets initial stress-strain loading specifications.',
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'dwg_2',
      drawingNumber: 'DWG-GLB-ENV',
      title: 'Avionics Sensor Housing STEP Model',
      customerId: customerIds.global,
      projectId: projectIds.sensor,
      revision: 'v1.4',
      status: 'In Review',
      fileType: 'STEP',
      fileName: 'sensor_enclosure_v1.4.step',
      fileSize: '8.1 MB',
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    }
  ];

  const quotations: Quotation[] = [
    {
      id: 'qte_1',
      quoteNumber: 'QTE-2026-042',
      rfqId: 'rfq_2',
      customerId: customerIds.robotics,
      projectId: projectIds.drone,
      amount: 8200,
      status: 'Accepted',
      validUntil: '2026-07-15',
      terms: 'Net 30. Standard prototype warranty.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po_1',
      poNumber: 'PO-789012',
      quoteId: 'qte_1',
      customerId: customerIds.robotics,
      projectId: projectIds.drone,
      amount: 8200,
      status: 'In Production',
      issueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryDate: '2026-07-25',
      fileUrl: 'PO_789012_Robotics.pdf',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const invoices: Invoice[] = [
    {
      id: 'inv_1',
      invoiceNumber: 'INV-2026-089',
      customerId: customerIds.apex,
      projectId: projectIds.bracket,
      amount: 14500,
      status: 'Sent',
      issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const revisions: DrawingRevision[] = [
    {
      id: 'rev_1',
      drawingId: 'dwg_1',
      revision: 'A',
      description: 'Initial structural draft released for manufacturing team review.',
      engineer: 'James Henderson',
      date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'rev_2',
      drawingId: 'dwg_1',
      revision: 'B',
      description: 'Tightened mechanical tolerances in Section B of drawings.',
      engineer: 'Lead Engineer',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const ecrs: Ecr[] = [
    {
      id: 'ecr_1',
      ecrNumber: 'ECR-2026-004',
      title: 'Shift Boss Spacing to 48mm',
      description: 'Adjust the boss mounting spacing from 45mm to 48mm to fit the updated internal avionics board revision (PCB v2).',
      reason: 'Prevent interference with raw component leads on PCB edge.',
      priority: 'High',
      status: 'In Review',
      customerId: customerIds.global,
      projectId: projectIds.sensor,
      affectedDrawings: ['DWG-GLB-ENV'],
      requestedBy: 'Sarah Jenkins',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    }
  ];

  const serviceProviders: ServiceProvider[] = [
    { id: 'gmail', name: 'Gmail', category: 'email', description: 'Connect using secure Google OAuth 2.0 to access, sync, and reply to your corporate Gmail mailboxes.' },
    { id: 'yahoo', name: 'Yahoo Mail', category: 'email', description: 'Sync your business mailboxes using generic IMAP/SMTP or custom App Password credentials.' },
    { id: 'outlook', name: 'Outlook', category: 'email', description: 'Authenticate using Microsoft Graph API to access mail, calendar events, and contacts.' },
    { id: 'm365', name: 'Microsoft 365', category: 'email', description: 'Enterprise suite authentication for Azure AD / Microsoft 365 services.' },
    { id: 'gdrive', name: 'Google Drive', category: 'storage', description: 'Browse Google Drive directories, download drawings, and synchronize project vaults.' },
    { id: 'gemini', name: 'Gemini AI', category: 'ai', description: 'Secure enterprise connection using Gemini API Keys to run automated email triage and minutes compilation.' },
    { id: 'telegram', name: 'Telegram', category: 'chat', description: 'Automated notification relay dispatching critical alerts to active group threads using Bot Tokens.' },
    { id: 'whatsapp', name: 'WhatsApp', category: 'chat', description: 'Business messaging endpoint architecture for real-time customer support pipelines.' },
    { id: 'supabase', name: 'Supabase', category: 'database', description: 'Connect directly to your relational PostgreSQL storage, storage buckets, and realtime queues.' },
    { id: 'future', name: 'Future APIs', category: 'other', description: 'Reserved hooks for custom Zoho, Proton, and Active Exchange Server integrations.' }
  ];

  return {
    users,
    customers,
    emails,
    attachments,
    projects,
    tasks,
    notes,
    activities,
    notifications,
    meetings,
    files,
    folders: [],
    automations,
    logs,
    rfqs,
    drawings,
    quotations,
    purchaseOrders,
    invoices,
    revisions,
    ecrs,
    userSessions,
    auditLogs,
    mailAccounts,
    rolePermissions,
    serviceProviders,
    serviceConnections: [],
    oauthTokens: [],
    providerSettings: [],
    syncLogs: [],
    integrationErrors: []
  };
}
