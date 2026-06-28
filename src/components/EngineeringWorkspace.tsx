/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, CheckCircle2, XCircle, Clock, FileText, Settings, 
  Layers, ChevronRight, Sliders, Play, RotateCw, Eye, Sparkles,
  FileCode, Cpu, ShieldAlert, DollarSign, Calendar, Wrench, FileCheck, 
  Send, Hammer, ListFilter, RotateCcw, Box, ArrowUpRight, Maximize2
} from 'lucide-react';
import { Customer, Project, Rfq, Drawing, Quotation, PurchaseOrder, Invoice, DrawingRevision, Ecr } from '../types';

interface EngineeringWorkspaceProps {
  customers: Customer[];
  projects: Project[];
  onNavigate: (tab: string, param?: any) => void;
}

type SubTab = 'rfq' | 'drawing' | 'quote' | 'po' | 'invoice' | 'revision' | 'approval' | 'ecr' | 'cad';

export default function EngineeringWorkspace({ customers, projects, onNavigate }: EngineeringWorkspaceProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('rfq');

  // Relational trackers state
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [revisions, setRevisions] = useState<DrawingRevision[]>([]);
  const [ecrs, setEcrs] = useState<Ecr[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // CAD 3D simulation canvas state
  const [selectedCadFile, setSelectedCadFile] = useState<string>('bracket');
  const [cadRenderMode, setCadRenderMode] = useState<'wireframe' | 'solid' | 'blueprint'>('blueprint');
  const [cadExplode, setCadExplode] = useState<number>(0);
  const [cadAutoRotate, setCadAutoRotate] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef<{ x: number; y: number }>({ x: 45, y: 45 });
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter states
  const [customerFilter, setCustomerFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Form states
  const [showRfqModal, setShowRfqModal] = useState<boolean>(false);
  const [rfqTitle, setRfqTitle] = useState<string>('');
  const [rfqCustId, setRfqCustId] = useState<string>('');
  const [rfqProjId, setRfqProjId] = useState<string>('');
  const [rfqValue, setRfqValue] = useState<string>('');
  const [rfqDelivery, setRfqDelivery] = useState<string>('');
  const [rfqNotes, setRfqNotes] = useState<string>('');
  const [rfqDwgRef, setRfqDwgRef] = useState<string>('');

  const [showDwgModal, setShowDwgModal] = useState<boolean>(false);
  const [dwgNum, setDwgNum] = useState<string>('');
  const [dwgTitle, setDwgTitle] = useState<string>('');
  const [dwgCust, setDwgCust] = useState<string>('');
  const [dwgProj, setDwgProj] = useState<string>('');
  const [dwgRev, setDwgRev] = useState<string>('A');
  const [dwgType, setDwgType] = useState<'STEP' | 'IGES' | 'Creo' | 'SolidWorks' | 'DXF' | 'PDF'>('STEP');
  const [dwgFileName, setDwgFileName] = useState<string>('');

  const [showQuoteModal, setShowQuoteModal] = useState<boolean>(false);
  const [quoteRfqId, setQuoteRfqId] = useState<string>('');
  const [quoteAmount, setQuoteAmount] = useState<string>('');
  const [quoteValid, setQuoteValid] = useState<string>('');
  const [quoteTerms, setQuoteTerms] = useState<string>('');

  const [showPoModal, setShowPoModal] = useState<boolean>(false);
  const [poNumVal, setPoNumVal] = useState<string>('');
  const [poQuoteId, setPoQuoteId] = useState<string>('');
  const [poAmount, setPoAmount] = useState<string>('');
  const [poDelivery, setPoDelivery] = useState<string>('');
  const [poFile, setPoFile] = useState<string>('');

  const [showEcrModal, setShowEcrModal] = useState<boolean>(false);
  const [ecrTitle, setEcrTitle] = useState<string>('');
  const [ecrDesc, setEcrDesc] = useState<string>('');
  const [ecrReason, setEcrReason] = useState<string>('');
  const [ecrPriority, setEcrPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [ecrCust, setEcrCust] = useState<string>('');
  const [ecrProj, setEcrProj] = useState<string>('');
  const [ecrDwgNum, setEcrDwgNum] = useState<string>('');

  // Selected details
  const [selectedDwgId, setSelectedDwgId] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [approvalNotes, setApprovalNotes] = useState<string>('');

  // Data fetching
  const fetchEngineeringData = async () => {
    try {
      setLoading(true);
      const [rfqsRes, drawingsRes, quotationsRes, posRes, invoicesRes, revisionsRes, ecrsRes] = await Promise.all([
        fetch('/api/engineering/rfqs').then(res => res.json()),
        fetch('/api/engineering/drawings').then(res => res.json()),
        fetch('/api/engineering/quotations').then(res => res.json()),
        fetch('/api/engineering/pos').then(res => res.json()),
        fetch('/api/engineering/invoices').then(res => res.json()),
        fetch('/api/engineering/revisions').then(res => res.json()),
        fetch('/api/engineering/ecrs').then(res => res.json())
      ]);

      setRfqs(rfqsRes);
      setDrawings(drawingsRes);
      setQuotations(quotationsRes);
      setPos(posRes);
      setInvoices(invoicesRes);
      setRevisions(revisionsRes);
      setEcrs(ecrsRes);
    } catch (e) {
      console.error('Error fetching engineering data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngineeringData();
  }, []);

  // Live CAD Canvas Simulation Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw engineering grid in blueprint mode
      if (cadRenderMode === 'blueprint') {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < canvas.width; i += 20) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let j = 0; j < canvas.height; j += 20) {
          ctx.beginPath();
          ctx.moveTo(0, j);
          ctx.lineTo(canvas.width, j);
          ctx.stroke();
        }

        // Blueprint details
        ctx.font = '9px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`SCALE: 1:1.5 | UNIT: MM | DRAWING REF: CAD-OS-${selectedCadFile.toUpperCase()}`, 15, canvas.height - 15);
        ctx.fillText(`ROTATION X: ${Math.round(rotationRef.current.x)}° Y: ${Math.round(rotationRef.current.y)}°`, 15, 25);
      }

      // Auto rotation logic
      if (cadAutoRotate && !isDraggingRef.current) {
        rotationRef.current.y += 0.5;
      }

      // Project vertices to 2D
      const rx = (rotationRef.current.x * Math.PI) / 180;
      const ry = (rotationRef.current.y * Math.PI) / 180;

      // Define 3D wireframe models
      let vertices: { x: number; y: number; z: number }[] = [];
      let edges: [number, number][] = [];
      let faces: number[][] = [];

      if (selectedCadFile === 'bracket') {
        // Multi-axis turbine mount bracket 3D vertices
        // Base plate (8 vertices)
        vertices = [
          { x: -50, y: -10, z: -40 }, { x: 50, y: -10, z: -40 }, { x: 50, y: -10, z: 40 }, { x: -50, y: -10, z: 40 },
          { x: -50, y: 0, z: -40 }, { x: 50, y: 0, z: -40 }, { x: 50, y: 0, z: 40 }, { x: -50, y: 0, z: 40 },
          // Upright neck structure (8 vertices)
          { x: -20, y: -30, z: -20 }, { x: 20, y: -30, z: -20 }, { x: 20, y: -30, z: 20 }, { x: -20, y: -30, z: 20 },
          { x: -20, y: -50, z: -20 }, { x: 20, y: -50, z: -20 }, { x: 20, y: -50, z: 20 }, { x: -20, y: -50, z: 20 }
        ];

        // Connect edges
        edges = [
          [0,1], [1,2], [2,3], [3,0], [4,5], [5,6], [6,7], [7,4],
          [0,4], [1,5], [2,6], [3,7],
          [8,9], [9,10], [10,11], [11,8], [12,13], [13,14], [14,15], [15,12],
          [8,12], [9,13], [10,14], [11,15],
          // Blend ribs
          [4,8], [5,9], [6,10], [7,11]
        ];

        // Add mounting hole markers (dynamic overlay)
        ctx.strokeStyle = cadRenderMode === 'blueprint' ? '#0ea5e9' : '#3b82f6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(canvas.width / 2 - 30, canvas.height / 2 + 20, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(canvas.width / 2 + 30, canvas.height / 2 + 20, 8, 0, Math.PI * 2);
        ctx.stroke();

      } else if (selectedCadFile === 'sensor') {
        // Avionics sensor enclosure box vertices
        vertices = [
          // Outer box
          { x: -60, y: -30, z: -30 }, { x: 60, y: -30, z: -30 }, { x: 60, y: -30, z: 30 }, { x: -60, y: -30, z: 30 },
          { x: -60, y: 15, z: -30 }, { x: 60, y: 15, z: -30 }, { x: 60, y: 15, z: 30 }, { x: -60, y: 15, z: 30 },
          // Inner cavity
          { x: -54, y: -25, z: -25 }, { x: 54, y: -25, z: -25 }, { x: 54, y: -25, z: 25 }, { x: -54, y: -25, z: 25 },
          { x: -54, y: 15, z: -25 }, { x: 54, y: 15, z: -25 }, { x: 54, y: 15, z: 25 }, { x: -54, y: 15, z: 25 }
        ];

        edges = [
          [0,1], [1,2], [2,3], [3,0], [4,5], [5,6], [6,7], [7,4], [0,4], [1,5], [2,6], [3,7],
          [8,9], [9,10], [10,11], [11,8], [12,13], [13,14], [14,15], [15,12], [8,12], [9,13], [10,14], [11,15]
        ];
      } else {
        // SLS Drone housing aerodynamic shell structure
        vertices = [
          { x: 0, y: -45, z: 0 }, // apex top
          { x: -40, y: 10, z: -40 }, { x: 40, y: 10, z: -40 }, { x: 40, y: 10, z: 40 }, { x: -40, y: 10, z: 40 }, // body
          { x: -55, y: 20, z: -55 }, { x: 55, y: 20, z: -55 }, { x: 55, y: 20, z: 55 }, { x: -55, y: 20, z: 55 } // protective rotor guards
        ];

        edges = [
          [0,1], [0,2], [0,3], [0,4],
          [1,2], [2,3], [3,4], [4,1],
          [1,5], [2,6], [3,7], [4,8],
          [5,6], [6,7], [7,8], [8,5]
        ];
      }

      // Explode translation vector offset if set
      if (cadExplode > 0) {
        vertices = vertices.map((v, idx) => {
          const factor = (idx >= 8) ? cadExplode * 0.4 : -cadExplode * 0.1;
          return {
            x: v.x,
            y: v.y + factor,
            z: v.z
          };
        });
      }

      // Project 3D points to 2D isometric representation
      const projected = vertices.map(v => {
        // Rotate around Y-axis
        let x1 = v.x * Math.cos(ry) - v.z * Math.sin(ry);
        let z1 = v.x * Math.sin(ry) + v.z * Math.cos(ry);

        // Rotate around X-axis
        let y2 = v.y * Math.cos(rx) - z1 * Math.sin(rx);
        let z2 = v.y * Math.sin(rx) + z1 * Math.cos(rx);

        // Simple orthographic viewport centering projection
        const scale = 3.5;
        return {
          x: canvas.width / 2 + x1 * scale,
          y: canvas.height / 2 + y2 * scale
        };
      });

      // Render edges
      ctx.lineWidth = cadRenderMode === 'blueprint' ? 1.5 : 1;
      ctx.strokeStyle = cadRenderMode === 'blueprint' ? '#38bdf8' : (cadRenderMode === 'solid' ? '#1e293b' : '#2563eb');

      edges.forEach(([u, v]) => {
        const p1 = projected[u];
        const p2 = projected[v];
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });

      // Solid Shading projection (simulate lightweight mechanical depth)
      if (cadRenderMode === 'solid') {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
        ctx.beginPath();
        ctx.moveTo(projected[0].x, projected[0].y);
        ctx.lineTo(projected[1].x, projected[1].y);
        ctx.lineTo(projected[5].x, projected[5].y);
        ctx.lineTo(projected[4].x, projected[4].y);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(projected[1].x, projected[1].y);
        ctx.lineTo(projected[2].x, projected[2].y);
        ctx.lineTo(projected[6].x, projected[6].y);
        ctx.lineTo(projected[5].x, projected[5].y);
        ctx.closePath();
        ctx.fill();
      }

      // Draw vertices / anchors
      projected.forEach((p, idx) => {
        ctx.fillStyle = cadRenderMode === 'blueprint' ? '#0ea5e9' : '#1d4ed8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [selectedCadFile, cadRenderMode, cadExplode, cadAutoRotate]);

  // Handle Dragging rotation on canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = {
      x: e.clientX,
      y: e.clientY
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    rotationRef.current.y += deltaX * 0.5;
    rotationRef.current.x += deltaY * 0.5;

    previousMousePositionRef.current = {
      x: e.clientX,
      y: e.clientY
    };
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Creation Actions
  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqTitle.trim() || !rfqCustId) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/engineering/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: rfqCustId,
          projectId: rfqProjId || undefined,
          title: rfqTitle,
          estimatedValue: rfqValue,
          targetDeliveryDate: rfqDelivery,
          drawingRef: rfqDwgRef || undefined,
          notes: rfqNotes
        })
      });

      const data = await res.json();
      setRfqs(prev => [data, ...prev]);
      setShowRfqModal(false);
      // Reset
      setRfqTitle('');
      setRfqCustId('');
      setRfqProjId('');
      setRfqValue('');
      setRfqDelivery('');
      setRfqNotes('');
      setRfqDwgRef('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDrawing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dwgNum.trim() || !dwgTitle.trim() || !dwgCust) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/engineering/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawingNumber: dwgNum,
          title: dwgTitle,
          customerId: dwgCust,
          projectId: dwgProj || undefined,
          revision: dwgRev,
          status: 'In Review',
          fileType: dwgType,
          fileName: dwgFileName || `${dwgNum.toLowerCase()}_rev_${dwgRev.toLowerCase()}.${dwgType.toLowerCase()}`,
          fileSize: '4.5 MB'
        })
      });

      const data = await res.json();
      setDrawings(prev => [data, ...prev]);
      setShowDwgModal(false);
      // Reset
      setDwgNum('');
      setDwgTitle('');
      setDwgCust('');
      setDwgProj('');
      setDwgRev('A');
      setDwgFileName('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteRfqId || !quoteAmount) return;

    const rfq = rfqs.find(r => r.id === quoteRfqId);
    if (!rfq) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/engineering/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfqId: quoteRfqId,
          customerId: rfq.customerId,
          projectId: rfq.projectId,
          amount: quoteAmount,
          validUntil: quoteValid,
          terms: quoteTerms
        })
      });

      const data = await res.json();
      setQuotations(prev => [data, ...prev]);
      
      // Update RFQ status locally to 'Quoted'
      setRfqs(prev => prev.map(r => r.id === rfq.id ? { ...r, status: 'Quoted' } : r));
      setShowQuoteModal(false);
      // Reset
      setQuoteRfqId('');
      setQuoteAmount('');
      setQuoteValid('');
      setQuoteTerms('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poNumVal.trim() || !poQuoteId) return;

    const quote = quotations.find(q => q.id === poQuoteId);
    if (!quote) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/engineering/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poNumber: poNumVal,
          quoteId: poQuoteId,
          customerId: quote.customerId,
          projectId: quote.projectId,
          amount: poAmount || quote.amount,
          deliveryDate: poDelivery,
          fileUrl: poFile || `${poNumVal}_PO_Signed.pdf`
        })
      });

      const data = await res.json();
      setPos(prev => [data, ...prev]);
      // Update quote status locally to Accepted
      setQuotations(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'Accepted' } : q));
      setShowPoModal(false);
      // Reset
      setPoNumVal('');
      setPoQuoteId('');
      setPoAmount('');
      setPoDelivery('');
      setPoFile('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEcr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ecrTitle.trim() || !ecrCust) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/engineering/ecrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ecrTitle,
          description: ecrDesc,
          reason: ecrReason,
          priority: ecrPriority,
          customerId: ecrCust,
          projectId: ecrProj || undefined,
          affectedDrawings: ecrDwgNum ? [ecrDwgNum] : [],
          requestedBy: 'Sarah Jenkins'
        })
      });

      const data = await res.json();
      setEcrs(prev => [data, ...prev]);
      setShowEcrModal(false);
      // Reset
      setEcrTitle('');
      setEcrDesc('');
      setEcrReason('');
      setEcrCust('');
      setEcrProj('');
      setEcrDwgNum('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveDrawing = async (dwgId: string, status: 'Approved' | 'Released' | 'Rejected') => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/engineering/drawings/${dwgId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          approvedBy: 'Lead Engineer',
          approvalNotes
        })
      });

      const data = await res.json();
      setDrawings(prev => prev.map(d => d.id === dwgId ? data : d));
      setShowApprovalModal(false);
      setApprovalNotes('');
      setSelectedDwgId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvoiceIssue = async (poId: string) => {
    const po = pos.find(p => p.id === poId);
    if (!po) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/engineering/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poId,
          customerId: po.customerId,
          projectId: po.projectId,
          amount: po.amount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      });

      const data = await res.json();
      setInvoices(prev => [data, ...prev]);
      // Update PO status to Invoiced locally
      setPos(prev => prev.map(p => p.id === poId ? { ...p, status: 'Invoiced' } : p));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper matching functions
  const getCustomerName = (id: string) => {
    const cust = customers.find(c => c.id === id);
    return cust ? cust.company : 'Unknown Customer';
  };

  const getProjectName = (id?: string) => {
    if (!id) return 'General/R&D';
    const proj = projects.find(p => p.id === id);
    return proj ? proj.name : 'Unknown Project';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Cpu className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-mono">Loading operations workspace...</p>
      </div>
    );
  }

  return (
    <div id="engineering_workspace" className="h-full flex flex-col space-y-6 overflow-y-auto pr-2 pb-10">
      
      {/* Dynamic Sub Navigation Tab rail */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'rfq', label: 'RFQs', icon: Cpu },
            { id: 'drawing', label: 'Drawings', icon: FileCode },
            { id: 'approval', label: 'Approvals', icon: FileCheck },
            { id: 'quote', label: 'Quotes', icon: DollarSign },
            { id: 'po', label: 'POs', icon: Layers },
            { id: 'invoice', label: 'Invoices', icon: DollarSign },
            { id: 'ecr', label: 'ECRs', icon: ShieldAlert },
            { id: 'cad', label: 'CAD File Center', icon: Box }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab_${tab.id}`}
                onClick={() => setActiveSubTab(tab.id as SubTab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.id === 'approval' && drawings.filter(d => d.status === 'In Review').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Action items */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'rfq' && (
            <button
              onClick={() => setShowRfqModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New RFQ</span>
            </button>
          )}
          {activeSubTab === 'drawing' && (
            <button
              onClick={() => setShowDwgModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Drawing</span>
            </button>
          )}
          {activeSubTab === 'quote' && (
            <button
              onClick={() => setShowQuoteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Quote</span>
            </button>
          )}
          {activeSubTab === 'po' && (
            <button
              onClick={() => setShowPoModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Receive PO</span>
            </button>
          )}
          {activeSubTab === 'ecr' && (
            <button
              onClick={() => setShowEcrModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Change Request</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================== RFQ MODULE ==================== */}
      {activeSubTab === 'rfq' && (
        <div id="module_rfq" className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active RFQ Matrix</span>
              <span className="text-xs font-bold text-slate-500 font-mono">{rfqs.length} Total RFQs</span>
            </div>
            
            <div className="divide-y divide-slate-100">
              {rfqs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No active RFQs registered. Click 'New RFQ' to log one.</div>
              ) : (
                rfqs.map(rfq => (
                  <div key={rfq.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100">{rfq.rfqNumber}</span>
                        <h4 className="text-xs font-bold text-slate-800">{rfq.title}</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">{getCustomerName(rfq.customerId)}</span>
                        <span>•</span>
                        <span>{getProjectName(rfq.projectId)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Due: {rfq.targetDeliveryDate}</span>
                      </div>
                      {rfq.notes && <p className="text-[11px] text-slate-400 max-w-xl italic">{rfq.notes}</p>}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-800">${rfq.estimatedValue.toLocaleString()}</p>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Estimated Value</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          rfq.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          rfq.status === 'Quoted' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          rfq.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {rfq.status}
                        </span>
                        {rfq.status === 'Pending' && (
                          <button
                            onClick={() => {
                              setQuoteRfqId(rfq.id);
                              setQuoteAmount(rfq.estimatedValue.toString());
                              setQuoteValid(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                              setShowQuoteModal(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Generate Quotation"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== DRAWING MODULE ==================== */}
      {activeSubTab === 'drawing' && (
        <div id="module_drawing" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Engineering Drawing Index</span>
                <span className="text-xs font-bold text-slate-500 font-mono">{drawings.length} Drawings</span>
              </div>

              <div className="divide-y divide-slate-100">
                {drawings.map(dwg => (
                  <div 
                    key={dwg.id} 
                    onClick={() => {
                      setSelectedDwgId(dwg.id);
                      if (dwg.fileType === 'STEP') {
                        setSelectedCadFile('sensor');
                      } else {
                        setSelectedCadFile('bracket');
                      }
                    }}
                    className={`p-4 hover:bg-slate-50 transition cursor-pointer flex justify-between items-center gap-4 ${selectedDwgId === dwg.id ? 'bg-blue-50/20 border-l-4 border-blue-500' : ''}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-700">{dwg.drawingNumber}</span>
                        <h4 className="text-xs font-bold text-slate-800">{dwg.title}</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">{getCustomerName(dwg.customerId)}</span>
                        <span>•</span>
                        <span>Rev {dwg.revision}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 text-[9px] bg-slate-100 rounded text-slate-500 uppercase">{dwg.fileType}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        dwg.status === 'Released' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        dwg.status === 'In Review' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {dwg.status}
                      </span>
                      {dwg.status === 'In Review' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDwgId(dwg.id);
                            setShowApprovalModal(true);
                          }}
                          className="px-2 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded text-[10px] font-bold"
                        >
                          Approve/Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Timeline or CAD quick view */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Revision History</span>
                <Sliders className="h-4 w-4 text-slate-400" />
              </div>

              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {revisions
                  .filter(rev => !selectedDwgId || rev.drawingId === selectedDwgId)
                  .map(rev => (
                    <div key={rev.id} className="flex gap-4 relative pl-6">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white ring-1 ring-slate-200"></div>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">Rev {rev.revision}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(rev.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed">{rev.description}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Engineer: {rev.engineer}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DRAWING APPROVALS MODULE ==================== */}
      {activeSubTab === 'approval' && (
        <div id="module_approval" className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Drawings Pending Approval</span>
              <span className="text-xs font-bold text-red-600 font-mono">{drawings.filter(d => d.status === 'In Review').length} In Review</span>
            </div>

            <div className="divide-y divide-slate-100">
              {drawings.filter(d => d.status === 'In Review').length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">All drawings have been audited and signed off.</div>
              ) : (
                drawings.filter(d => d.status === 'In Review').map(dwg => (
                  <div key={dwg.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-100">{dwg.drawingNumber}</span>
                        <h4 className="text-xs font-bold text-slate-800">{dwg.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">Customer: <span className="font-semibold text-slate-700">{getCustomerName(dwg.customerId)}</span> • Project: {getProjectName(dwg.projectId)} • Rev: {dwg.revision}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedDwgId(dwg.id);
                          setApprovalNotes('Meets technical specifications and clearance dimensions.');
                          handleApproveDrawing(dwg.id, 'Released');
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded"
                      >
                        Approve & Release
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDwgId(dwg.id);
                          setApprovalNotes('Requires draft clearance revision.');
                          handleApproveDrawing(dwg.id, 'Rejected');
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== QUOTATION MODULE ==================== */}
      {activeSubTab === 'quote' && (
        <div id="module_quote" className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Issued Quotation Matrix</span>
              <span className="text-xs font-bold text-slate-500 font-mono">{quotations.length} Active Quotes</span>
            </div>

            <div className="divide-y divide-slate-100">
              {quotations.map(quote => (
                <div key={quote.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100">{quote.quoteNumber}</span>
                      <h4 className="text-xs font-bold text-slate-800">Quotation for RFQ {quote.rfqId}</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">{getCustomerName(quote.customerId)}</span>
                      <span>•</span>
                      <span>Valid until: {quote.validUntil}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-800">${quote.amount.toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        quote.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        quote.status === 'Sent' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {quote.status}
                      </span>
                      {quote.status === 'Sent' && (
                        <button
                          onClick={() => {
                            setPoQuoteId(quote.id);
                            setPoNumVal(`PO-${Math.floor(100000 + Math.random() * 900000)}`);
                            setPoAmount(quote.amount.toString());
                            setPoDelivery(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                            setShowPoModal(true);
                          }}
                          className="px-2 py-1 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-bold rounded"
                        >
                          Convert to PO
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== PO MODULE ==================== */}
      {activeSubTab === 'po' && (
        <div id="module_po" className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Purchase Order Tracker</span>
              <span className="text-xs font-bold text-slate-500 font-mono">{pos.length} Active POs</span>
            </div>

            <div className="divide-y divide-slate-100">
              {pos.map(po => (
                <div key={po.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-white">{po.poNumber}</span>
                      <h4 className="text-xs font-bold text-slate-800">PO for {getCustomerName(po.customerId)}</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>Delivery Target: {po.deliveryDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-800">${po.amount.toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        po.status === 'Invoiced' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        po.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {po.status}
                      </span>
                      {po.status === 'Received' && (
                        <button
                          onClick={() => handleInvoiceIssue(po.id)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded"
                        >
                          Generate Invoice
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== INVOICE MODULE ==================== */}
      {activeSubTab === 'invoice' && (
        <div id="module_invoice" className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Receivable Invoices</span>
              <span className="text-xs font-bold text-slate-500 font-mono">{invoices.length} Invoices</span>
            </div>

            <div className="divide-y divide-slate-100">
              {invoices.map(inv => (
                <div key={inv.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100">{inv.invoiceNumber}</span>
                      <h4 className="text-xs font-bold text-slate-800">Invoice for {getCustomerName(inv.customerId)}</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>Due: {inv.dueDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-800">${inv.amount.toLocaleString()}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      inv.status === 'Sent' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== ECR CHANGE REQUEST MODULE ==================== */}
      {activeSubTab === 'ecr' && (
        <div id="module_ecr" className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Engineering Change Requests (ECR)</span>
              <span className="text-xs font-bold text-red-600 font-mono">{ecrs.length} Active ECRs</span>
            </div>

            <div className="divide-y divide-slate-100">
              {ecrs.map(ecr => (
                <div key={ecr.id} className="p-4 hover:bg-slate-50 transition flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-100">{ecr.ecrNumber}</span>
                      <h4 className="text-xs font-bold text-slate-800">{ecr.title}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ecr.priority === 'Critical' ? 'bg-red-500 text-white' :
                      ecr.priority === 'High' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {ecr.priority}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{ecr.description}</p>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
                      <span>Reason for Change</span>
                      <span>Affected Drawings</span>
                    </div>
                    <div className="flex items-start justify-between text-xs text-slate-700">
                      <p className="italic text-slate-500 max-w-md">"{ecr.reason}"</p>
                      <p className="font-mono text-blue-600">{ecr.affectedDrawings.join(', ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/50 text-[10px] text-slate-400 font-semibold uppercase">
                    <span>Requested By: {ecr.requestedBy}</span>
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <Clock className="h-3 w-3 animate-pulse" /> {ecr.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== INTERACTIVE CAD MODULE ==================== */}
      {activeSubTab === 'cad' && (
        <div id="module_cad" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Controls and metadata */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-100 pb-2">CAD Model Selector</span>
              
              <div className="space-y-2">
                {[
                  { id: 'bracket', name: 'Turbine Bracket (APX)', scale: '1:1', material: 'Grade 5 Titanium' },
                  { id: 'sensor', name: 'Sensor Casing (GLB)', scale: '1.5:1', material: 'AISI 316 Stainless' },
                  { id: 'drone', name: 'Rotorguard Shell (ROB)', scale: '1:2', material: 'Nylon SLS / Carbon' }
                ].map(model => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedCadFile(model.id)}
                    className={`w-full text-left p-3 rounded-lg border transition text-xs flex flex-col space-y-1 ${
                      selectedCadFile === model.id ? 'border-slate-800 bg-slate-900 text-white shadow-md' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold">{model.name}</span>
                    <span className={`text-[10px] font-semibold uppercase ${selectedCadFile === model.id ? 'text-slate-400' : 'text-slate-500'}`}>{model.material}</span>
                  </button>
                ))}
              </div>

              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-100 pt-2 pb-2">Visual settings</span>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Render mode</span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                    {['wireframe', 'solid', 'blueprint'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setCadRenderMode(mode as any)}
                        className={`py-1 rounded text-[10px] font-bold uppercase transition ${
                          cadRenderMode === mode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {mode.substring(0, 4)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-slate-400">Exploded View</span>
                    <span className="text-blue-600 font-mono">{cadExplode}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={cadExplode}
                    onChange={(e) => setCadExplode(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Auto-Rotation</span>
                  <button
                    onClick={() => setCadAutoRotate(!cadAutoRotate)}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition ${
                      cadAutoRotate ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cadAutoRotate ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Viewport Canvas */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl flex flex-col items-center justify-center p-4 min-h-[450px]">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <Box className="h-4 w-4 text-sky-400 animate-spin" />
                <span className="text-[10px] font-mono text-sky-400 font-semibold uppercase tracking-wider">WORKSPACE CAD ORTHOGRAPHIC REPLICA</span>
              </div>

              <div className="absolute top-4 right-4 z-10 flex gap-1 bg-slate-900/80 backdrop-blur p-1 rounded-lg border border-slate-800">
                <button 
                  onClick={() => {
                    rotationRef.current = { x: 45, y: 45 };
                    setCadExplode(0);
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded"
                  title="Reset View"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setCadAutoRotate(!cadAutoRotate)}
                  className={`p-1 rounded ${cadAutoRotate ? 'text-emerald-400' : 'text-slate-400'}`}
                  title="Toggle Auto Rotation"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>

              {/* Cursor dragging indicator instructions */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/60 backdrop-blur px-3 py-1 rounded-full border border-slate-800 text-[10px] text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
                <span>Drag Mouse to Rotate CAD Model</span>
              </div>

              <canvas
                ref={canvasRef}
                width={600}
                height={350}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                className="w-full h-[350px] max-w-[600px] cursor-grab active:cursor-grabbing"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================== CREATE RFQ MODAL ==================== */}
      {showRfqModal && (
        <div id="modal_create_rfq" className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Log New RFQ</h3>
            
            <form onSubmit={handleCreateRfq} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Customer Account</label>
                <select
                  value={rfqCustId}
                  onChange={(e) => setRfqCustId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">RFQ Title</label>
                <input
                  type="text"
                  value={rfqTitle}
                  onChange={(e) => setRfqTitle(e.target.value)}
                  placeholder="e.g. Turbine Mount Bracket Batch C"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Estimated Value ($)</label>
                  <input
                    type="number"
                    value={rfqValue}
                    onChange={(e) => setRfqValue(e.target.value)}
                    placeholder="45000"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Target Delivery</label>
                  <input
                    type="date"
                    value={rfqDelivery}
                    onChange={(e) => setRfqDelivery(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Drawing reference (Optional)</label>
                <input
                  type="text"
                  value={rfqDwgRef}
                  onChange={(e) => setRfqDwgRef(e.target.value)}
                  placeholder="Apex-M4-v2.pdf"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Engineering Notes</label>
                <textarea
                  value={rfqNotes}
                  onChange={(e) => setRfqNotes(e.target.value)}
                  placeholder="Insert material requirements, tolerances, or signature references..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs h-20 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRfqModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow"
                >
                  {submitting ? 'Submitting...' : 'Log RFQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CREATE DRAWING MODAL ==================== */}
      {showDwgModal && (
        <div id="modal_create_dwg" className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Log Engineering Drawing</h3>
            
            <form onSubmit={handleCreateDrawing} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Drawing Number</label>
                  <input
                    type="text"
                    value={dwgNum}
                    onChange={(e) => setDwgNum(e.target.value)}
                    placeholder="DWG-APX-001"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Initial Revision</label>
                  <input
                    type="text"
                    value={dwgRev}
                    onChange={(e) => setDwgRev(e.target.value)}
                    placeholder="A"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Drawing Title</label>
                <input
                  type="text"
                  value={dwgTitle}
                  onChange={(e) => setDwgTitle(e.target.value)}
                  placeholder="e.g. Avionics Sensor Housing STEP Model"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Customer Account</label>
                <select
                  value={dwgCust}
                  onChange={(e) => setDwgCust(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">CAD File Type</label>
                  <select
                    value={dwgType}
                    onChange={(e) => setDwgType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="STEP">STEP (.step)</option>
                    <option value="IGES">IGES (.iges)</option>
                    <option value="Creo">Creo (.prt)</option>
                    <option value="SolidWorks">SolidWorks (.sldprt)</option>
                    <option value="DXF">DXF (.dxf)</option>
                    <option value="PDF">PDF (.pdf)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Physical File Name</label>
                  <input
                    type="text"
                    value={dwgFileName}
                    onChange={(e) => setDwgFileName(e.target.value)}
                    placeholder="enclosure_v1.step"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDwgModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow"
                >
                  {submitting ? 'Submitting...' : 'Log Drawing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CREATE QUOTATION MODAL ==================== */}
      {showQuoteModal && (
        <div id="modal_create_quote" className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Issue Engineering Quotation</h3>
            
            <form onSubmit={handleCreateQuotation} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Select Target RFQ</label>
                <select
                  value={quoteRfqId}
                  onChange={(e) => setQuoteRfqId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  required
                >
                  <option value="">Select RFQ</option>
                  {rfqs.filter(r => r.status === 'Pending').map(r => (
                    <option key={r.id} value={r.id}>{r.rfqNumber} - {r.title} ({getCustomerName(r.customerId)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Quotation Amount ($)</label>
                  <input
                    type="number"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    placeholder="45000"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Quotation Validity</label>
                  <input
                    type="date"
                    value={quoteValid}
                    onChange={(e) => setQuoteValid(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Contractual Terms</label>
                <textarea
                  value={quoteTerms}
                  onChange={(e) => setQuoteTerms(e.target.value)}
                  placeholder="e.g. Net 30. Delivery within 3 weeks after confirmation."
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs h-20 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow"
                >
                  {submitting ? 'Submitting...' : 'Issue Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== RECEIVE PO MODAL ==================== */}
      {showPoModal && (
        <div id="modal_create_po" className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Receive Purchase Order (PO)</h3>
            
            <form onSubmit={handleCreatePo} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Purchase Order Number (PO #)</label>
                <input
                  type="text"
                  value={poNumVal}
                  onChange={(e) => setPoNumVal(e.target.value)}
                  placeholder="PO-789012"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Associated Quotation</label>
                <select
                  value={poQuoteId}
                  onChange={(e) => setPoQuoteId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  required
                >
                  <option value="">Select Quotation</option>
                  {quotations.filter(q => q.status === 'Sent').map(q => (
                    <option key={q.id} value={q.id}>{q.quoteNumber} - ${q.amount.toLocaleString()} ({getCustomerName(q.customerId)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">PO Amount ($)</label>
                  <input
                    type="number"
                    value={poAmount}
                    onChange={(e) => setPoAmount(e.target.value)}
                    placeholder="8200"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Delivery Date Target</label>
                  <input
                    type="date"
                    value={poDelivery}
                    onChange={(e) => setPoDelivery(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Signed PO Attachment File Name</label>
                <input
                  type="text"
                  value={poFile}
                  onChange={(e) => setPoFile(e.target.value)}
                  placeholder="PO_789012_Signed.pdf"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowPoModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow"
                >
                  {submitting ? 'Submitting...' : 'Log PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CREATE ECR CHANGE REQUEST MODAL ==================== */}
      {showEcrModal && (
        <div id="modal_create_ecr" className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Request Engineering Change (ECR)</h3>
            
            <form onSubmit={handleCreateEcr} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">ECR Title</label>
                <input
                  type="text"
                  value={ecrTitle}
                  onChange={(e) => setEcrTitle(e.target.value)}
                  placeholder="e.g. Shift Boss Spacing to 48mm"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Customer Account</label>
                <select
                  value={ecrCust}
                  onChange={(e) => setEcrCust(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">ECR Priority</label>
                  <select
                    value={ecrPriority}
                    onChange={(e) => setEcrPriority(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Affected Drawing Number</label>
                  <input
                    type="text"
                    value={ecrDwgNum}
                    onChange={(e) => setEcrDwgNum(e.target.value)}
                    placeholder="DWG-GLB-ENV"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Modification Description</label>
                <textarea
                  value={ecrDesc}
                  onChange={(e) => setEcrDesc(e.target.value)}
                  placeholder="Detail exactly what structural changes are required..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs h-16 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Reason for change</label>
                <textarea
                  value={ecrReason}
                  onChange={(e) => setEcrReason(e.target.value)}
                  placeholder="e.g. Prevent interference with newer PCB component layout."
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs h-16 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEcrModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow"
                >
                  {submitting ? 'Submitting...' : 'Log Change Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DRAWING APPROVAL FEEDBACK MODAL ==================== */}
      {showApprovalModal && selectedDwgId && (
        <div id="modal_drawing_audit" className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Auditing Drawing Sign-Off</h3>
            
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                You are performing a compliance audit for <strong>{drawings.find(d => d.id === selectedDwgId)?.drawingNumber}</strong>. 
                Auditing will update the operational state of the drawing to <strong>Released</strong> or <strong>Rejected</strong>.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Auditor Audit Notes</label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Insert mechanical validation notes, clearance metrics, or tolerancing checks..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs h-24 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApproveDrawing(selectedDwgId, 'Rejected')}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow"
                >
                  Reject & Flags
                </button>
                <button
                  onClick={() => handleApproveDrawing(selectedDwgId, 'Released')}
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow"
                >
                  Sign & Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
