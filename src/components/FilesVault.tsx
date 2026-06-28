import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Plus, Search, Folder, FolderPlus, FolderOpen, Download, Eye, Layers, ZoomIn, ZoomOut, 
  RotateCw, RefreshCw, Upload, ShieldCheck, CheckCircle, ChevronRight, Home, ArrowLeftRight, 
  Trash2, Edit3, Share2, ExternalLink, Lock, ShieldAlert, Send, Sparkles, Bot, AlertTriangle, X
} from 'lucide-react';
import { FileItem, Folder as FolderType, Customer, Project } from '../types';

interface FilesVaultProps {
  customers: Customer[];
  projects: Project[];
}

export default function FilesVault({ customers, projects }: FilesVaultProps) {
  // Navigation states
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [storageProvider, setStorageProvider] = useState<'local' | 'gdrive' | 'onedrive'>('local');
  
  // Data states
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncingDrive, setSyncingDrive] = useState(false);
  
  // Dialog / Edit states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [itemToMove, setItemToMove] = useState<{ id: string; type: 'file' | 'folder' } | null>(null);
  const [moveDestFolderId, setMoveDestFolderId] = useState<string | null>(null);
  
  // Upload states
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI states
  const [analyzing, setAnalyzing] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  // Viewer simulation variables
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    fetchData();
  }, [storageProvider]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [filesRes, foldersRes] = await Promise.all([
        fetch('/api/files'),
        fetch('/api/folders')
      ]);
      const filesData = await filesRes.json();
      const foldersData = await foldersRes.json();
      
      // Filter based on provider
      const providerFiles = filesData.filter((f: any) => f.provider === storageProvider);
      const providerFolders = foldersData.filter((f: any) => f.provider === storageProvider);
      
      setFiles(providerFiles);
      setFolders(providerFolders);

      if (providerFiles.length > 0 && !selectedFileId) {
        setSelectedFileId(providerFiles[0].id);
      } else if (providerFiles.length === 0) {
        setSelectedFileId(null);
      }
    } catch (err) {
      console.error('Error fetching vault data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // FOLDER CRUD & NAVIGATION
  // ----------------------------------------------------
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentFolderId: currentFolderId,
          provider: storageProvider,
          customerId: customers[0]?.id,
          projectId: projects[0]?.id
        })
      });

      if (res.ok) {
        setNewFolderName('');
        setShowCreateFolder(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error creating folder:', err);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const confirmed = window.confirm('Are you sure you want to permanently delete this folder and ALL its contents? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
      if (res.ok) {
        if (currentFolderId === folderId) {
          setCurrentFolderId(null);
        }
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    const confirmed = window.confirm('Are you sure you want to permanently delete this file?');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedFileId === fileId) {
          setSelectedFileId(null);
        }
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  const handleMoveItem = async () => {
    if (!itemToMove) return;
    try {
      const endpoint = itemToMove.type === 'file' ? `/api/files/${itemToMove.id}` : `/api/folders/${itemToMove.id}`;
      const payload = itemToMove.type === 'file' ? { folderId: moveDestFolderId } : { parentFolderId: moveDestFolderId };

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowMoveDialog(false);
        setItemToMove(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error moving item:', err);
    }
  };

  // Breadcrumbs calculation
  const getBreadcrumbs = () => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Root' }];
    if (!currentFolderId) return crumbs;

    const pathList: { id: string; name: string }[] = [];
    let currId = currentFolderId;
    let safety = 0;

    while (currId && safety < 10) {
      const f = folders.find(folder => folder.id === currId);
      if (f) {
        pathList.unshift({ id: f.id, name: f.name });
        currId = f.parentFolderId || '';
      } else {
        break;
      }
      safety++;
    }

    return [...crumbs, ...pathList];
  };

  // Filter lists based on current directory
  const currentFolders = folders.filter(f => f.parentFolderId === currentFolderId);
  const currentFiles = files.filter(f => f.folderId === currentFolderId);

  // ----------------------------------------------------
  // REAL DRAG & DROP FILE UPLOAD
  // ----------------------------------------------------
  const handleFileUpload = async (fileObj: File) => {
    setUploadProgress(10);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const typeMap: Record<string, string> = {
        'application/pdf': 'PDF',
        'image/png': 'Image',
        'image/jpeg': 'Image',
        'image/jpg': 'Image',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
        'application/zip': 'ZIP'
      };

      const fileType = typeMap[fileObj.type] || 'Other';
      
      const payload = {
        name: fileObj.name,
        type: fileType,
        size: `${(fileObj.size / (1024 * 1024)).toFixed(1)} MB`,
        customerId: customers[0]?.id,
        projectId: projects[0]?.id,
        folderId: currentFolderId,
        provider: storageProvider,
        content: content
      };

      setUploadProgress(60);

      try {
        const res = await fetch('/api/files/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const newFile = await res.json();
          setUploadProgress(100);
          setTimeout(() => {
            setUploadProgress(null);
            fetchData();
            setSelectedFileId(newFile.id);
          }, 500);
        }
      } catch (err) {
        console.error('Upload failed:', err);
        setUploadProgress(null);
      }
    };

    reader.readAsDataURL(fileObj);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // ----------------------------------------------------
  // GOOGLE DRIVE SYNC FLOW
  // ----------------------------------------------------
  const handleGoogleDriveSync = async () => {
    setSyncingDrive(true);
    try {
      const res = await fetch('/api/meetings/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google' })
      });
      if (res.ok) {
        alert('Google Drive Document Index successfully synced! Sync complete.');
        fetchData();
      }
    } catch (err) {
      console.error('Error syncing drive:', err);
    } finally {
      setSyncingDrive(false);
    }
  };

  // ----------------------------------------------------
  // AI DOCUMENT INTELLIGENCE
  // ----------------------------------------------------
  const selectedFile = files.find(f => f.id === selectedFileId);
  const fileCustomer = selectedFile ? customers.find(c => c.id === selectedFile.customerId) : null;
  const fileProject = selectedFile ? projects.find(p => p.id === selectedFile.projectId) : null;

  const handleAnalyzeDocument = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setChatHistory([]); // Reset chat history for new doc
    try {
      const res = await fetch(`/api/files/${selectedFile.id}/analyze`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error analyzing document:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedFile || chatLoading) return;

    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch(`/api/files/${selectedFile.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, chatHistory })
      });
      const data = await res.json();
      if (res.ok) {
        setChatHistory(prev => [...prev, { role: 'model', text: data.reply }]);
      }
    } catch (err) {
      console.error('Error in doc chat:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleShareFile = async () => {
    if (!selectedFile) return;
    try {
      const res = await fetch(`/api/files/${selectedFile.id}/share`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Secure share link generated:\n${window.location.origin}${data.secureShareUrl}`);
        fetchData();
      }
    } catch (err) {
      console.error('Error sharing file:', err);
    }
  };

  // Filter list search query (recursively searchable across all folders/files)
  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm h-[calc(100vh-140px)]">
      
      {/* LEFT COLUMN: PROVIDER SELECTOR & FILE EXPLORER (4 cols) */}
      <div className="lg:col-span-4 border-r border-gray-100 flex flex-col h-full bg-white">
        
        {/* Storage Provider Tabs */}
        <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50/50 p-1">
          <button
            onClick={() => { setStorageProvider('local'); setCurrentFolderId(null); }}
            className={`py-2 text-[11px] font-bold rounded-lg transition ${storageProvider === 'local' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Local OS Vault
          </button>
          <button
            onClick={() => { setStorageProvider('gdrive'); setCurrentFolderId(null); }}
            className={`py-2 text-[11px] font-bold rounded-lg transition ${storageProvider === 'gdrive' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Google Drive
          </button>
          <button
            onClick={() => { setStorageProvider('onedrive'); setCurrentFolderId(null); }}
            className={`py-2 text-[11px] font-bold rounded-lg transition ${storageProvider === 'onedrive' ? 'bg-white shadow-sm text-cyan-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            OneDrive
          </button>
        </div>

        {/* Search & Tool Bar */}
        <div className="p-3 border-b border-gray-50 flex items-center gap-1.5 bg-white">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search drawings & records..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg text-xs"
            />
          </div>
          
          <button
            onClick={() => setShowCreateFolder(true)}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            title="Create Folder"
          >
            <FolderPlus className="h-4 w-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            title="Upload File"
          >
            <Upload className="h-4 w-4" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelectChange} 
            className="hidden" 
          />
        </div>

        {/* Sync panel for Google Drive */}
        {storageProvider === 'gdrive' && (
          <div className="p-3 bg-green-50/50 border-b border-green-100 flex items-center justify-between text-xs">
            <span className="font-bold text-green-800 flex items-center gap-1">
              <Bot className="h-3.5 w-3.5 animate-bounce text-green-600" />
              Drive synchronization slot active
            </span>
            <button
              onClick={handleGoogleDriveSync}
              disabled={syncingDrive}
              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-[10px] transition flex items-center gap-1"
            >
              {syncingDrive ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Sync Now
            </button>
          </div>
        )}

        {/* Sync panel for OneDrive */}
        {storageProvider === 'onedrive' && (
          <div className="p-3 bg-cyan-50/40 border-b border-cyan-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-cyan-800 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Direct OneDrive API connection offline
            </span>
            <button
              onClick={() => alert('OneDrive OAuth secret scopes must be authorized in AI Settings to synchronize production records.')}
              className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-bold text-[9px] uppercase"
            >
              Connect
            </button>
          </div>
        )}

        {/* Folder Breadcrumbs */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1 overflow-x-auto text-[11px] text-gray-500 font-medium">
          {getBreadcrumbs().map((crumb, idx) => (
            <React.Fragment key={crumb.id || 'root'}>
              {idx > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" />}
              <button
                onClick={() => setCurrentFolderId(crumb.id)}
                className={`hover:text-blue-600 truncate max-w-[80px] shrink-0 font-bold ${idx === getBreadcrumbs().length - 1 ? 'text-gray-900' : ''}`}
              >
                {crumb.id === null ? <Home className="h-3 w-3 inline" /> : crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Create Folder Mini-Form Dialog */}
        {showCreateFolder && (
          <form onSubmit={handleCreateFolder} className="p-3 bg-blue-50/50 border-b border-blue-100 flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter folder name..."
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              className="flex-1 px-2.5 py-1 border border-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded text-xs bg-white"
              autoFocus
            />
            <button type="submit" className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 shrink-0">
              Create
            </button>
            <button type="button" onClick={() => setShowCreateFolder(false)} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </form>
        )}

        {/* Active Ingress Progress Bar */}
        {uploadProgress !== null && (
          <div className="p-3 bg-blue-50 border-b border-blue-100 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-blue-800">
              <span className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Encrypting & Writing Hash to Vault...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}

        {/* Drag & Drop Upload Zone + Directories / Files Scroll List */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 overflow-y-auto divide-y divide-gray-50 relative ${dragOver ? 'bg-blue-50/50 border-2 border-dashed border-blue-400' : ''}`}
        >
          {dragOver && (
            <div className="absolute inset-0 bg-blue-50/80 flex flex-col items-center justify-center text-center p-6 pointer-events-none z-10 animate-pulse">
              <Upload className="h-10 w-10 text-blue-500 mb-2 stroke-1" />
              <p className="text-xs font-bold text-blue-800">Drop files to upload instantly</p>
              <p className="text-[10px] text-blue-500">Calculates SHA-256 and writes to secure filesystem</p>
            </div>
          )}

          {/* Render Folders First */}
          {currentFolders.map(folder => (
            <div
              key={folder.id}
              className="p-3 hover:bg-gray-50/80 transition flex items-center justify-between group cursor-pointer"
              onClick={() => setCurrentFolderId(folder.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                  <Folder className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-gray-800 truncate leading-snug">{folder.name}</h4>
                  <p className="text-[9px] text-gray-400 font-medium">Directory Folder</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => { setItemToMove({ id: folder.id, type: 'folder' }); setMoveDestFolderId(null); setShowMoveDialog(true); }}
                  className="p-1 text-gray-400 hover:text-blue-600"
                  title="Move Folder"
                >
                  <ArrowLeftRight className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete Folder"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Render Files */}
          {currentFiles.length > 0 || currentFolders.length > 0 ? (
            currentFiles.map(file => {
              const active = file.id === selectedFileId;
              const typeIcon = file.type === 'PDF' ? '📄' : file.type === 'CAD' || file.type === 'STEP' ? '📐' : '📦';
              return (
                <div
                  key={file.id}
                  onClick={() => {
                    setSelectedFileId(file.id);
                    setZoom(1);
                    setRotation(0);
                  }}
                  className={`p-3 cursor-pointer hover:bg-gray-50/40 transition flex items-center justify-between group ${active ? 'bg-blue-50/30 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-1.5 text-xs rounded border ${active ? 'bg-blue-100 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                      {typeIcon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate leading-snug">{file.name}</h4>
                      <p className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5">{file.type} • {file.size}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { setItemToMove({ id: file.id, type: 'file' }); setMoveDestFolderId(null); setShowMoveDialog(true); }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Move File"
                    >
                      <ArrowLeftRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete File"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-24 text-gray-400 text-xs">
              <FolderOpen className="h-8 w-8 text-gray-200 mx-auto mb-2 stroke-1" />
              No folders or files synced in this directory.
              <p className="text-[10px] text-gray-400 mt-1">Drag files here to upload instantly</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CAD VIEWPORT & AI ANALYSIS DASHBOARD (8 cols) */}
      <div className="lg:col-span-8 flex flex-col md:grid md:grid-cols-12 h-full bg-gray-950 text-white relative">
        {selectedFile ? (
          <>
            {/* VIEWPORT CONTROLS & VIEWER PANEL (md:col-span-7) */}
            <div className="md:col-span-7 flex flex-col h-full border-r border-gray-900 justify-between">
              
              {/* Context Header */}
              <div className="bg-gray-950 p-3 border-b border-gray-900 flex justify-between items-center">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-xs font-bold truncate text-gray-100">{selectedFile.name}</h3>
                    <span className="text-[9px] font-mono px-1.5 bg-gray-900 text-gray-400 border border-gray-800 rounded-full font-bold uppercase">
                      {selectedFile.type}
                    </span>
                  </div>
                  <div className="flex gap-2 text-[9px] text-gray-400">
                    {fileCustomer && <span>🏢 {fileCustomer.company}</span>}
                    {fileProject && <span>• ⚙️ {fileProject.name}</span>}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => setZoom(z => Math.min(z + 0.25, 2.5))}
                    className="p-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 rounded transition"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                    className="p-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 rounded transition"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => setRotation(r => r + 90)}
                    className="p-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 rounded transition"
                    title="Rotate Viewport"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Vector Schematics Blueprint Stage */}
              <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative min-h-[220px]">
                <div 
                  className="transition-transform duration-300 border border-gray-800 bg-gray-900 rounded-2xl p-4 shadow-2xl relative flex items-center justify-center"
                  style={{ 
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    width: '260px',
                    height: '260px'
                  }}
                >
                  {selectedFile.type === 'CAD' || selectedFile.type === 'STEP' ? (
                    <div className="w-full h-full border border-dashed border-purple-500/20 rounded flex flex-col justify-between p-3 relative font-mono text-[8px] text-purple-400">
                      <span className="absolute top-2 left-2 text-[8px] font-bold text-gray-600">3D STEP MODEL ACTIVE</span>
                      <svg className="w-full h-full opacity-50" viewBox="0 0 100 100">
                        <polygon points="50,15 85,35 85,65 50,85 15,65 15,35" fill="none" stroke="#a855f7" strokeWidth="1" />
                        <line x1="50" y1="15" x2="50" y2="85" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="2" />
                        <line x1="15" y1="35" x2="85" y2="65" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="2" />
                        <line x1="85" y1="35" x2="15" y2="65" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="2" />
                        <circle cx="50" cy="50" r="12" fill="none" stroke="#a855f7" strokeWidth="1" />
                      </svg>
                      <span className="absolute bottom-2 right-2 text-[7px] text-gray-600">SOLIDWORKS COMPATIBLE</span>
                    </div>
                  ) : selectedFile.type === 'Image' ? (
                    <div className="w-full h-full border border-dashed border-emerald-500/20 rounded flex flex-col justify-between p-3 relative font-mono text-[8px] text-emerald-400">
                      <span className="absolute top-2 left-2 text-[8px] font-bold text-gray-600">SECURE IMAGE VIEWPORT</span>
                      <div className="w-full h-full flex items-center justify-center opacity-70">
                        <FileText className="h-10 w-10 text-emerald-500" />
                      </div>
                      <span className="absolute bottom-2 right-2 text-[7px] text-gray-600">VAULT PREVIEW</span>
                    </div>
                  ) : (
                    <div className="w-full h-full border border-dashed border-blue-500/20 rounded flex flex-col justify-between p-3 relative font-mono text-[8px] text-blue-400">
                      <span className="absolute top-2 left-2 text-[8px] font-bold text-gray-600">SECURE OS PDF SCHEMATIC</span>
                      <svg className="w-full h-full opacity-50" viewBox="0 0 100 100">
                        <rect x="25" y="25" width="50" height="50" rx="3" fill="none" stroke="#3b82f6" strokeWidth="1" />
                        <circle cx="50" cy="50" r="12" fill="none" stroke="#3b82f6" strokeWidth="1" />
                        <line x1="10" y1="50" x2="90" y2="50" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="1,2" />
                        <line x1="50" y1="10" x2="50" y2="90" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="1,2" />
                      </svg>
                      <span className="absolute bottom-2 right-2 text-[7px] text-gray-600">ORTHOGRAPHIC SCHEMA</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Integrity & Share Control Footer */}
              <div className="bg-gray-900 p-3 border-t border-gray-800 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span className="truncate max-w-full font-mono">SHA-256: {selectedFile.hash || 'Verified'}</span>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={handleShareFile}
                    className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded text-xs transition flex items-center justify-center gap-1 font-bold"
                  >
                    <Share2 className="h-3 w-3" />
                    Share Link
                  </button>
                  <a
                    href="#"
                    onClick={e => { e.preventDefault(); alert('Downloading assets from filesystem container vault...'); }}
                    className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded text-xs transition flex items-center justify-center gap-1 font-bold"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </a>
                </div>
              </div>
            </div>

            {/* AI DOCUMENT INTELLIGENCE CENTER (md:col-span-5) */}
            <div className="md:col-span-5 flex flex-col h-full bg-gray-900 border-l border-gray-950 overflow-hidden">
              
              <div className="p-3 bg-gray-950 border-b border-gray-900 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-blue-400">
                  <Sparkles className="h-4 w-4 shrink-0 text-blue-400" />
                  <h4 className="text-xs font-bold text-gray-200">AI Document Intelligence</h4>
                </div>
                {!selectedFile.ocrText && (
                  <button
                    onClick={handleAnalyzeDocument}
                    disabled={analyzing}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white text-[10px] rounded font-bold transition flex items-center gap-1"
                  >
                    {analyzing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Bot className="h-3 w-3" />}
                    Analyze
                  </button>
                )}
              </div>

              {/* Content Panel */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
                
                {/* Loader */}
                {analyzing && (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 space-y-2">
                    <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                    <p className="font-bold text-gray-200 text-xs">Reading & Scanning Document...</p>
                    <p className="text-[10px] text-gray-500 max-w-[200px]">Gemini is performing OCR extraction and technical categorization.</p>
                  </div>
                )}

                {!analyzing && (
                  <>
                    {/* Tags List */}
                    {selectedFile.aiTags && selectedFile.aiTags.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">AI Category & Tags</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedFile.aiTags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-blue-900/45 border border-blue-800 text-blue-300 font-bold rounded text-[9px]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {selectedFile.aiSummary && (
                      <div className="space-y-1 p-2.5 bg-gray-950/40 rounded-xl border border-gray-800/40">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block flex items-center gap-1">
                          <Bot className="h-3 w-3 text-blue-400" />
                          Document Summary
                        </span>
                        <p className="text-[11px] text-gray-300 leading-relaxed font-medium">{selectedFile.aiSummary}</p>
                      </div>
                    )}

                    {/* OCR Text */}
                    {selectedFile.ocrText && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Extracted OCR Text</span>
                        <div className="max-h-[120px] overflow-y-auto p-2 bg-gray-950 rounded border border-gray-800 font-mono text-[9px] text-gray-400 leading-normal whitespace-pre-line">
                          {selectedFile.ocrText}
                        </div>
                      </div>
                    )}

                    {/* Chat with Document section */}
                    {selectedFile.ocrText && (
                      <div className="border-t border-gray-800/50 pt-3 space-y-2">
                        <span className="text-[10px] text-blue-400 font-bold uppercase block flex items-center gap-1">
                          <Sparkles className="h-3 w-3 animate-pulse" />
                          Interactive Assistant Q&A
                        </span>
                        
                        {/* Conversation messages */}
                        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                          {chatHistory.length === 0 && (
                            <p className="text-[10px] text-gray-500 italic">Ask a question about dimensions, specifications, or details in this document.</p>
                          )}
                          {chatHistory.map((chat, idx) => (
                            <div key={idx} className={`p-2 rounded-xl text-[10px] leading-relaxed ${chat.role === 'user' ? 'bg-gray-800 text-gray-100 ml-4' : 'bg-blue-950/40 border border-blue-900/30 text-blue-200 mr-4'}`}>
                              <strong className="block text-[8px] uppercase tracking-wider mb-0.5 font-bold text-gray-400">
                                {chat.role === 'user' ? 'You' : 'Doc Assistant'}
                              </strong>
                              {chat.text}
                            </div>
                          ))}
                          {chatLoading && (
                            <div className="flex items-center gap-1.5 text-blue-400 text-[10px]">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Drafting response...
                            </div>
                          )}
                        </div>

                        {/* Input form */}
                        <form onSubmit={handleSendChatMessage} className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Ask about this document..."
                            value={chatMessage}
                            onChange={e => setChatMessage(e.target.value)}
                            disabled={chatLoading}
                            className="flex-1 px-2.5 py-1.5 bg-gray-950 border border-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded text-[11px] text-white placeholder-gray-600"
                          />
                          <button
                            type="submit"
                            disabled={chatLoading || !chatMessage.trim()}
                            className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 text-white rounded transition"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </div>
                    )}

                    {!selectedFile.ocrText && (
                      <div className="text-center py-16 text-gray-500 flex flex-col items-center justify-center space-y-1.5 p-4">
                        <Bot className="h-8 w-8 text-gray-700 stroke-1" />
                        <p className="font-semibold text-gray-400 text-[11px]">Analysis Required</p>
                        <p className="text-[10px] text-gray-600 max-w-[200px]">Click the "Analyze" button at the top of this panel to unlock the live OCR scanner, summary generator, and interactive Q&A assistant.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-12 flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center space-y-3">
            <FileText className="h-16 w-16 text-gray-800 stroke-1" />
            <div>
              <p className="text-sm font-bold text-gray-300">No Asset File Selected</p>
              <p className="text-xs max-w-sm text-gray-600 mt-1">Select an active schematic blueprint, PDF documentation, or image from your folders to launch the secure document viewer and AI center.</p>
            </div>
          </div>
        )}
      </div>

      {/* MOVE FOLDERS/FILES DIALOG MODAL */}
      {showMoveDialog && itemToMove && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 text-gray-900 border border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <ArrowLeftRight className="h-4 w-4 text-blue-500" />
                Move {itemToMove.type === 'file' ? 'File' : 'Folder'} to Directory
              </h3>
              <button onClick={() => setShowMoveDialog(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Select the target destination folder inside the current {storageProvider} vault directory hierarchy.
            </p>

            <div className="space-y-1.5 max-h-[200px] overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50">
              <button
                onClick={() => setMoveDestFolderId(null)}
                className={`w-full text-left p-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${moveDestFolderId === null ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <Home className="h-3.5 w-3.5" />
                Root Directory (/)
              </button>
              
              {folders
                .filter(f => f.id !== itemToMove.id) // Avoid moving a folder into itself
                .map(f => (
                  <button
                    key={f.id}
                    onClick={() => setMoveDestFolderId(f.id)}
                    className={`w-full text-left p-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${moveDestFolderId === f.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                  >
                    <Folder className="h-3.5 w-3.5" />
                    {f.name}
                  </button>
                ))}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowMoveDialog(false)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleMoveItem}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition font-bold"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
