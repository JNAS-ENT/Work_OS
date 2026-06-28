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
  lastSystemScan?: string;
}

export function getEmptyDatabaseSchema(): DatabaseSchema {
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
      permissions: ['view_dashboard', 'sync_emails']
    }
  ];

  return {
    users: [],
    customers: [],
    emails: [],
    attachments: [],
    projects: [],
    tasks: [],
    notes: [],
    activities: [],
    notifications: [],
    meetings: [],
    files: [],
    folders: [],
    automations: [],
    logs: [],
    rfqs: [],
    drawings: [],
    quotations: [],
    purchaseOrders: [],
    invoices: [],
    revisions: [],
    ecrs: [],
    userSessions: [],
    auditLogs: [],
    mailAccounts: [],
    rolePermissions,
    serviceProviders,
    serviceConnections: [],
    oauthTokens: [],
    providerSettings: [],
    syncLogs: [],
    integrationErrors: []
  };
}

export function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    if (!fs.existsSync(DB_FILE)) {
      const initial = getEmptyDatabaseSchema();
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
    return getEmptyDatabaseSchema(); // Fallback
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

export function getSeedData(): DatabaseSchema {
  return getEmptyDatabaseSchema();
}
