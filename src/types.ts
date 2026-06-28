/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'viewer' | 'guest';
  password?: string;
  phone?: string;
  photo?: string;
  department?: string;
  designation?: string;
  company?: string;
  timezone?: string;
  language?: string;
  themePreference?: 'light' | 'dark' | 'system';
  status?: 'Active' | 'Locked' | 'Expired' | 'Inactive';
  failedLoginAttempts?: number;
  passwordExpiry?: string;
  createdAt?: string;
  connectedMailAccounts?: string[];
}

export interface Customer {
  id: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  status: 'Lead' | 'Active' | 'Inactive';
  notes?: string;
  createdAt: string;
}

export interface Email {
  id: string;
  customerId?: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  date: string;
  unread: boolean;
  starred: boolean;
  archived: boolean;
  spam: boolean;
  deleted: boolean;
  priority: 'High' | 'Medium' | 'Low';
  category: 'RFQ' | 'Quotation' | 'Purchase Order' | 'Invoice' | 'Drawing' | 'Complaint' | 'Meeting' | 'Reminder' | 'Approval' | 'Information' | 'General';
  aiAnalysis?: AiAnalysis;
  threadId?: string;
  attachments?: Attachment[];
  
  // Mail Center & AI Follow-Up additions
  mailAccountId?: string;
  isDraft?: boolean;
  scheduledSendTime?: string;
  replyIntelligence?: ReplyIntelligence;
}

export interface AiAnalysis {
  id: string;
  emailId: string;
  customerName: string;
  company: string;
  project: string;
  subject: string;
  priority: 'High' | 'Medium' | 'Low';
  deadline?: string;
  taskType: string;
  requiredAction: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  waitingFor?: string;
  nextAction: string;
  confidenceScore: number;
  aiSummary: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  category: string;
}

export interface Attachment {
  id: string;
  emailId: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  fileUrl: string;
  projectId?: string;
  customerId?: string;
}

export interface Project {
  id: string;
  name: string;
  customerId: string;
  description: string;
  status: 'Planning' | 'Active' | 'OnHold' | 'Completed';
  progress: number;
  startDate: string;
  endDate: string;
  budget?: number;
  code: string;
}

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  customerId?: string;
  projectId?: string;
  priority: 'Today' | 'Critical' | 'High' | 'Medium' | 'Low' | 'Later' | string;
  status: 'Pending' | 'In Progress' | 'Review' | 'Completed' | 'Waiting' | 'Cancelled' | string;
  dueDate: string;
  reminder?: string;
  assignedTo?: string;
  estimatedHours?: number;
  actualHours?: number;
  emailId?: string;
  notes?: string;
  checklist: TaskChecklistItem[];
  tags: string[];
  createdAt: string;
  columnOrder?: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  customerId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: 'email' | 'task' | 'project' | 'customer' | 'system';
  title: string;
  description: string;
  refId?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'Email' | 'Task' | 'Alert';
  status: 'Unread' | 'Read';
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: number; // in minutes
  customerId?: string;
  projectId?: string;
  type: 'Call' | 'Review' | 'FollowUp' | 'Meeting';
  status: 'Scheduled' | 'Completed';
  calendarId?: string; // 'google' | 'outlook' | 'local'
  attendees?: string[];
  notes?: string;
  aiMinutes?: string;
  actionItemsExtracted?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentFolderId?: string | null;
  customerId?: string;
  projectId?: string;
  provider: 'local' | 'gdrive' | 'onedrive';
  createdAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: string;
  type: 'PDF' | 'CAD' | 'STEP' | 'Image' | 'Excel' | 'ZIP' | 'Other';
  customerId?: string;
  projectId?: string;
  folderId?: string | null;
  path: string;
  uploadedAt: string;
  provider?: 'local' | 'gdrive' | 'onedrive';
  hash?: string;
  sharedUrl?: string;
  ocrText?: string;
  aiSummary?: string;
  aiTags?: string[];
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  active: boolean;
  trigger: 'New Email' | 'Task Completed' | 'Customer Created' | 'Manual';
  actions: {
    type: 'Create Task' | 'Send Notification' | 'Update Status' | 'AI Summary';
    config: Record<string, any>;
  }[];
  lastTriggeredAt?: string;
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface DashboardStats {
  todayTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
  upcomingDeadlines: number;
  waitingReplies: number;
  recentEmailsCount: number;
}

export interface Rfq {
  id: string;
  rfqNumber: string;
  customerId: string;
  projectId?: string;
  title: string;
  status: 'Pending' | 'Quoted' | 'Approved' | 'Rejected';
  estimatedValue: number;
  targetDeliveryDate: string;
  drawingRef?: string;
  notes?: string;
  createdAt: string;
}

export interface Drawing {
  id: string;
  drawingNumber: string;
  title: string;
  customerId: string;
  projectId?: string;
  revision: string;
  status: 'In Review' | 'Approved' | 'Released' | 'Rejected';
  fileType: 'STEP' | 'IGES' | 'Creo' | 'SolidWorks' | 'DXF' | 'PDF';
  fileName: string;
  fileSize: string;
  approvedBy?: string;
  approvalDate?: string;
  approvalNotes?: string;
  updatedAt: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  rfqId: string;
  customerId: string;
  projectId?: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined';
  validUntil: string;
  terms?: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  quoteId: string;
  customerId: string;
  projectId?: string;
  amount: number;
  status: 'Received' | 'In Production' | 'Shipped' | 'Invoiced';
  issueDate: string;
  deliveryDate: string;
  fileUrl?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  poId?: string;
  customerId: string;
  projectId?: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  issueDate: string;
  dueDate: string;
  createdAt: string;
}

export interface DrawingRevision {
  id: string;
  drawingId: string;
  revision: string;
  description: string;
  engineer: string;
  date: string;
  fileUrl?: string;
}

export interface Ecr {
  id: string;
  ecrNumber: string;
  title: string;
  description: string;
  reason: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Draft' | 'In Review' | 'Approved' | 'Implemented' | 'Cancelled';
  customerId: string;
  projectId?: string;
  affectedDrawings: string[];
  requestedBy: string;
  createdAt: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  emails: Email[];
  latestSenderName: string;
  latestSenderEmail: string;
  lastReplyDate: string;
  status: 'Reply Required' | 'Waiting on Customer' | 'Under Review' | 'Resolved';
  customerId?: string;
  projectId?: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface ReplyIntelligence {
  replyStatus: 'New' | 'Unread' | 'Read' | 'Reply Needed' | 'Waiting Customer' | 'Waiting Internal Team' | 'Follow-up Required' | 'Replied' | 'Resolved';
  lastActivityTime: string;
  waitingSince?: string;
  followUpCount: number;
  priorityScore: number; // 0 to 100
  escalationFlag: boolean;
  aiResponseSuggestion?: string;
  timelineEvents?: {
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }[];
}

export interface MailAccount {
  id: string;
  name: string;
  email: string;
  provider: 'gmail' | 'yahoo' | 'outlook' | 'imap';
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  lastSyncedAt?: string;
  storageUsed?: string; // e.g. "2.4 GB of 15 GB"
  isDefault: boolean;
  isActive: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  device: string;
  browser: string;
  ipAddress: string;
  loginTime: string;
  lastActiveTime: string;
  status: 'Active' | 'Terminated';
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string; // e.g. "LOGIN", "FAILED_LOGIN", "ROLE_CHANGE", "SETTINGS_UPDATE"
  details: string;
  ipAddress?: string;
  device?: string;
  timestamp: string;
}

export interface RolePermission {
  id: string;
  roleName: 'admin' | 'manager' | 'user' | 'viewer' | 'guest';
  permissions: string[]; // list of permissions like 'view_logs', 'delete_task', etc.
}

// Enterprise Integration Center Schema
export interface ServiceProvider {
  id: 'gmail' | 'yahoo' | 'outlook' | 'm365' | 'gdrive' | 'gemini' | 'telegram' | 'whatsapp' | 'supabase' | 'future';
  name: string;
  category: 'email' | 'storage' | 'ai' | 'chat' | 'database' | 'other';
  description: string;
  logo?: string;
}

export interface ServiceConnection {
  id: string;
  providerId: 'gmail' | 'yahoo' | 'outlook' | 'm365' | 'gdrive' | 'gemini' | 'telegram' | 'whatsapp' | 'supabase' | 'future';
  name: string;
  email?: string;
  status: 'Connected' | 'Disconnected';
  health: 'Healthy' | 'Unhealthy' | 'Not Configured';
  lastSyncAt?: string;
  lastError?: string;
  storageUsed?: string;
  syncPaused?: boolean;
  createdAt: string;
  oauthStatus?: string;
  tokenExpiry?: string;
  refreshTokenStatus?: string;
  lastSuccessSyncAt?: string;
  lastFailedSyncAt?: string;
  apiResponseTime?: number;
  healthScore?: number;
  permissions?: string[];
  version?: string;
  quotaUsage?: string;
}

export interface OAuthToken {
  id: string;
  connectionId: string;
  encryptedAccessToken: string;
  encryptedRefreshToken?: string;
  expiresAt?: string; // ISO String
}

export interface ProviderSetting {
  id: string;
  connectionId: string;
  key: string;
  value: string;
}

export interface SyncLog {
  id: string;
  connectionId: string;
  timestamp: string;
  type: 'manual' | 'auto' | 'background';
  status: 'success' | 'failed';
  details: string;
  durationMs: number;
  itemsSynced: number;
}

export interface IntegrationError {
  id: string;
  connectionId?: string;
  providerId: string;
  timestamp: string;
  code: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}


