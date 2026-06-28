/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Edit3, Trash2, Save, Tags, Users, Briefcase, ExternalLink, Sparkles 
} from 'lucide-react';

interface NotesHubProps {
  customers: any[];
  projects: any[];
}

export default function NotesHub({ customers, projects }: NotesHubProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for creating/editing
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [tags, setTags] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = () => {
    setLoading(true);
    fetch('/api/notes')
      .then(res => res.json())
      .then(data => {
        setNotes(data);
        if (data.length > 0 && !selectedNoteId) {
          selectNote(data[0]);
        }
      })
      .catch(err => console.error('Error fetching notes:', err))
      .finally(() => setLoading(false));
  };

  const selectNote = (note: any) => {
    setSelectedNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setCustomerId(note.customerId || '');
    setProjectId(note.projectId || '');
    setTags(note.tags ? note.tags.join(', ') : '');
  };

  const handleSaveNote = () => {
    const isNew = !selectedNoteId;
    const url = isNew ? '/api/notes' : `/api/notes/${selectedNoteId}`;
    const method = isNew ? 'POST' : 'PUT';

    const payload = {
      title,
      content,
      customerId: customerId || undefined,
      projectId: projectId || undefined,
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    };

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(saved => {
        fetchNotes();
        if (isNew) {
          setSelectedNoteId(saved.id);
        }
      })
      .catch(err => console.error('Error saving note:', err));
  };

  const handleDeleteNote = () => {
    if (!selectedNoteId) return;
    fetch(`/api/notes/${selectedNoteId}`, { method: 'DELETE' })
      .then(() => {
        setSelectedNoteId(null);
        setTitle('');
        setContent('');
        setCustomerId('');
        setProjectId('');
        setTags('');
        fetchNotes();
      })
      .catch(err => console.error('Error deleting note:', err));
  };

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setTitle('New Technical Blueprint');
    setContent('# Technical Specification\n\n- Material: Titanium Grade 5\n- CNC Tolerances: +/- 0.05mm\n- Finish: Bead Blasted\n\n## Delivery Roadmap\n- [ ] Draft drawing review\n- [ ] Client feedback loop\n- [ ] Release final quoting');
    setCustomerId('');
    setProjectId('');
    setTags('Blueprint, CAD');
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm h-[calc(100vh-140px)]">
      
      {/* Sidebar document links (4 cols) */}
      <div className="lg:col-span-4 border-r border-gray-50 flex flex-col h-full bg-white">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search Notion docs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl text-sm"
            />
          </div>
          <button
            onClick={handleNewNote}
            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
            title="Create Document"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Scroll list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredNotes.length > 0 ? (
            filteredNotes.map(n => {
              const active = n.id === selectedNoteId;
              return (
                <div
                  key={n.id}
                  onClick={() => selectNote(n)}
                  className={`p-4 cursor-pointer hover:bg-gray-50/40 transition flex items-start gap-3 ${active ? 'bg-blue-50/30 border-l-4 border-blue-500' : ''}`}
                >
                  <FileText className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{n.title}</h4>
                    <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{n.content.replace(/[#*`_-]/g, '')}</p>
                    {n.tags && n.tags.length > 0 && (
                      <div className="flex gap-1 pt-1.5 flex-wrap">
                        {n.tags.map((tg: string) => (
                          <span key={tg} className="text-[9px] px-1 bg-gray-100 text-gray-500 rounded">
                            #{tg}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-gray-400 text-xs">No documents listed.</div>
          )}
        </div>
      </div>

      {/* Notepad Editor area (8 cols) */}
      <div className="lg:col-span-8 flex flex-col h-full bg-white">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
          <div className="flex gap-2">
            <button
              onClick={handleSaveNote}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition text-xs font-bold shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              Save Document
            </button>
            {selectedNoteId && (
              <button
                onClick={handleDeleteNote}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition text-xs font-bold"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </div>
          <span className="text-[10px] text-gray-400 font-bold uppercase font-mono flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
            Workspace Autosaved
          </span>
        </div>

        {/* Form controls / linkages */}
        <div className="p-4 bg-gray-50/30 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-gray-500 block uppercase">Link Customer Account</label>
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg bg-white"
            >
              <option value="">Standalone (Internal)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.company}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-gray-500 block uppercase">Link Project File</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg bg-white"
            >
              <option value="">None</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-gray-500 block uppercase">Workspace Tags</label>
            <input
              type="text"
              placeholder="Blueprint, SLA, Metal"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg bg-white"
            />
          </div>
        </div>

        {/* Title and main content editor */}
        <div className="flex-1 p-6 flex flex-col space-y-4">
          <input
            type="text"
            required
            placeholder="Document title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full text-base font-bold text-gray-800 placeholder-gray-300 focus:outline-none border-b border-dashed border-gray-100 pb-2 focus:border-blue-300"
          />

          <textarea
            placeholder="Write technical specifications or markdown records here..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full flex-1 resize-none focus:outline-none text-xs text-gray-700 font-mono leading-relaxed"
          />
        </div>
      </div>

    </div>
  );
}
