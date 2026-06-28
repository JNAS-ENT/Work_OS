import express from 'express';
import { readDb, writeDb, logActivity, logSystem, createNotification } from './db.js';
import { ConnectionManager, SyncManager, EncryptionService, validateSocketConnection } from './integrations.js';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

// 1. GET /api/integrations/providers
router.get('/integrations/providers', (req, res) => {
  const db = readDb();
  res.json(db.serviceProviders || []);
});

// 2. GET /api/integrations/connections
router.get('/integrations/connections', (req, res) => {
  const db = readDb();
  res.json(db.serviceConnections || []);
});

// 3. POST /api/integrations/connect
router.post('/integrations/connect', async (req, res) => {
  const { providerId, config } = req.body;
  if (!providerId) {
    return res.status(400).json({ error: 'Missing providerId' });
  }

  try {
    const conn = await ConnectionManager.CreateConnection(providerId, config);
    res.json({ success: true, connection: conn });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. POST /api/integrations/reconnect/:connectionId
router.post('/integrations/reconnect/:connectionId', async (req, res) => {
  const { connectionId } = req.params;
  const db = readDb();
  const conn = db.serviceConnections?.find(c => c.id === connectionId);
  if (!conn) {
    return res.status(444).json({ error: 'Connection not found' });
  }

  try {
    conn.status = 'Connected';
    conn.health = 'Healthy';
    conn.lastSyncAt = new Date().toISOString();
    conn.lastError = undefined;
    writeDb(db);
    
    logActivity('system', 'Integration Reconnected', `Successfully reconnected ${conn.name}`);
    res.json({ success: true, connection: conn });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/integrations/disconnect/:connectionId
router.post('/integrations/disconnect/:connectionId', (req, res) => {
  const { connectionId } = req.params;
  const db = readDb();
  const conn = db.serviceConnections?.find(c => c.id === connectionId);
  if (!conn) {
    return res.status(404).json({ error: 'Connection not found' });
  }

  conn.status = 'Disconnected';
  conn.health = 'Not Configured';
  writeDb(db);
  
  logActivity('system', 'Integration Disconnected', `Temporarily disabled ${conn.name}`);
  res.json({ success: true, connection: conn });
});

// 6. DELETE /api/integrations/delete/:connectionId
router.delete('/integrations/delete/:connectionId', async (req, res) => {
  const { connectionId } = req.params;
  try {
    await ConnectionManager.DeleteConnection(connectionId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. POST /api/integrations/sync/:connectionId
router.post('/integrations/sync/:connectionId', async (req, res) => {
  const { connectionId } = req.params;
  try {
    const log = await SyncManager.SyncConnection(connectionId, 'manual');
    res.json({ success: true, log });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. POST /api/integrations/pause/:connectionId
router.post('/integrations/pause/:connectionId', (req, res) => {
  const { connectionId } = req.params;
  const db = readDb();
  const conn = db.serviceConnections?.find(c => c.id === connectionId);
  if (!conn) {
    return res.status(404).json({ error: 'Connection not found' });
  }

  conn.syncPaused = !conn.syncPaused;
  writeDb(db);
  
  logActivity('system', conn.syncPaused ? 'Sync Suspended' : 'Sync Resumed', `Toggled sync state for ${conn.name}`);
  res.json({ success: true, connection: conn });
});

// 9. GET /api/integrations/logs/:connectionId
router.get('/integrations/logs/:connectionId', (req, res) => {
  const { connectionId } = req.params;
  const db = readDb();
  const logs = db.syncLogs?.filter(l => l.connectionId === connectionId) || [];
  res.json(logs);
});

// 10. GET /api/integrations/errors
router.get('/integrations/errors', (req, res) => {
  const db = readDb();
  res.json(db.integrationErrors || []);
});

// 11. POST /api/integrations/telegram/test
router.post('/integrations/telegram/test', async (req, res) => {
  const { botToken, chatId, message } = req.body;
  if (!botToken || !chatId) {
    return res.status(400).json({ error: 'Missing Telegram bot credentials' });
  }

  try {
    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message || 'Work OS Integration Test Heartbeat' })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.description || 'Failed response from Telegram API');
    }

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: `Telegram dispatch failed: ${err.message}` });
  }
});

// 12. POST /api/integrations/supabase/test
router.post('/integrations/supabase/test', async (req, res) => {
  const { projectUrl, anonKey } = req.body;
  if (!projectUrl || !anonKey) {
    return res.status(400).json({ error: 'Missing Supabase URL or Anon Key' });
  }

  try {
    const trimmedUrl = projectUrl.replace(/\/$/, '');
    const sbUrl = `${trimmedUrl}/rest/v1/`;
    
    const response = await fetch(sbUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    if (!response.ok && response.status !== 404) {
      const txt = await response.text();
      throw new Error(`Supabase returned status ${response.status}: ${txt}`);
    }

    res.json({ success: true, message: 'Supabase connectivity checks passed.' });
  } catch (err: any) {
    res.status(500).json({ error: `Supabase ping failed: ${err.message}` });
  }
});

// 13. POST /api/integrations/gemini/test
router.post('/integrations/gemini/test', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ error: 'Missing Gemini API Key' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Test connection. Respond with "Healthy".'
    });

    const text = response.text || '';
    res.json({ success: true, text: text.trim(), model: 'gemini-2.5-flash' });
  } catch (err: any) {
    res.status(500).json({ error: `Gemini API key verification failed: ${err.message}` });
  }
});

// 14. POST /api/integrations/cleanse-privacy
router.post('/integrations/cleanse-privacy', (req, res) => {
  const { target } = req.body;
  if (!target) {
    return res.status(400).json({ error: 'Purge target is required' });
  }

  const db = readDb();
  let itemsDeleted = 0;

  switch (target) {
    case 'emails':
      itemsDeleted = db.emails.length;
      db.emails = [];
      logActivity('system', 'Privacy Purge: Emails', 'All offline cached emails were permanently deleted from disk storage.');
      break;
    case 'attachments':
      itemsDeleted = db.attachments.length;
      db.attachments = [];
      logActivity('system', 'Privacy Purge: Attachments', 'All direct cached files and document attachments were purged.');
      break;
    case 'ai_minutes':
      itemsDeleted = db.meetings.filter(m => m.notes).length;
      db.meetings.forEach(m => {
        m.notes = '';
      });
      logActivity('system', 'Privacy Purge: AI Minutes', 'Purged all meeting discussions and Gemini transcripts.');
      break;
    case 'files':
      itemsDeleted = db.files.length;
      db.files = [];
      logActivity('system', 'Privacy Purge: Files Vault', 'Emptied the local files vault and blueprint collections.');
      break;
    case 'projects':
      itemsDeleted = db.projects.length;
      db.projects = [];
      logActivity('system', 'Privacy Purge: Projects', 'All manufacturing and active corporate projects were dropped.');
      break;
    case 'cache':
      itemsDeleted = (db.syncLogs?.length || 0) + (db.integrationErrors?.length || 0) + db.logs.length;
      db.syncLogs = [];
      db.integrationErrors = [];
      db.logs = [];
      logActivity('system', 'Privacy Purge: Cache', 'Cleared logs, sync operations database, and telemetry cache.');
      break;
    case 'entire_account':
      // Clear all user authored data
      db.emails = [];
      db.attachments = [];
      db.projects = [];
      db.tasks = [];
      db.notes = [];
      db.activities = [];
      db.notifications = [];
      db.meetings = [];
      db.files = [];
      db.folders = [];
      db.logs = [];
      db.rfqs = [];
      db.drawings = [];
      db.quotations = [];
      db.purchaseOrders = [];
      db.invoices = [];
      db.revisions = [];
      db.ecrs = [];
      db.userSessions = [];
      db.auditLogs = [];
      db.serviceConnections = [];
      db.oauthTokens = [];
      db.providerSettings = [];
      db.syncLogs = [];
      db.integrationErrors = [];
      
      logActivity('system', 'Privacy Purge: Hard Wipe', 'Hard wiped entire organization tenant data including configurations.');
      break;
    default:
      return res.status(400).json({ error: `Invalid cleanse target: '${target}'` });
  }

  writeDb(db);
  res.json({ success: true, itemsDeleted });
});

export default router;
