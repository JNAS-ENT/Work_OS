import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { readDb, writeDb, logActivity, createNotification } from './db';
import { Meeting, Task, TaskChecklistItem } from '../src/types';

const router = express.Router();

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper to check for overlapping meetings
function checkMeetingClash(newMeeting: Partial<Meeting>, existingMeetings: Meeting[]): Meeting | null {
  if (!newMeeting.date || !newMeeting.duration) return null;
  
  const newStart = new Date(newMeeting.date).getTime();
  const newEnd = newStart + (newMeeting.duration * 60 * 1000);

  for (const m of existingMeetings) {
    if (m.id === newMeeting.id) continue;
    if (m.status !== 'Scheduled') continue;

    const mStart = new Date(m.date).getTime();
    const mEnd = mStart + (m.duration * 60 * 1000);

    // Overlap condition
    if (newStart < mEnd && newEnd > mStart) {
      return m;
    }
  }
  return null;
}

// ----------------------------------------------------
// MEETINGS CRUD ENDPOINTS
// ----------------------------------------------------

// Get all meetings
router.get('/meetings', (req, res) => {
  try {
    const db = readDb();
    res.json(db.meetings || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule meeting (with automatic clash detection)
router.post('/meetings', (req, res) => {
  try {
    const { title, description, date, duration, customerId, projectId, type, calendarId, attendees, notes } = req.body;
    if (!title || !date || !duration) {
      return res.status(400).json({ error: 'Title, date, and duration are required' });
    }

    const db = readDb();
    const existingMeetings = db.meetings || [];

    const newMeeting: Meeting = {
      id: `meet_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title,
      description: description || '',
      date,
      duration: Number(duration),
      customerId: customerId || undefined,
      projectId: projectId || undefined,
      type: type || 'Meeting',
      status: 'Scheduled',
      calendarId: calendarId || 'local',
      attendees: attendees || [],
      notes: notes || '',
      actionItemsExtracted: false
    };

    // Clash detection check
    const clashingWith = checkMeetingClash(newMeeting, existingMeetings);
    if (clashingWith) {
      // Create a system notification about the schedule conflict
      createNotification(
        'Alert', 
        'Calendar Conflict Detected', 
        `"${newMeeting.title}" clashes with existing meeting "${clashingWith.title}" scheduled for ${clashingWith.date.split('T')[1].substring(0, 5)}.`
      );
    }

    if (!db.meetings) db.meetings = [];
    db.meetings.push(newMeeting);
    writeDb(db);

    logActivity('system', 'Meeting Scheduled', `Meeting scheduled: "${newMeeting.title}" on ${newMeeting.date.split('T')[0]}.`);
    res.status(201).json({ meeting: newMeeting, clashWith: clashingWith });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update meeting details (including automatic clash detection on edit)
router.put('/meetings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();

    const idx = (db.meetings || []).findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Meeting not found' });

    const updatedMeeting = { ...db.meetings[idx], ...req.body };

    // Clash detection check on edit
    const clashingWith = checkMeetingClash(updatedMeeting, db.meetings);
    if (clashingWith) {
      createNotification(
        'Alert', 
        'Calendar Modification Conflict', 
        `Updated details for "${updatedMeeting.title}" clash with "${clashingWith.title}".`
      );
    }

    db.meetings[idx] = updatedMeeting;
    writeDb(db);

    res.json({ meeting: updatedMeeting, clashWith: clashingWith });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete meeting
router.delete('/meetings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();

    const idx = (db.meetings || []).findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Meeting not found' });

    const deletedTitle = db.meetings[idx].title;
    db.meetings.splice(idx, 1);
    writeDb(db);

    logActivity('system', 'Meeting Cancelled', `Meeting "${deletedTitle}" has been cancelled.`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// TWO-WAY GOOGLE CALENDAR SYNC SIMULATION
// ----------------------------------------------------
router.post('/meetings/sync', (req, res) => {
  try {
    const { provider } = req.body; // 'google' | 'outlook'
    const db = readDb();

    if (!db.meetings) db.meetings = [];

    // Simulate pulling 2 external calendar events
    const syncCount = 2;
    const syncTime = new Date().toISOString();
    
    const googleEvents: Meeting[] = [
      {
        id: `gcal_${Date.now()}_1`,
        title: 'Design Review: Mechanical Housing',
        description: 'Synced from Google Calendar. Project sync and manufacturing adjustments.',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T14:00:00.000Z',
        duration: 45,
        type: 'Review',
        status: 'Scheduled',
        calendarId: 'google',
        attendees: ['lead_eng@apex.com', 'pm@apex.com'],
        notes: 'Review draft housing blueprint versions.'
      },
      {
        id: `gcal_${Date.now()}_2`,
        title: 'Apex Client QBR Meeting',
        description: 'Synced from Google Calendar. Quarterly project planning.',
        date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T10:00:00.000Z',
        duration: 60,
        type: 'Meeting',
        status: 'Scheduled',
        calendarId: 'google',
        attendees: ['billing@apex.com', 'admin@apex.com'],
        notes: 'Discuss milestones, upcoming invoices, and RFQ delivery.'
      }
    ];

    let mergedCount = 0;
    googleEvents.forEach(gEvent => {
      // Check if duplicate already exists by title and date
      const duplicate = db.meetings.find(m => m.title === gEvent.title && m.date.substring(0, 16) === gEvent.date.substring(0, 16));
      if (!duplicate) {
        db.meetings.push(gEvent);
        mergedCount++;
        
        // Check for clashes
        const clash = checkMeetingClash(gEvent, db.meetings);
        if (clash) {
          createNotification(
            'Alert',
            'Synced Meeting Conflict',
            `Synced Google Event "${gEvent.title}" clashes with existing slot for "${clash.title}".`
          );
        }
      }
    });

    writeDb(db);
    logActivity('system', 'Calendar Synced', `Synchronized ${syncCount} Google Calendar events successfully.`);
    res.json({ success: true, syncedCount: syncCount, newlyMergedCount: mergedCount });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// AI CALENDAR ASSISTANT & SUMMARIES (GEMINI API)
// ----------------------------------------------------

// Generate Meeting Summary & Minutes via Gemini
router.post('/meetings/:id/generate-summary', async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();

    const meeting = db.meetings.find(m => m.id === id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    const rawNotes = meeting.notes || meeting.description || 'No notes currently recorded for this meeting.';

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Compile a highly professional, formatted executive meeting minutes document based on these raw discussion notes/transcripts:
-------------------------
Meeting Title: "${meeting.title}"
Type: "${meeting.type}"
Raw Notes: "${rawNotes}"
-------------------------

Your output should be beautifully organized in professional Markdown, and contain:
1. Executive Summary: High-level overview of the discussion (1 paragraph)
2. Strategic Insights: Key points, decisions finalized, and viewpoints raised
3. Critical Milestones: Important upcoming deadlines mentioned`,
      config: {
        systemInstruction: 'You are an Executive AI Secretary inside Work OS. You compile beautiful, highly professional meeting summaries and formatted minutes.'
      }
    });

    const aiMinutes = response.text || 'Failed to generate summary.';

    // Update meeting notes with generated minutes
    const idx = db.meetings.findIndex(m => m.id === id);
    if (idx !== -1) {
      db.meetings[idx].aiMinutes = aiMinutes;
      writeDb(db);
    }

    logActivity('system', 'AI Meeting Summary Generated', `Compiled smart meeting minutes and summary for: "${meeting.title}".`, id);
    res.json({ id, title: meeting.title, aiMinutes });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Extract Action Items & Automate Task Generation
router.post('/meetings/:id/extract-action-items', async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();

    const meeting = db.meetings.find(m => m.id === id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    const rawNotes = meeting.notes || meeting.description || meeting.aiMinutes || '';
    if (!rawNotes.trim()) {
      return res.status(400).json({ error: 'No meeting notes or transcription content found to extract action items from.' });
    }

    const prompt = `Analyze these meeting minutes/transcription and extract a list of clear actionable tasks (action items). 
-------------------------
Meeting: "${meeting.title}"
Content: "${rawNotes}"
-------------------------

For each action item, extract:
1. Title (What needs to be done)
2. Detailed Description (Background, requirements)
3. Assignee (Full name of the person responsible, or general "Unassigned")
4. Priority ("High" | "Medium" | "Low" based on the urgency)
5. DaysToDue (Number of days from today this task should be completed)

Return your output strictly as a JSON array matching this schema:
[
  {
    "title": "Task title",
    "description": "Background description",
    "assignedTo": "Assignee name",
    "priority": "High",
    "daysToDue": 5
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: 'You are a Workload Automation Specialist. Extract action items from text and structure them strictly as a valid JSON array.'
      }
    });

    const items = JSON.parse(response.text || '[]');
    const createdTasks: Task[] = [];

    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (item.daysToDue || 3));

        const newTask: Task = {
          id: `task_meet_auto_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: item.title,
          description: `${item.description || ''}\n\n[Auto-extracted from Meeting: "${meeting.title}"]`,
          customerId: meeting.customerId,
          projectId: meeting.projectId,
          priority: item.priority || 'Medium',
          status: 'Pending',
          dueDate: dueDate.toISOString().split('T')[0],
          assignedTo: item.assignedTo || 'Lead Engineer',
          checklist: [],
          tags: ['Meeting Action', meeting.type],
          createdAt: new Date().toISOString()
        };

        db.tasks.unshift(newTask);
        createdTasks.push(newTask);
      });

      // Update meeting extraction state
      const mIdx = db.meetings.findIndex(m => m.id === id);
      if (mIdx !== -1) {
        db.meetings[mIdx].actionItemsExtracted = true;
      }

      writeDb(db);
    }

    logActivity('system', 'AI Meeting Actions Extracted', `Extracted and automated ${createdTasks.length} task(s) directly from meeting discussion: "${meeting.title}".`);
    res.json({ success: true, createdTasks });

  } catch (error: any) {
    console.error('AI Meeting Action Items Extraction Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI Smart Scheduling Engine (analyzes calendars and finds free slots)
router.post('/meetings/schedule-ai', async (req, res) => {
  try {
    const { preferredDate, duration, type, description } = req.body;
    if (!preferredDate || !duration) {
      return res.status(400).json({ error: 'preferredDate and duration are required' });
    }

    const db = readDb();
    const existingMeetings = db.meetings || [];

    const dateStr = preferredDate.split('T')[0];
    
    // Compile existing scheduled times for that date
    const formattedSchedules = existingMeetings
      .filter(m => m.date.startsWith(dateStr) && m.status === 'Scheduled')
      .map(m => `Slot: ${m.date.split('T')[1].substring(0, 5)} (${m.duration} mins) - "${m.title}"`);

    const prompt = `You are an expert AI Scheduler inside Work OS. 
We are booking a new meeting on ${dateStr} with a duration of ${duration} minutes.
The meeting type is ${type || 'Meeting'} and description is: "${description || 'None'}".

Here are the existing booked slots on that date:
-------------------------
${formattedSchedules.length > 0 ? formattedSchedules.join('\n') : 'No meetings booked. Entire day is free.'}
-------------------------

Please recommend the 3 best clashing-free slots for this new meeting. Business hours are strictly 09:00 to 18:00 (UTC).
Consider typical break times and avoid back-to-back overlaps.

Return your recommendation as a clean JSON object with this schema:
{
  "recommendations": [
    {
      "time": "HH:MM",
      "reason": "Brief explanation why this is a perfect slot (e.g., clashing-free, optimal spacing)"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: 'You are an AI Smart Calendar Scheduling Consultant. You find optimal slots and output strictly styled JSON objects.'
      }
    });

    const recommendations = JSON.parse(response.text || '{"recommendations": []}');
    res.json(recommendations);

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
