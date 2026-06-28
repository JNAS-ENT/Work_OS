import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  readDb, writeDb, logActivity, createNotification, logSystem 
} from './server/db';
import { analyzeEmailWithGemini, getAiAssistantReply } from './server/ai';
import { 
  Customer, Email, Project, Task, Note, 
  Meeting, FileItem, AutomationWorkflow, AiAnalysis, Attachment,
  Rfq, Drawing, Quotation, PurchaseOrder, Invoice, DrawingRevision, Ecr
} from './src/types';

const app = express();
app.use(express.json());

// ==========================================
// LIGHTWEIGHT AUTOMATION ENGINE (n8n Replica)
// ==========================================
async function runAutomationPipeline(trigger: string, payload: any) {
  logSystem('info', `Automation trigger detected: [${trigger}]`);
  const db = readDb();
  const activeWorkflows = db.automations.filter(w => w.active && w.trigger === trigger);
  
  if (activeWorkflows.length === 0) {
    logSystem('info', `No active workflows found for trigger: [${trigger}]`);
    return;
  }

  for (const wf of activeWorkflows) {
    logSystem('info', `Executing workflow: "${wf.name}"`);
    try {
      let currentContext = { ...payload };
      
      for (const action of wf.actions) {
        logSystem('info', `Running action [${action.type}] for workflow: "${wf.name}"`);
        
        if (action.type === 'AI Summary') {
          // If payload is an Email and doesn't have an AI analysis yet, we run it
          if (trigger === 'New Email' && currentContext.subject && currentContext.body) {
            logSystem('info', `Invoking Gemini AI analyzer for "${currentContext.subject.substring(0, 30)}..."`);
            const analysis = await analyzeEmailWithGemini(currentContext.subject, currentContext.body);
            
            // Link analysis to email in database
            const latestDb = readDb();
            const emIndex = latestDb.emails.findIndex(e => e.id === currentContext.id);
            if (emIndex !== -1) {
              const fullAnalysis: AiAnalysis = {
                id: `ana_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                emailId: currentContext.id,
                customerName: analysis.customerName || 'Unknown Contact',
                company: analysis.company || 'Unknown Company',
                project: analysis.project || 'General Project',
                subject: analysis.subject || currentContext.subject,
                priority: analysis.priority || 'Medium',
                deadline: analysis.deadline,
                taskType: analysis.taskType || 'Review',
                requiredAction: analysis.requiredAction || 'Manual check required',
                riskLevel: analysis.riskLevel || 'Low',
                waitingFor: analysis.waitingFor,
                nextAction: analysis.nextAction || 'Email response',
                confidenceScore: analysis.confidenceScore || 90,
                aiSummary: analysis.aiSummary || 'Analyzed via Work OS Automation.',
                sentiment: analysis.sentiment || 'Neutral',
                category: analysis.category || 'General'
              };
              
              latestDb.emails[emIndex].aiAnalysis = fullAnalysis;
              latestDb.emails[emIndex].category = fullAnalysis.category as any;
              latestDb.emails[emIndex].priority = fullAnalysis.priority;
              
              // Also map email to a customer if matches email signature
              if (fullAnalysis.company) {
                const existingCust = latestDb.customers.find(c => 
                  c.company.toLowerCase().includes(fullAnalysis.company.toLowerCase()) ||
                  fullAnalysis.company.toLowerCase().includes(c.company.toLowerCase())
                );
                if (existingCust) {
                  latestDb.emails[emIndex].customerId = existingCust.id;
                  fullAnalysis.company = existingCust.company;
                } else {
                  // Auto create customer!
                  const newCust: Customer = {
                    id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                    company: fullAnalysis.company,
                    contactName: fullAnalysis.customerName,
                    email: currentContext.senderEmail,
                    phone: '+1 (555) AUTO-OS',
                    status: 'Lead',
                    notes: 'Auto-created via AI Email Triage engine.',
                    createdAt: new Date().toISOString()
                  };
                  latestDb.customers.push(newCust);
                  latestDb.emails[emIndex].customerId = newCust.id;
                  logActivity('customer', `Auto-Created Customer Profile`, `System created profile for "${newCust.company}" from signature analysis.`);
                  createNotification('Task', 'New Customer Lead Captured', `AI automatically created lead profile for ${newCust.company}.`);
                }
              }
              
              writeDb(latestDb);
              currentContext = { ...latestDb.emails[emIndex] }; // Update context
            }
          }
        }
        
        else if (action.type === 'Create Task') {
          const latestDb = readDb();
          const email = currentContext as Email;
          const analysis = email.aiAnalysis;
          
          if (email && analysis) {
            // Check if task already exists for this email
            const taskExists = latestDb.tasks.some(t => t.emailId === email.id);
            if (!taskExists) {
              const newTask: Task = {
                id: `tsk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                title: `${analysis.taskType}: ${analysis.subject}`,
                description: analysis.requiredAction || 'Follow up required on incoming email.',
                customerId: email.customerId,
                priority: analysis.priority || 'Medium',
                status: 'Pending',
                dueDate: analysis.deadline || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                assignedTo: 'Automated Agent',
                checklist: [
                  { id: `chk_auto_1`, text: `Execute step: ${analysis.nextAction}`, completed: false },
                  { id: `chk_auto_2`, text: 'Respond back to customer', completed: false }
                ],
                tags: [analysis.category, 'AI-Triggered'],
                emailId: email.id,
                createdAt: new Date().toISOString()
              };
              
              // Try to map to project
              if (email.customerId) {
                const proj = latestDb.projects.find(p => p.customerId === email.customerId);
                if (proj) newTask.projectId = proj.id;
              }
              
              latestDb.tasks.unshift(newTask);
              writeDb(latestDb);
              
              logActivity('task', `Task Auto-Created from Email`, `AI scheduled "${newTask.title}" automatically linked to ${analysis.company}.`, newTask.id);
              logSystem('info', `Auto-created task "${newTask.title}"`);
            }
          }
        }
        
        else if (action.type === 'Send Notification') {
          const latestDb = readDb();
          const message = action.config?.message || `Automation run complete for workflow "${wf.name}"`;
          
          if (trigger === 'New Email' && currentContext.subject) {
            const priorityLabel = currentContext.priority === 'High' ? '🔴 HIGH PRIORITY' : '🔵';
            createNotification(
              'Email', 
              `AI Triage: ${currentContext.subject}`, 
              `${priorityLabel} Email classified under [${currentContext.category || 'General'}]. Automated task scheduled.`
            );
          } else {
            createNotification('Alert', `Workflow Executed`, message);
          }
        }
        
        else if (action.type === 'Update Status') {
          // General status update transition
          logSystem('info', `Status transition trigger running successfully.`);
        }
      }
      
      // Update workflow last triggered timestamp
      const latestDb = readDb();
      const wfIndex = latestDb.automations.findIndex(w => w.id === wf.id);
      if (wfIndex !== -1) {
        latestDb.automations[wfIndex].lastTriggeredAt = new Date().toISOString();
        writeDb(latestDb);
      }
      
      logSystem('info', `Workflow "${wf.name}" completed successfully.`);
    } catch (e: any) {
      logSystem('error', `Workflow "${wf.name}" failed: ${e.message}`);
    }
  }
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// SYSTEM LOGS
app.get('/api/logs/system', (req, res) => {
  const db = readDb();
  res.json(db.logs);
});

app.get('/api/system-logs', (req, res) => {
  const db = readDb();
  res.json(db.logs);
});

app.delete('/api/system-logs', (req, res) => {
  const db = readDb();
  db.logs = [];
  writeDb(db);
  res.json({ success: true });
});

// ANALYTICS & STATS
function getDashboardStatsData() {
  const db = readDb();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const tasks = db.tasks;
  const emails = db.emails;
  const projects = db.projects;
  const customers = db.customers;
  const meetings = db.meetings;
  
  const todayTasks = tasks.filter(t => t.dueDate === todayStr).length;
  const pendingTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;
  
  const overdueTasks = tasks.filter(t => {
    return t.dueDate < todayStr && t.status !== 'Completed' && t.status !== 'Cancelled';
  }).length;
  
  const upcomingDeadlines = tasks.filter(t => {
    return t.dueDate >= todayStr && t.status !== 'Completed' && t.status !== 'Cancelled';
  }).length;
  
  const waitingReplies = emails.filter(e => e.aiAnalysis?.waitingFor).length;
  const recentEmailsCount = emails.filter(e => e.unread).length;
  
  // Weekly workload stats
  const workloadByStatus = {
    'Pending': tasks.filter(t => t.status === 'Pending').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    'Waiting': tasks.filter(t => t.status === 'Waiting').length,
    'Completed': completedTasks
  };
  
  // Tasks by priority
  const priorityBreakdown = {
    High: tasks.filter(t => t.priority === 'High').length,
    Medium: tasks.filter(t => t.priority === 'Medium').length,
    Low: tasks.filter(t => t.priority === 'Low').length,
  };

  // Sentiment analysis stats
  const sentimentBreakdown = {
    Positive: emails.filter(e => e.aiAnalysis?.sentiment === 'Positive').length,
    Neutral: emails.filter(e => e.aiAnalysis?.sentiment === 'Neutral').length,
    Negative: emails.filter(e => e.aiAnalysis?.sentiment === 'Negative').length,
  };

  // Category counts
  const categoryCounts = emails.reduce((acc, email) => {
    const cat = email.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    stats: {
      todayTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
      highPriorityTasks,
      upcomingDeadlines,
      waitingReplies,
      recentEmailsCount,
      totalCustomers: customers.length,
      totalProjects: projects.length,
      totalMeetings: meetings.length
    },
    workloadByStatus,
    priorityBreakdown,
    sentimentBreakdown,
    categoryCounts,
    recentActivities: db.activities.slice(0, 10),
    activities: db.activities, // Added so App.tsx setActivities works
    todayMeetingsList: meetings.filter(m => m.date.startsWith(todayStr))
  };
}

app.get('/api/dashboard-stats', (req, res) => {
  res.json(getDashboardStatsData());
});

app.get('/api/analytics/dashboard', (req, res) => {
  res.json(getDashboardStatsData());
});

// EMAILS
app.get('/api/emails/threads', (req, res) => {
  const db = readDb();
  const emails = db.emails.filter(e => !e.deleted);
  
  // Helper to standardize subject lines for threading
  const getCleanSubject = (subj: string) => {
    return subj.replace(/^(re|fw|fwd|reply):\s*/i, '').trim().toLowerCase();
  };

  // Group emails by threadId or clean subject
  const groups: Record<string, Email[]> = {};
  emails.forEach(email => {
    const threadKey = email.threadId || `subj_${getCleanSubject(email.subject)}`;
    if (!groups[threadKey]) {
      groups[threadKey] = [];
    }
    groups[threadKey].push(email);
  });

  const threads = Object.keys(groups).map(threadId => {
    const threadEmails = groups[threadId].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstEmail = threadEmails[0];
    const latestEmail = threadEmails[threadEmails.length - 1];
    
    // Determine status
    let status: 'Reply Required' | 'Waiting on Customer' | 'Under Review' | 'Resolved' = 'Resolved';
    
    // If the latest email is unread or from customer and we haven't replied yet, status is 'Reply Required'
    const isLatestFromMe = latestEmail.senderEmail.includes('workos.ai') || latestEmail.senderEmail.includes('admin') || latestEmail.senderEmail.includes('administrator');
    
    if (isLatestFromMe) {
      status = 'Waiting on Customer';
    } else {
      if (latestEmail.unread || latestEmail.priority === 'High' || ['RFQ', 'Complaint', 'Approval'].includes(latestEmail.category)) {
        status = 'Reply Required';
      } else if (latestEmail.category === 'Drawing') {
        status = 'Under Review';
      } else {
        status = 'Reply Required'; // Default to needing confirmation
      }
    }

    // Determine priority (highest of the thread)
    let priority: 'High' | 'Medium' | 'Low' = 'Low';
    if (threadEmails.some(e => e.priority === 'High')) {
      priority = 'High';
    } else if (threadEmails.some(e => e.priority === 'Medium')) {
      priority = 'Medium';
    }

    return {
      id: threadId,
      subject: firstEmail.subject.replace(/^(re|fw|fwd|reply):\s*/i, '').trim(),
      emails: threadEmails,
      latestSenderName: latestEmail.senderName,
      latestSenderEmail: latestEmail.senderEmail,
      lastReplyDate: latestEmail.date,
      status,
      customerId: threadEmails.find(e => e.customerId)?.customerId,
      projectId: threadEmails.find(e => e.aiAnalysis?.project)?.id, // map using best heuristics
      priority
    };
  });

  res.json(threads);
});

app.get('/api/emails', (req, res) => {
  const db = readDb();
  const { folder } = req.query;
  
  let list = db.emails.filter(e => !e.deleted);
  
  if (folder === 'starred') {
    list = list.filter(e => e.starred);
  } else if (folder === 'unread') {
    list = list.filter(e => e.unread);
  } else if (folder === 'archived') {
    list = db.emails.filter(e => e.archived && !e.deleted);
  } else if (folder === 'spam') {
    list = db.emails.filter(e => e.spam && !e.deleted);
  } else if (folder === 'deleted') {
    list = db.emails.filter(e => e.deleted);
  } else {
    // Default inbox: not archived, not deleted, not spam
    list = list.filter(e => !e.archived && !e.spam);
  }
  
  res.json(list);
});

app.get('/api/emails/:id', (req, res) => {
  const db = readDb();
  const email = db.emails.find(e => e.id === req.params.id);
  if (!email) return res.status(404).json({ error: 'Email not found' });
  
  const attachments = db.attachments.filter(a => a.emailId === email.id);
  const tasks = db.tasks.filter(t => t.emailId === email.id);
  
  res.json({ ...email, attachments, tasks });
});

app.put('/api/emails/:id', (req, res) => {
  const db = readDb();
  const index = db.emails.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Email not found' });
  
  const updatedEmail = { ...db.emails[index], ...req.body };
  db.emails[index] = updatedEmail;
  writeDb(db);
  res.json(updatedEmail);
});

// Force AI Re-Analysis on email
app.post('/api/emails/:id/analyze', async (req, res) => {
  const db = readDb();
  const email = db.emails.find(e => e.id === req.params.id);
  if (!email) return res.status(404).json({ error: 'Email not found' });

  logSystem('info', `Forcing manual AI Re-Analysis for email: "${email.subject}"`);
  
  try {
    const analysis = await analyzeEmailWithGemini(email.subject, email.body);
    const dbWithAnalysis = readDb();
    const emIdx = dbWithAnalysis.emails.findIndex(e => e.id === req.params.id);
    
    if (emIdx !== -1) {
      const fullAnalysis: AiAnalysis = {
        id: `ana_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        emailId: email.id,
        customerName: analysis.customerName || 'Unknown Contact',
        company: analysis.company || 'Unknown Company',
        project: analysis.project || 'General Project',
        subject: analysis.subject || email.subject,
        priority: analysis.priority || 'Medium',
        deadline: analysis.deadline,
        taskType: analysis.taskType || 'Review',
        requiredAction: analysis.requiredAction || 'Review requested action.',
        riskLevel: analysis.riskLevel || 'Low',
        waitingFor: analysis.waitingFor,
        nextAction: analysis.nextAction || 'Reply back',
        confidenceScore: analysis.confidenceScore || 90,
        aiSummary: analysis.aiSummary || 'Reparsed manually.',
        sentiment: analysis.sentiment || 'Neutral',
        category: analysis.category || 'General'
      };
      
      dbWithAnalysis.emails[emIdx].aiAnalysis = fullAnalysis;
      dbWithAnalysis.emails[emIdx].category = fullAnalysis.category as any;
      dbWithAnalysis.emails[emIdx].priority = fullAnalysis.priority;
      
      writeDb(dbWithAnalysis);
      logActivity('email', 'Email Reparsed via AI', `Manual AI triggering complete for "${email.subject}".`);
      return res.json(dbWithAnalysis.emails[emIdx]);
    }
    res.status(500).json({ error: 'Failed to update ledger records' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SIMULATE INCOMING EMAIL (Yahoo Mail Synchronization simulator!)
app.post('/api/emails/sync', async (req, res) => {
  const subjects = [
    'RFQ: Custom Aluminum CNC Spacers for robotics frame',
    'Avionics CAD drawing clearance review requested',
    'URGENT: Billing issue on transaction INV-2026-092',
    'Follow up regarding our scheduled meeting',
    'General Inquiry: Custom manufacturing availability'
  ];
  const bodies = [
    `Hi Team,\n\nWe need a quote for 500 units of custom Grade 6061-T6 Aluminum spacers. Tolerances should hold ±0.05mm. The project is "Robotic Flange Mount". Delivery within 2 weeks.\n\nBest,\nSarah Jenkins\nGlobal Aero Systems LLC`,
    `Hello! Please check our draft clearance angles for the aerospace chassis panel. We have revised step file v1.9. Attached instructions are inside.\n\nThanks,\nJames Henderson\nApex Industrial Engineering`,
    `Urgent billing problem—you charged us the old raw stock rate of $42/lb instead of $38/lb negotiated contract price on Invoice INV-2026-092. Please resolve asap!\n\nBest,\nJames Henderson\nApex Industrial Engineering`,
    `Hi there,\n\nConfirming our Teams call tomorrow at 10 AM PST. Looking forward to reviewing the drone housing CAD parameters.\n\nDr. Aaron Chen\nPrecision Robotics Lab`,
    `Hello Work OS,\n\nI am wondering what is your current standard production load for SLS 3D printing in nylon. We have a couple of prototype shells ready.\n\nSincerely,\nElena Rostova\nNexus Smart Utilities`
  ];
  const senders = [
    { name: 'Sarah Jenkins', email: 'sjenkins@globalaero.io' },
    { name: 'James Henderson', email: 'james.henderson@apexind.com' },
    { name: 'James Henderson', email: 'james.henderson@apexind.com' },
    { name: 'Aaron Chen', email: 'aaron.chen@pr-labs.edu' },
    { name: 'Elena Rostova', email: 'e.rostova@nexus-smart.com' }
  ];

  const randIdx = Math.floor(Math.random() * subjects.length);
  const sender = senders[randIdx];
  const subject = subjects[randIdx];
  const body = bodies[randIdx];

  const db = readDb();
  const newEmail: Email = {
    id: `em_sync_${Date.now()}`,
    senderName: sender.name,
    senderEmail: sender.email,
    subject,
    body,
    date: new Date().toISOString(),
    unread: true,
    starred: false,
    archived: false,
    spam: false,
    deleted: false,
    priority: 'Medium',
    category: 'General'
  };

  db.emails.unshift(newEmail);
  writeDb(db);
  
  logActivity('email', 'Synced New Yahoo Email', `Synchronized email "${subject}" from ${sender.name}.`);
  
  // Run our modular automation pipelines asynchronously!
  // This triggers AI Triage automatically!
  await runAutomationPipeline('New Email', newEmail);

  res.json({ message: 'Sync complete. Processed automated workflows.', email: newEmail });
});

// TASKS
app.get('/api/tasks', (req, res) => {
  const db = readDb();
  res.json(db.tasks);
});

app.post('/api/tasks', (req, res) => {
  const db = readDb();
  const newTask: Task = {
    id: `tsk_${Date.now()}`,
    checklist: [],
    tags: [],
    createdAt: new Date().toISOString(),
    ...req.body
  };
  
  db.tasks.unshift(newTask);
  writeDb(db);
  
  logActivity('task', 'Task Created', `Created task "${newTask.title}" manually.`, newTask.id);
  res.json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const db = readDb();
  const index = db.tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });
  
  const oldStatus = db.tasks[index].status;
  const updatedTask = { ...db.tasks[index], ...req.body };
  db.tasks[index] = updatedTask;
  writeDb(db);
  
  // If task status changed to completed, trigger any related automation triggers!
  if (req.body.status === 'Completed' && oldStatus !== 'Completed') {
    logActivity('task', 'Task Completed', `Completed task: "${updatedTask.title}"`, updatedTask.id);
    runAutomationPipeline('Task Completed', updatedTask);
  }
  
  res.json(updatedTask);
});

app.delete('/api/tasks/:id', (req, res) => {
  const db = readDb();
  const index = db.tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });
  
  const deletedTask = db.tasks[index];
  db.tasks.splice(index, 1);
  writeDb(db);
  
  logActivity('task', 'Task Deleted', `Removed task: "${deletedTask.title}"`);
  res.json({ success: true });
});

// CUSTOMERS
app.get('/api/customers', (req, res) => {
  const db = readDb();
  res.json(db.customers);
});

app.get('/api/customers/:id', (req, res) => {
  const db = readDb();
  const customer = db.customers.find(c => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  
  // Collate relation streams
  const emails = db.emails.filter(e => e.customerId === customer.id || e.senderEmail === customer.email);
  const projects = db.projects.filter(p => p.customerId === customer.id);
  const tasks = db.tasks.filter(t => t.customerId === customer.id);
  const meetings = db.meetings.filter(m => m.customerId === customer.id);
  const notes = db.notes.filter(n => n.customerId === customer.id);
  const files = db.files.filter(f => f.customerId === customer.id);
  
  // Timeline collation
  const timeline: any[] = [];
  emails.forEach(e => timeline.push({ type: 'Email', date: e.date, title: `Email: ${e.subject}`, subtitle: `From: ${e.senderName}` }));
  tasks.forEach(t => timeline.push({ type: 'Task', date: t.createdAt, title: `Task Scheduled: ${t.title}`, subtitle: `Priority: ${t.priority} | Status: ${t.status}` }));
  projects.forEach(p => timeline.push({ type: 'Project', date: p.startDate, title: `Project Initiated: ${p.name}`, subtitle: `Status: ${p.status}` }));
  meetings.forEach(m => timeline.push({ type: 'Meeting', date: m.date, title: `Meeting: ${m.title}`, subtitle: `Duration: ${m.duration} mins` }));
  
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  res.json({
    ...customer,
    emails,
    projects,
    tasks,
    meetings,
    notes,
    files,
    timeline
  });
});

app.post('/api/customers', (req, res) => {
  const db = readDb();
  const newCustomer: Customer = {
    id: `cust_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...req.body
  };
  
  db.customers.push(newCustomer);
  writeDb(db);
  
  logActivity('customer', 'New Customer Profile', `Created profile for "${newCustomer.company}".`);
  runAutomationPipeline('Customer Created', newCustomer);
  
  res.json(newCustomer);
});

app.put('/api/customers/:id', (req, res) => {
  const db = readDb();
  const idx = db.customers.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Customer not found' });
  
  db.customers[idx] = { ...db.customers[idx], ...req.body };
  writeDb(db);
  res.json(db.customers[idx]);
});

// PROJECTS
app.get('/api/projects', (req, res) => {
  const db = readDb();
  res.json(db.projects);
});

app.get('/api/projects/:id', (req, res) => {
  const db = readDb();
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  
  const customer = db.customers.find(c => c.id === project.customerId);
  const tasks = db.tasks.filter(t => t.projectId === project.id);
  const meetings = db.meetings.filter(m => m.projectId === project.id);
  const notes = db.notes.filter(n => n.projectId === project.id);
  const files = db.files.filter(f => f.projectId === project.id);
  
  res.json({
    ...project,
    customer,
    tasks,
    meetings,
    notes,
    files
  });
});

app.post('/api/projects', (req, res) => {
  const db = readDb();
  const newProject: Project = {
    id: `proj_${Date.now()}`,
    progress: 0,
    ...req.body
  };
  db.projects.push(newProject);
  writeDb(db);
  
  logActivity('project', 'Project Initiated', `Launched project "${newProject.name}" [${newProject.code}].`);
  res.json(newProject);
});

app.put('/api/projects/:id', (req, res) => {
  const db = readDb();
  const idx = db.projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  
  db.projects[idx] = { ...db.projects[idx], ...req.body };
  writeDb(db);
  res.json(db.projects[idx]);
});

// MEETINGS
app.get('/api/meetings', (req, res) => {
  const db = readDb();
  res.json(db.meetings);
});

app.post('/api/meetings', (req, res) => {
  const db = readDb();
  const newMeeting: Meeting = {
    id: `meet_${Date.now()}`,
    status: 'Scheduled',
    ...req.body
  };
  
  db.meetings.push(newMeeting);
  writeDb(db);
  
  logActivity('system', 'Meeting Scheduled', `Meeting scheduled: "${newMeeting.title}" on ${newMeeting.date.split('T')[0]}.`);
  res.json(newMeeting);
});

// FILES / ASSETS
app.get('/api/files', (req, res) => {
  const db = readDb();
  res.json(db.files);
});

// Auto-organization asset vault file upload simulation
app.post('/api/files/upload', (req, res) => {
  const { name, size, type, customerId, projectId } = req.body;
  const db = readDb();
  
  const customer = db.customers.find(c => c.id === customerId);
  const project = db.projects.find(p => p.id === projectId);
  
  // Auto pathing organization: /Vault/Customer_Name/Project_Code/File_Name
  const custNameClean = customer ? customer.company.replace(/[^a-zA-Z0-9]/g, '_') : 'General';
  const projCodeClean = project ? project.code : 'General';
  const vaultPath = `/Vault/${custNameClean}/${projCodeClean}/${name}`;
  
  const newFile: FileItem = {
    id: `fl_${Date.now()}`,
    name,
    size: size || '2.4 MB',
    type: type || 'PDF',
    customerId,
    projectId,
    path: vaultPath,
    uploadedAt: new Date().toISOString()
  };
  
  db.files.unshift(newFile);
  writeDb(db);
  
  logActivity('system', 'Vault File Synced', `File "${name}" auto-organized inside vault folder: "${custNameClean}/${projCodeClean}".`, newFile.id);
  res.json(newFile);
});

// ==========================================
// ENGINEERING WORKSPACE TRACKERS (API Endpoints)
// ==========================================

// RFQs
app.get('/api/engineering/rfqs', (req, res) => {
  const db = readDb();
  res.json(db.rfqs || []);
});

app.post('/api/engineering/rfqs', (req, res) => {
  const db = readDb();
  const { customerId, projectId, title, estimatedValue, targetDeliveryDate, drawingRef, notes } = req.body;
  
  const newRfq: Rfq = {
    id: `rfq_${Date.now()}`,
    rfqNumber: `RFQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    customerId,
    projectId: projectId || undefined,
    title,
    status: 'Pending',
    estimatedValue: Number(estimatedValue) || 0,
    targetDeliveryDate,
    drawingRef,
    notes,
    createdAt: new Date().toISOString()
  };
  
  if (!db.rfqs) db.rfqs = [];
  db.rfqs.unshift(newRfq);
  writeDb(db);
  
  logActivity('customer', 'RFQ Created', `RFQ ${newRfq.rfqNumber} ("${title}") created for customer.`, newRfq.id);
  createNotification('Task', 'New RFQ Ingested', `RFQ ${newRfq.rfqNumber} has been successfully added to tracking.`);
  res.json(newRfq);
});

app.put('/api/engineering/rfqs/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const index = (db.rfqs || []).findIndex(r => r.id === id);
  if (index !== -1) {
    db.rfqs[index] = { ...db.rfqs[index], ...req.body };
    writeDb(db);
    res.json(db.rfqs[index]);
  } else {
    res.status(404).json({ error: 'RFQ not found' });
  }
});

// Drawings
app.get('/api/engineering/drawings', (req, res) => {
  const db = readDb();
  res.json(db.drawings || []);
});

app.post('/api/engineering/drawings', (req, res) => {
  const db = readDb();
  const { drawingNumber, title, customerId, projectId, revision, status, fileType, fileName, fileSize } = req.body;
  
  const newDrawing: Drawing = {
    id: `dwg_${Date.now()}`,
    drawingNumber,
    title,
    customerId,
    projectId: projectId || undefined,
    revision: revision || 'A',
    status: status || 'In Review',
    fileType: fileType || 'PDF',
    fileName,
    fileSize: fileSize || '2.0 MB',
    updatedAt: new Date().toISOString()
  };
  
  if (!db.drawings) db.drawings = [];
  db.drawings.unshift(newDrawing);
  
  // Auto-log initial revision
  const newRev: DrawingRevision = {
    id: `rev_${Date.now()}`,
    drawingId: newDrawing.id,
    revision: newDrawing.revision,
    description: `Initial drawing upload: ${title}`,
    engineer: 'Lead Engineer',
    date: new Date().toISOString()
  };
  if (!db.revisions) db.revisions = [];
  db.revisions.unshift(newRev);
  
  writeDb(db);
  
  logActivity('project', 'Drawing Ingested', `Drawing ${drawingNumber} "${title}" uploaded under revision ${newDrawing.revision}.`, newDrawing.id);
  res.json(newDrawing);
});

app.put('/api/engineering/drawings/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const index = (db.drawings || []).findIndex(d => d.id === id);
  if (index !== -1) {
    const oldRev = db.drawings[index].revision;
    db.drawings[index] = { ...db.drawings[index], ...req.body, updatedAt: new Date().toISOString() };
    
    // If revision changed, log a new DrawingRevision automatically!
    if (req.body.revision && req.body.revision !== oldRev) {
      const newRev: DrawingRevision = {
        id: `rev_${Date.now()}`,
        drawingId: id,
        revision: req.body.revision,
        description: req.body.revisionNotes || `Drawing revised to ${req.body.revision}`,
        engineer: 'Lead Engineer',
        date: new Date().toISOString()
      };
      if (!db.revisions) db.revisions = [];
      db.revisions.unshift(newRev);
      logActivity('project', 'Drawing Revised', `Drawing ${db.drawings[index].drawingNumber} updated to Rev ${req.body.revision}.`, id);
    }
    
    writeDb(db);
    res.json(db.drawings[index]);
  } else {
    res.status(404).json({ error: 'Drawing not found' });
  }
});

app.post('/api/engineering/drawings/:id/approve', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const { status, approvedBy, approvalNotes } = req.body; // status: 'Approved' | 'Rejected'
  
  const index = (db.drawings || []).findIndex(d => d.id === id);
  if (index !== -1) {
    db.drawings[index].status = status;
    db.drawings[index].approvedBy = approvedBy || 'Lead Engineer';
    db.drawings[index].approvalDate = new Date().toISOString().split('T')[0];
    db.drawings[index].approvalNotes = approvalNotes || '';
    db.drawings[index].updatedAt = new Date().toISOString();
    
    writeDb(db);
    
    logActivity('project', `Drawing ${status}`, `Drawing ${db.drawings[index].drawingNumber} was ${status.toLowerCase()} by ${approvedBy}.`, id);
    createNotification('Alert', `Drawing Approval Status`, `Drawing ${db.drawings[index].drawingNumber} has been ${status}.`);
    res.json(db.drawings[index]);
  } else {
    res.status(404).json({ error: 'Drawing not found' });
  }
});

// Quotations
app.get('/api/engineering/quotations', (req, res) => {
  const db = readDb();
  res.json(db.quotations || []);
});

app.post('/api/engineering/quotations', (req, res) => {
  const db = readDb();
  const { rfqId, customerId, projectId, amount, validUntil, terms } = req.body;
  
  const newQuote: Quotation = {
    id: `qte_${Date.now()}`,
    quoteNumber: `QTE-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    rfqId,
    customerId,
    projectId: projectId || undefined,
    amount: Number(amount) || 0,
    status: 'Sent',
    validUntil,
    terms,
    createdAt: new Date().toISOString()
  };
  
  if (!db.quotations) db.quotations = [];
  db.quotations.unshift(newQuote);
  
  // Auto-transition RFQ status to 'Quoted'
  const rfqIndex = (db.rfqs || []).findIndex(r => r.id === rfqId);
  if (rfqIndex !== -1) {
    db.rfqs[rfqIndex].status = 'Quoted';
  }
  
  writeDb(db);
  
  logActivity('customer', 'Quotation Issued', `Quotation ${newQuote.quoteNumber} issued for RFQ ${rfqId}.`, newQuote.id);
  res.json(newQuote);
});

app.put('/api/engineering/quotations/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const index = (db.quotations || []).findIndex(q => q.id === id);
  if (index !== -1) {
    db.quotations[index] = { ...db.quotations[index], ...req.body };
    writeDb(db);
    res.json(db.quotations[index]);
  } else {
    res.status(404).json({ error: 'Quotation not found' });
  }
});

// Purchase Orders (POs)
app.get('/api/engineering/pos', (req, res) => {
  const db = readDb();
  res.json(db.purchaseOrders || []);
});

app.post('/api/engineering/pos', (req, res) => {
  const db = readDb();
  const { poNumber, quoteId, customerId, projectId, amount, deliveryDate, fileUrl } = req.body;
  
  const newPo: PurchaseOrder = {
    id: `po_${Date.now()}`,
    poNumber,
    quoteId,
    customerId,
    projectId: projectId || undefined,
    amount: Number(amount) || 0,
    status: 'Received',
    issueDate: new Date().toISOString().split('T')[0],
    deliveryDate,
    fileUrl,
    createdAt: new Date().toISOString()
  };
  
  if (!db.purchaseOrders) db.purchaseOrders = [];
  db.purchaseOrders.unshift(newPo);
  
  // Auto-transition Quotation to 'Accepted'
  const quoteIndex = (db.quotations || []).findIndex(q => q.id === quoteId);
  if (quoteIndex !== -1) {
    db.quotations[quoteIndex].status = 'Accepted';
  }
  
  writeDb(db);
  
  logActivity('customer', 'Purchase Order Logged', `PO ${poNumber} received from customer, linked to quote.`, newPo.id);
  createNotification('Task', 'New PO Received', `New Purchase Order ${poNumber} has been logged and production triggered.`);
  res.json(newPo);
});

app.put('/api/engineering/pos/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const index = (db.purchaseOrders || []).findIndex(p => p.id === id);
  if (index !== -1) {
    db.purchaseOrders[index] = { ...db.purchaseOrders[index], ...req.body };
    writeDb(db);
    res.json(db.purchaseOrders[index]);
  } else {
    res.status(404).json({ error: 'Purchase Order not found' });
  }
});

// Invoices
app.get('/api/engineering/invoices', (req, res) => {
  const db = readDb();
  res.json(db.invoices || []);
});

app.post('/api/engineering/invoices', (req, res) => {
  const db = readDb();
  const { poId, customerId, projectId, amount, dueDate } = req.body;
  
  const newInvoice: Invoice = {
    id: `inv_${Date.now()}`,
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    poId: poId || undefined,
    customerId,
    projectId: projectId || undefined,
    amount: Number(amount) || 0,
    status: 'Sent',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate,
    createdAt: new Date().toISOString()
  };
  
  if (!db.invoices) db.invoices = [];
  db.invoices.unshift(newInvoice);
  
  // Auto-transition PO to 'Invoiced'
  if (poId) {
    const poIndex = (db.purchaseOrders || []).findIndex(p => p.id === poId);
    if (poIndex !== -1) {
      db.purchaseOrders[poIndex].status = 'Invoiced';
    }
  }
  
  writeDb(db);
  
  logActivity('customer', 'Invoice Dispatched', `Invoice ${newInvoice.invoiceNumber} has been issued and dispatched.`, newInvoice.id);
  res.json(newInvoice);
});

app.put('/api/engineering/invoices/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const index = (db.invoices || []).findIndex(i => i.id === id);
  if (index !== -1) {
    db.invoices[index] = { ...db.invoices[index], ...req.body };
    writeDb(db);
    res.json(db.invoices[index]);
  } else {
    res.status(404).json({ error: 'Invoice not found' });
  }
});

// Revisions
app.get('/api/engineering/revisions', (req, res) => {
  const db = readDb();
  res.json(db.revisions || []);
});

// Engineering Change Requests (ECRs)
app.get('/api/engineering/ecrs', (req, res) => {
  const db = readDb();
  res.json(db.ecrs || []);
});

app.post('/api/engineering/ecrs', (req, res) => {
  const db = readDb();
  const { title, description, reason, priority, customerId, projectId, affectedDrawings, requestedBy } = req.body;
  
  const newEcr: Ecr = {
    id: `ecr_${Date.now()}`,
    ecrNumber: `ECR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    title,
    description,
    reason,
    priority: priority || 'Medium',
    status: 'In Review',
    customerId,
    projectId: projectId || undefined,
    affectedDrawings: affectedDrawings || [],
    requestedBy: requestedBy || 'Sarah Jenkins',
    createdAt: new Date().toISOString()
  };
  
  if (!db.ecrs) db.ecrs = [];
  db.ecrs.unshift(newEcr);
  writeDb(db);
  
  logActivity('project', 'ECR Logged', `Change Request ${newEcr.ecrNumber} ("${title}") logged as ${priority} priority.`, newEcr.id);
  createNotification('Alert', 'Engineering Change Request', `New ${priority} Priority ECR ${newEcr.ecrNumber} submitted for review.`);
  res.json(newEcr);
});

app.put('/api/engineering/ecrs/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const index = (db.ecrs || []).findIndex(e => e.id === id);
  if (index !== -1) {
    db.ecrs[index] = { ...db.ecrs[index], ...req.body };
    writeDb(db);
    res.json(db.ecrs[index]);
  } else {
    res.status(404).json({ error: 'ECR not found' });
  }
});

// AUTOMATION WORKFLOWS
app.get('/api/automations', (req, res) => {
  const db = readDb();
  res.json({
    pipelines: db.automations,
    logs: db.logs
  });
});

app.post('/api/automations/:id/toggle', (req, res) => {
  const db = readDb();
  const idx = db.automations.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Workflow not found' });
  
  db.automations[idx].active = req.body.active;
  writeDb(db);
  
  logSystem('info', `Workflow "${db.automations[idx].name}" active state toggled to: ${db.automations[idx].active}`);
  res.json(db.automations[idx]);
});

app.put('/api/automations/:id', (req, res) => {
  const db = readDb();
  const idx = db.automations.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Workflow not found' });
  
  db.automations[idx] = { ...db.automations[idx], ...req.body };
  writeDb(db);
  
  logSystem('info', `Workflow "${db.automations[idx].name}" active state updated to: ${db.automations[idx].active}`);
  res.json(db.automations[idx]);
});

app.post('/api/automations', (req, res) => {
  const db = readDb();
  const newWf: AutomationWorkflow = {
    id: `auto_${Date.now()}`,
    active: true,
    ...req.body
  };
  db.automations.push(newWf);
  writeDb(db);
  
  logSystem('info', `Created new automation workflow: "${newWf.name}"`);
  res.json(newWf);
});

// NOTES
app.get('/api/notes', (req, res) => {
  const db = readDb();
  res.json(db.notes);
});

app.post('/api/notes', (req, res) => {
  const db = readDb();
  const newNote: Note = {
    id: `nt_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...req.body
  };
  
  db.notes.unshift(newNote);
  writeDb(db);
  res.json(newNote);
});

app.put('/api/notes/:id', (req, res) => {
  const db = readDb();
  const idx = db.notes.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(440).json({ error: 'Note not found' });
  
  db.notes[idx] = {
    ...db.notes[idx],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  writeDb(db);
  res.json(db.notes[idx]);
});

app.delete('/api/notes/:id', (req, res) => {
  const db = readDb();
  const idx = db.notes.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Note not found' });
  
  db.notes.splice(idx, 1);
  writeDb(db);
  res.json({ success: true });
});

// FILES (POST upload replica)
app.post('/api/files', (req, res) => {
  const { name, size, type, customerId, projectId } = req.body;
  const db = readDb();
  
  const customer = db.customers.find(c => c.id === customerId);
  const project = db.projects.find(p => p.id === projectId);
  
  const custNameClean = customer ? customer.company.replace(/[^a-zA-Z0-9]/g, '_') : 'General';
  const projCodeClean = project ? project.code : 'General';
  const vaultPath = `/Vault/${custNameClean}/${projCodeClean}/${name}`;
  
  const newFile: FileItem = {
    id: `fl_${Date.now()}`,
    name,
    size: size || '1.4 MB',
    type: type || 'PDF',
    customerId,
    projectId,
    path: vaultPath,
    uploadedAt: new Date().toISOString()
  };
  
  db.files.unshift(newFile);
  writeDb(db);
  
  logActivity('system', 'Vault File Synced', `File "${name}" auto-organized inside vault folder: "${custNameClean}/${projCodeClean}".`, newFile.id);
  res.json(newFile);
});

// AI ASSISTANT CHAT
app.post('/api/assistant/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  
  const db = readDb();
  try {
    const reply = await getAiAssistantReply(message, {
      customers: db.customers,
      projects: db.projects,
      tasks: db.tasks,
      emails: db.emails
    });
    res.json({ reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// NOTIFICATIONS
app.get('/api/notifications', (req, res) => {
  const db = readDb();
  res.json(db.notifications);
});

app.put('/api/notifications/:id/read', (req, res) => {
  const db = readDb();
  const idx = db.notifications.findIndex(n => n.id === req.params.id);
  if (idx !== -1) {
    db.notifications[idx].status = 'Read';
    writeDb(db);
  }
  res.json({ success: true });
});

app.post('/api/notifications/read-all', (req, res) => {
  const db = readDb();
  db.notifications.forEach(n => n.status = 'Read');
  writeDb(db);
  res.json({ success: true });
});


// ==========================================
// BOOTSTRAP VITE DEVELOPMENT MIDDLEWARE
// ==========================================
async function startServer() {
  const PORT = 3000;
  
  // Serve dynamic Vite development assets when in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve compiled static dist resources
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Work OS Server] Live and running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
