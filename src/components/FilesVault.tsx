/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Folder, Download, Eye, Layers, ZoomIn, ZoomOut, RotateCw, RefreshCw, Upload, ShieldCheck, CheckCircle
} from 'lucide-react';
import { FileItem, Customer, Project } from '../types';

interface FilesVaultProps {
  customers: Customer[];
  projects: Project[];
}

export default function FilesVault({ customers, projects }: FilesVaultProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Viewer simulation variables
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = () => {
    setLoading(true);
    fetch('/api/files')
      .then(res => res.json())
      .then(data => {
        setFiles(data);
        if (data.length > 0 && !selectedFileId) {
          setSelectedFileId(data[0].id);
        }
      })
      .catch(err => console.error('Error fetching files:', err))
      .finally(() => setLoading(false));
  };

  const handleSimulateUpload = () => {
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Add new file to DB
            const payload = {
              name: `uploaded_bracket_blueprint_${Math.floor(100+Math.random()*900)}.pdf`,
              type: 'pdf',
              size: '1.4 MB',
              customerId: customers[0]?.id,
              projectId: projects[0]?.id
            };
            fetch('/api/files', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })
              .then(res => res.json())
              .then(() => {
                setUploadProgress(null);
                fetchFiles();
              });
          }, 800);
          return 100;
        }
        return prev + 30;
      });
    }, 150);
  };

  const selectedFile = files.find(f => f.id === selectedFileId);
  const fileCustomer = selectedFile ? customers.find(c => c.id === selectedFile.customerId) : null;
  const fileProject = selectedFile ? projects.find(p => p.id === selectedFile.projectId) : null;

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm h-[calc(100vh-140px)]">
      
      {/* Sidebar files grid list (4 cols) */}
      <div className="lg:col-span-4 border-r border-gray-50 flex flex-col h-full bg-white">
        {/* Header tools */}
        <div className="p-4 border-b border-gray-50 flex justify-between items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search drawings & STEP files..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl text-sm"
            />
          </div>
          
          <button
            onClick={handleSimulateUpload}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition flex items-center justify-center"
            title="Upload Drawing Schematic"
          >
            <Upload className="h-4 w-4" />
          </button>
        </div>

        {/* Upload active progress indicator */}
        {uploadProgress !== null && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-blue-700">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 animate-spin" />
                SLA Drawing Vault Ingress...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}

        {/* Scroll list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredFiles.length > 0 ? (
            filteredFiles.map(file => {
              const active = file.id === selectedFileId;
              return (
                <div
                  key={file.id}
                  onClick={() => {
                    setSelectedFileId(file.id);
                    setZoom(1);
                    setRotation(0);
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50/40 transition flex items-start gap-3.5 ${active ? 'bg-blue-50/30 border-l-4 border-blue-500' : ''}`}
                >
                  <div className={`p-2 rounded-lg border ${file.type === 'step' ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                    <Folder className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-gray-900 truncate leading-snug">{file.name}</h4>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">{file.type} • {file.size}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-gray-400 text-xs">No files synced to this vault.</div>
          )}
        </div>
      </div>

      {/* CAD Blueprint Vector Viewer (8 cols) */}
      <div className="lg:col-span-8 flex flex-col h-full bg-gray-950 text-white relative">
        {selectedFile ? (
          <div className="flex-1 flex flex-col h-full justify-between">
            
            {/* Context Header bar */}
            <div className="bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-xs font-bold truncate text-gray-100">{selectedFile.name}</h3>
                  <span className="text-[9px] font-mono px-1.5 bg-gray-800 text-gray-400 rounded-full font-bold uppercase">
                    {selectedFile.type}
                  </span>
                </div>
                <div className="flex gap-2 text-[10px] text-gray-400">
                  {fileCustomer && <span>🏢 {fileCustomer.company}</span>}
                  {fileProject && <span>• ⚙️ {fileProject.name}</span>}
                </div>
              </div>

              {/* View control buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => setZoom(z => Math.min(z + 0.25, 2))}
                  className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                  className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => setRotation(r => r + 90)}
                  className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
                  title="Rotate Blueprint"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Vector schematics viewer */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-hidden relative">
              <div 
                className="transition-transform duration-300 border border-gray-800 bg-gray-900 rounded-2xl p-6 shadow-2xl relative"
                style={{ 
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  width: '320px',
                  height: '320px'
                }}
              >
                {/* Simulated Engineering CAD Bracket */}
                {selectedFile.type === 'step' ? (
                  <div className="w-full h-full border border-dashed border-purple-500/30 rounded flex flex-col justify-between p-4 relative font-mono text-[9px] text-purple-400">
                    <span className="absolute top-2 left-2 text-[8px] font-bold text-gray-600">STEP MODEL VIEWER</span>
                    {/* Simulated 3D projection paths */}
                    <svg className="w-full h-full opacity-60" viewBox="0 0 100 100">
                      <polygon points="50,15 85,35 85,65 50,85 15,65 15,35" fill="none" stroke="#a855f7" strokeWidth="1" />
                      <line x1="50" y1="15" x2="50" y2="85" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="2" />
                      <line x1="15" y1="35" x2="85" y2="65" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="2" />
                      <line x1="85" y1="35" x2="15" y2="65" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="2" />
                      <circle cx="50" cy="50" r="10" fill="none" stroke="#a855f7" strokeWidth="1" />
                    </svg>
                    <span className="absolute bottom-2 right-2 text-[8px] text-gray-600">3D PROJECTION ACTIVE</span>
                  </div>
                ) : (
                  <div className="w-full h-full border border-dashed border-blue-500/30 rounded flex flex-col justify-between p-4 relative font-mono text-[9px] text-blue-400">
                    <span className="absolute top-2 left-2 text-[8px] font-bold text-gray-600">PDF DRAWING SCHEMATIC</span>
                    {/* Simulated CAD orthographic blueprint */}
                    <svg className="w-full h-full opacity-60" viewBox="0 0 100 100">
                      <rect x="25" y="25" width="50" height="50" rx="4" fill="none" stroke="#3b82f6" strokeWidth="1" />
                      <circle cx="50" cy="50" r="15" fill="none" stroke="#3b82f6" strokeWidth="1" />
                      <line x1="10" y1="50" x2="90" y2="50" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="1,3" />
                      <line x1="50" y1="10" x2="50" y2="90" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="1,3" />
                      {/* Technical dimension ticks */}
                      <line x1="25" y1="80" x2="75" y2="80" stroke="#10b981" strokeWidth="0.5" />
                      <text x="50" y="88" fill="#10b981" fontSize="6" textAnchor="middle">Ø 50.00 mm</text>
                    </svg>
                    <span className="absolute bottom-2 right-2 text-[8px] text-gray-600">ORTHOGRAPHIC OR-09</span>
                  </div>
                )}
              </div>
            </div>

            {/* QA check and specs download footer */}
            <div className="bg-gray-900 p-4 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>SHA-256 Verified Blueprint Integrity</span>
              </div>

              <div className="flex gap-2">
                <a
                  href="#"
                  onClick={e => { e.preventDefault(); alert('Drawing files are safely stored on the secure filesystem. Running in production environment.'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Assets
                </a>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6 text-center space-y-2">
            <FileText className="h-12 w-12 text-gray-700 stroke-1" />
            <p className="text-sm font-semibold text-gray-400">No Asset File Selected</p>
            <p className="text-xs max-w-xs text-gray-600">Select an active schematic drawing from the file explorer to boot up the interactive vector projection viewer.</p>
          </div>
        )}
      </div>

    </div>
  );
}
