/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, CheckCircle2, XCircle, Clock, FileText, Settings, 
  Layers, ChevronRight, Sliders, Play, RotateCw, Eye, Sparkles,
  FileCode, Cpu, ShieldAlert, DollarSign, Calendar, Wrench, FileCheck, 
  Send, Hammer, ListFilter, RotateCcw, Box, ArrowUpRight, Maximize2,
  Trash2, Download, Table, Edit, RefreshCw, AlertTriangle, ChevronDown, Check,
  BookOpen, Activity, LayoutGrid, Award, Info
} from 'lucide-react';
import { Customer, Project, Rfq, Drawing, Quotation, PurchaseOrder, Invoice, DrawingRevision, Ecr } from '../types';

interface EngineeringWorkspaceProps {
  customers: Customer[];
  projects: Project[];
  onNavigate: (tab: string, param?: any) => void;
}

type SubTab = 
  | 'rfq' 
  | 'drawing' 
  | 'quote' 
  | 'po' 
  | 'invoice' 
  | 'revision' 
  | 'approval' 
  | 'ecr' 
  | 'cad'
  | 'tree'
  | 'bom'
  | 'production'
  | 'ai_assistant';

interface BomItem {
  id: string;
  partNumber: string;
  description: string;
  material: string;
  quantity: number;
  supplier: string;
  unitCost: number;
  weightGrams: number;
  revision: string;
  leadTimeDays: number;
}

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

  // Project Tree Expanded States
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'proj_1': true,
    'assembly_main': true
  });

  // Bill of Materials (BOM) State
  const [bomList, setBomList] = useState<BomItem[]>([
    { id: 'b1', partNumber: 'ASM-APX-001', description: 'Main Support Core Collar', material: 'Ti-6Al-4V (Grade 5 Titanium)', quantity: 1, supplier: 'Apex Metals Co.', unitCost: 12500, weightGrams: 3500, revision: 'B', leadTimeDays: 14 },
    { id: 'b2', partNumber: 'PIN-APX-002', description: 'Multi-axis Pivot Pin', material: 'Al7075-T6 Aerospace Aluminum', quantity: 4, supplier: 'Precision Extrusions', unitCost: 1800, weightGrams: 280, revision: 'A', leadTimeDays: 7 },
    { id: 'b3', partNumber: 'FST-APX-103', description: 'Socket Head Cap Screw M8', material: 'SS316 Marine Stainless Steel', quantity: 12, supplier: 'Global Fasteners LLC', unitCost: 150, weightGrams: 15, revision: 'A', leadTimeDays: 3 }
  ]);
  const [showAddBomModal, setShowAddBomModal] = useState(false);
  const [bomPartNo, setBomPartNo] = useState('');
  const [bomDesc, setBomDesc] = useState('');
  const [bomMat, setBomMat] = useState('Ti-6Al-4V');
  const [bomQty, setBomQty] = useState(1);
  const [bomCost, setBomCost] = useState(1200);
  const [bomWeight, setBomWeight] = useState(500);

  // Side-by-Side Revision Comparison
  const [showCompModal, setShowCompModal] = useState(false);
  const [compDwgId, setCompDwgId] = useState('');

  // Manufacturing Tracking State
  const [productionOrders, setProductionOrders] = useState([
    { id: 'm1', partNo: 'ASM-APX-001', title: 'Titanium Base Roughing', machine: 'Haas CNC VF-2', operator: 'Rajesh Kumar', status: 'Machining', progress: 45, capaAlert: false },
    { id: 'm2', partNo: 'PIN-APX-002', title: 'Pivot Pins Anodizing', machine: 'Anodize Line 3', operator: 'Anoop Singh', status: 'In QA', progress: 90, capaAlert: false },
    { id: 'm3', partNo: 'SHL-DRN-901', title: 'Aerodynamic Shell SLS Print', machine: 'EOS P396 SLS', operator: 'Sarah Patel', status: 'Completed', progress: 100, capaAlert: false }
  ]);

  // AI Assistant Analysis cache
  const [selectedRfqAi, setSelectedRfqAi] = useState<string | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [analyzingRfq, setAnalyzingRfq] = useState(false);

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

      if (selectedCadFile === 'bracket') {
        vertices = [
          { x: -50, y: -10, z: -40 }, { x: 50, y: -10, z: -40 }, { x: 50, y: -10, z: 40 }, { x: -50, y: -10, z: 40 },
          { x: -50, y: 0, z: -40 }, { x: 50, y: 0, z: -40 }, { x: 50, y: 0, z: 40 }, { x: -50, y: 0, z: 40 },
          { x: -20, y: -30, z: -20 }, { x: 20, y: -30, z: -20 }, { x: 20, y: -30, z: 20 }, { x: -20, y: -30, z: 20 },
          { x: -20, y: -50, z: -20 }, { x: 20, y: -50, z: -20 }, { x: 20, y: -50, z: 20 }, { x: -20, y: -50, z: 20 }
        ];

        edges = [
          [0,1], [1,2], [2,3], [3,0], [4,5], [5,6], [6,7], [7,4],
          [0,4], [1,5], [2,6], [3,7],
          [8,9], [9,10], [10,11], [11,8], [12,13], [13,14], [14,15], [15,12],
          [8,12], [9,13], [10,14], [11,15],
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
        vertices = [
          { x: -60, y: -30, z: -30 }, { x: 60, y: -30, z: -30 }, { x: 60, y: -30, z: 30 }, { x: -60, y: -30, z: 30 },
          { x: -60, y: 15, z: -30 }, { x: 60, y: 15, z: -30 }, { x: 60, y: 15, z: 30 }, { x: -60, y: 15, z: 30 },
          { x: -54, y: -25, z: -25 }, { x: 54, y: -25, z: -25 }, { x: 54, y: -25, z: 25 }, { x: -54, y: -25, z: 25 },
          { x: -54, y: 15, z: -25 }, { x: 54, y: 15, z: -25 }, { x: 54, y: 15, z: 25 }, { x: -54, y: 15, z: 25 }
        ];

        edges = [
          [0,1], [1,2], [2,3], [3,0], [4,5], [5,6], [6,7], [7,4], [0,4], [1,5], [2,6], [3,7],
          [8,9], [9,10], [10,11], [11,8], [12,13], [13,14], [14,15], [15,12], [8,12], [9,13], [10,14], [11,15]
        ];
      } else {
        vertices = [
          { x: 0, y: -45, z: 0 },
          { x: -40, y: 10, z: -40 }, { x: 40, y: 10, z: -40 }, { x: 40, y: 10, z: 40 }, { x: -40, y: 10, z: 40 },
          { x: -55, y: 20, z: -55 }, { x: 55, y: 20, z: -55 }, { x: 55, y: 20, z: 55 }, { x: -55, y: 20, z: 55 }
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
          return { x: v.x, y: v.y + factor, z: v.z };
        });
      }

      // Project 3D points to 2D isometric representation
      const projected = vertices.map(v => {
        let x1 = v.x * Math.cos(ry) - v.z * Math.sin(ry);
        let z1 = v.x * Math.sin(ry) + v.z * Math.cos(ry);
        let y2 = v.y * Math.cos(rx) - z1 * Math.sin(rx);
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

      // Solid Shading projection
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
      projected.forEach((p) => {
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
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    rotationRef.current.y += deltaX * 0.5;
    rotationRef.current.x += deltaY * 0.5;

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
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
    if (!poQuoteId || !poNumVal) return;

    const q = quotations.find(qt => qt.id === poQuoteId);
    if (!q) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/engineering/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseOrderNumber: poNumVal,
          quotationId: poQuoteId,
          customerId: q.customerId,
          projectId: q.projectId,
          amount: poAmount || q.amount,
          targetDeliveryDate: poDelivery,
          fileName: poFile || 'po_document_scanned.pdf'
        })
      });

      const data = await res.json();
      setPos(prev => [data, ...prev]);
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
          reasonForChange: ecrReason,
          priority: ecrPriority,
          customerId: ecrCust,
          projectId: ecrProj || undefined,
          drawingNumber: ecrDwgNum || undefined,
          status: 'Submitted'
        })
      });

      const data = await res.json();
      setEcrs(prev => [data, ...prev]);
      setShowEcrModal(false);
      // Reset
      setEcrTitle('');
      setEcrDesc('');
      setEcrReason('');
      setEcrPriority('Medium');
      setEcrCust('');
      setEcrProj('');
      setEcrDwgNum('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveDrawing = async (dwgId: string, finalStatus: 'Released' | 'Rejected') => {
    try {
      const res = await fetch(`/api/engineering/drawings/${dwgId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: finalStatus, notes: approvalNotes })
      });

      if (res.ok) {
        setDrawings(prev => prev.map(d => d.id === dwgId ? { ...d, status: finalStatus } : d));
        // Add a mock revision log if approved
        if (finalStatus === 'Released') {
          const releasedDwg = drawings.find(d => d.id === dwgId);
          if (releasedDwg) {
            const newRev: DrawingRevision = {
              id: `rev_${Date.now()}`,
              drawingId: dwgId,
              revision: releasedDwg.revision,
              description: approvalNotes || 'Initial engineering release and sign off.',
              date: new Date().toISOString(),
              engineer: 'Lead Operations Co-Pilot'
            };
            setRevisions(prev => [newRev, ...prev]);
          }
        }
      }
      setShowApprovalModal(false);
      setApprovalNotes('');
    } catch (err) {
      console.error(err);
    }
  };

  // BOM Functions
  const handleAddBomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomPartNo.trim() || !bomDesc.trim()) return;

    const newItem: BomItem = {
      id: `b_${Date.now()}`,
      partNumber: bomPartNo,
      description: bomDesc,
      material: bomMat,
      quantity: bomQty,
      supplier: 'Registered In-house Stock',
      unitCost: bomCost,
      weightGrams: bomWeight,
      revision: 'A',
      leadTimeDays: 5
    };

    setBomList([...bomList, newItem]);
    setShowAddBomModal(false);
    setBomPartNo('');
    setBomDesc('');
  };

  const handleDeleteBomItem = (id: string) => {
    setBomList(bomList.filter(item => item.id !== id));
  };

  // Aggregate calculations for BOM
  const totalBomCost = bomList.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0);
  const totalBomWeight = bomList.reduce((acc, item) => acc + (item.weightGrams * item.quantity), 0);
  const maxBomLeadTime = Math.max(...bomList.map(item => item.leadTimeDays));

  // AI Assistant trigger
  const runAiRfqAnalysis = (rfq: Rfq) => {
    setAnalyzingRfq(true);
    setSelectedRfqAi(rfq.id);
    
    // Simulating deep structural analysis of material cost and milling duration with visual results
    setTimeout(() => {
      const estimatedWeightGrams = 1200;
      const materialCostKg = rfq.title.toLowerCase().includes('titanium') ? 4200 : 850;
      const materialCost = Math.round((estimatedWeightGrams / 1000) * materialCostKg);
      const machiningHours = 4.5;
      const machiningCost = Math.round(machiningHours * 2500); // 2500 INR / hour milling rate
      const baseProfitMargin = 0.25;
      const suggestedQuote = Math.round((materialCost + machiningCost) * (1 + baseProfitMargin));

      setAiAnalysisResult({
        partWeightGrams: estimatedWeightGrams,
        machiningHours,
        materialCost,
        machiningCost,
        suggestedQuote,
        materialsRisk: rfq.title.toLowerCase().includes('titanium') ? 'High Tool Wear Risk (Ti Grade 5 requires carbide inserts and heavy flood coolant)' : 'Low/Medium Risk (Al6061)',
        machiningRisk: 'Tight tolerance on slot width requires finishing pass with specialized groove mills.'
      });
      setAnalyzingRfq(false);
    }, 1200);
  };

  // Helper resolvers
  const getCustomerName = (id?: string) => {
    const c = customers.find(cust => cust.id === id);
    return c ? c.company : 'Internal';
  };

  const getProjectName = (id?: string) => {
    const p = projects.find(proj => proj.id === id);
    return p ? p.name : 'Standalone';
  };

  // Node toggle
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Filter application
  const filteredRfqs = rfqs.filter(r => {
    const matchCust = customerFilter === 'All' || r.customerId === customerFilter;
    return matchCust;
  });

  const filteredDrawings = drawings.filter(d => {
    const matchCust = customerFilter === 'All' || d.customerId === customerFilter;
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchCust && matchStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Subtab Navigation Bar */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'rfq', label: 'RFQs Ingress' },
            { id: 'drawing', label: 'Drawing Vault' },
            { id: 'approval', label: 'Approvals' },
            { id: 'cad', label: 'CAD 3D View' },
            { id: 'tree', label: 'Project Tree & Creo PVZ' },
            { id: 'bom', label: 'BOM Manager' },
            { id: 'production', label: 'CNC Tracker' },
            { id: 'ecr', label: 'ECRs / ECOs' },
            { id: 'quote', label: 'Quotations' },
            { id: 'po', label: 'Purchase Orders' },
            { id: 'invoice', label: 'Invoices' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${activeSubTab === tab.id ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Global Action buttons in sub-nav context */}
        <div className="flex items-center gap-1.5">
          <select
            value={customerFilter}
            onChange={e => setCustomerFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-600 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Clients</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.company}</option>
            ))}
          </select>
        </div>
      </div>

      {/* RENDER VIEW PORTS */}

      {/* ==================== RFQ INGRESS MODULE ==================== */}
      {activeSubTab === 'rfq' && (
        <div id="module_rfq" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Client RFQs</span>
                <button
                  onClick={() => setShowRfqModal(true)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition"
                >
                  <Plus className="h-3 w-3" /> Log RFQ
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredRfqs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No incoming client RFQs registered.</div>
                ) : (
                  filteredRfqs.map(rfq => (
                    <div 
                      key={rfq.id} 
                      onClick={() => runAiRfqAnalysis(rfq)}
                      className="p-4 hover:bg-slate-50/50 transition cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100">{rfq.id}</span>
                          <h4 className="text-xs font-bold text-slate-800">{rfq.title}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500">Client: <span className="font-semibold text-slate-700">{getCustomerName(rfq.customerId)}</span> • Target Delivery: {rfq.targetDeliveryDate}</p>
                        {rfq.drawingRef && <p className="text-[10px] text-slate-400 font-medium">CAD Ref: <span className="font-mono">{rfq.drawingRef}</span></p>}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold font-mono text-slate-700">₹{Number(rfq.estimatedValue || 0).toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${rfq.status === 'Quoted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{rfq.status}</span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* AI ENGINEERING ASSISTANT SIDEBAR */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-gradient-to-br from-slate-950 to-indigo-950 text-white p-5 rounded-2xl shadow-md space-y-4 border border-indigo-500/20">
              <h3 className="text-xs font-extrabold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-400" /> AI Engineering Cost Estimator
              </h3>

              {analyzingRfq ? (
                <div className="py-12 text-center text-xs text-indigo-200/80 animate-pulse space-y-2">
                  <RefreshCw className="h-6 w-6 text-indigo-400 mx-auto animate-spin" />
                  <p>Analyzing structural model & CAD specifications...</p>
                </div>
              ) : selectedRfqAi && aiAnalysisResult ? (
                <div className="space-y-4 text-xs leading-relaxed">
                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">RFQ Context Selected</span>
                    <span className="font-bold text-slate-200">{rfqs.find(r => r.id === selectedRfqAi)?.title}</span>
                  </div>

                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-indigo-500/10 space-y-2.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Part Weight:</span>
                      <span className="text-slate-200">{aiAnalysisResult.partWeightGrams} grams</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Machining Time:</span>
                      <span className="text-slate-200">{aiAnalysisResult.machiningHours} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Raw Material:</span>
                      <span className="text-slate-200">₹{aiAnalysisResult.materialCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Machining Fee:</span>
                      <span className="text-slate-200">₹{aiAnalysisResult.machiningCost.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-indigo-300">
                      <span>Suggested Quote:</span>
                      <span>₹{aiAnalysisResult.suggestedQuote.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Tooling & Manufacturing Risks</span>
                    <p className="text-indigo-200/80 text-[11px]">{aiAnalysisResult.materialsRisk}</p>
                    <p className="text-indigo-200/80 text-[11px] mt-1">{aiAnalysisResult.machiningRisk}</p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-indigo-200/60 italic">
                  Select an active RFQ from the left queue to trigger structural and cost-optimization analysis.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== PROJECT HIERARCHY TREE & CREO PVZ METADATA ==================== */}
      {activeSubTab === 'tree' && (
        <div id="module_project_tree" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Nested hierarchy browser (6 cols) */}
          <div className="lg:col-span-6 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Product Assembly Tree</h3>
            
            <div className="space-y-2 text-xs">
              {/* Root Project node */}
              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                <div onClick={() => toggleNode('proj_1')} className="flex items-center justify-between cursor-pointer font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">📁 Project: Titanium Bracket Assembly (APX-001)</span>
                  <span className="text-slate-400 text-[10px]">{expandedNodes['proj_1'] ? '▼' : '►'}</span>
                </div>

                {expandedNodes['proj_1'] && (
                  <div className="pl-4 mt-2.5 space-y-2.5 border-l border-slate-200">
                    
                    {/* Assembly subnode */}
                    <div className="bg-white p-2 border border-slate-100 rounded-lg">
                      <div onClick={() => toggleNode('assembly_main')} className="flex items-center justify-between cursor-pointer font-semibold text-slate-700">
                        <span className="flex items-center gap-1">⚙️ Main Assembly: Collar Collar Assembly</span>
                        <span className="text-slate-400 text-[10px]">{expandedNodes['assembly_main'] ? '▼' : '►'}</span>
                      </div>

                      {expandedNodes['assembly_main'] && (
                        <div className="pl-4 mt-2 space-y-1.5 border-l border-slate-100">
                          <p className="text-slate-500 font-medium">🔧 Sub-Assembly: Multi-axis Pivots Pivot (PIN-APX-002)</p>
                          <p className="text-slate-500 font-medium">📄 CAD Part Model: Support Collar Base (ASM-APX-001)</p>
                          <p className="text-slate-400 text-[11px]">📝 Technical Drawing: dwg_apex_collar (Rev B Released)</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-2 border border-slate-100 rounded-lg text-slate-600 font-semibold">
                      📦 Raw Material Stack: Titanium Alloy Stock Ti-6Al-4V
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Creo PVZ Simulated Metadata view (6 cols) */}
          <div className="lg:col-span-6 bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Box className="h-4 w-4" /> Creo PVZ Component Package Inspector
            </h3>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] space-y-3 leading-relaxed">
              <div className="flex justify-between text-slate-400">
                <span>File Format:</span>
                <span className="text-emerald-400 font-bold">Creo View CAD (ZIP-compressed .pvz)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>PVS Structures file:</span>
                <span className="text-slate-200"> collar_assembly.pvs</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>OL files mapped:</span>
                <span className="text-slate-200">2 core, 12 fastener parts</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Exploded Coordinates:</span>
                <span className="text-slate-200">COLLAR_COLLAR_EXPL_V1 (Configured)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Metadata revision:</span>
                <span className="text-slate-200">Windchill PLM ID: WN-78112-COLLAR</span>
              </div>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
              <span className="font-bold uppercase tracking-widest text-[9px] text-slate-500 block">Snapshot thumbnail</span>
              <div className="aspect-video bg-slate-950/80 rounded-lg flex items-center justify-center border border-slate-800/40 font-mono text-[10px] text-slate-500 italic">
                [CAD Snapshot representation generated successfully]
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BILL OF MATERIALS (BOM) MANAGER ==================== */}
      {activeSubTab === 'bom' && (
        <div id="module_bom" className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight">Bill of Materials (BOM) Grid Creator</h3>
                <p className="text-xs text-slate-400">Structure parts, define raw materials, weight aggregates, and procurement lead times.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Simple download mock trigger
                    const csvContent = "data:text/csv;charset=utf-8,PartNumber,Description,Material,Quantity,UnitCost,WeightGrams\n" +
                      bomList.map(b => `${b.partNumber},${b.description},${b.material},${b.quantity},${b.unitCost},${b.weightGrams}`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `BOM_AGGREGATE_COLLAR.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition"
                >
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
                <button
                  onClick={() => setShowAddBomModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Part
                </button>
              </div>
            </div>

            {/* Editable grid table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3">Part Number</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Material Grade</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Unit Cost (₹)</th>
                    <th className="p-3 text-right">Total Cost (₹)</th>
                    <th className="p-3 text-right">Weight (g)</th>
                    <th className="p-3 text-right">Lead Time (days)</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bomList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-800">{item.partNumber}</td>
                      <td className="p-3 text-slate-600 font-semibold">{item.description}</td>
                      <td className="p-3 text-slate-500">{item.material}</td>
                      <td className="p-3 text-right font-bold">{item.quantity}</td>
                      <td className="p-3 text-right font-mono">₹{item.unitCost.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">₹{(item.unitCost * item.quantity).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono">{item.weightGrams}g</td>
                      <td className="p-3 text-right font-mono font-bold text-amber-600">{item.leadTimeDays}d</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteBomItem(item.id)}
                          className="text-slate-300 hover:text-red-500 transition"
                          title="Delete part"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Aggregated totals calculations block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Aggregated Cost Projection</span>
                <span className="text-lg font-black text-slate-800">₹{totalBomCost.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Aggregate Assembly Weight</span>
                <span className="text-lg font-black text-slate-800">{(totalBomWeight / 1000).toFixed(2)} kg</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Max Structural Lead Time</span>
                <span className="text-lg font-black text-amber-600">{maxBomLeadTime} days</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CNC MANUFACTURING & PRODUCTION TRACKER ==================== */}
      {activeSubTab === 'production' && (
        <div id="module_production" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Job tracker (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Milling Operations Schedule</h3>
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-bold uppercase px-2 py-0.5 rounded">3 Active Jobs</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs space-y-4">
              {productionOrders.map(order => (
                <div key={order.id} className="pt-3 flex flex-wrap justify-between items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded font-mono font-bold text-[10px]">{order.partNo}</span>
                      <h4 className="font-extrabold text-slate-800">{order.title}</h4>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      CNC Station: <span className="font-semibold text-slate-600">{order.machine}</span> • Operator: {order.operator}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right w-24">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Milling progress</span>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${order.progress}%` }}></div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-lg shrink-0">{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Measurement checklists / CAPA guidelines (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Quality Inspection Checklist</h3>
            
            <div className="space-y-3 text-xs">
              {[
                { label: 'Coordinate dimension check (CMM validation)', passed: true },
                { label: 'Surface finish roughness (Ra 0.8 clearance)', passed: true },
                { label: 'Fasteners screw thread pitch tolerance classes', passed: false },
                { label: 'Structural weldment integrity check', passed: false }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="font-medium text-slate-600">{item.label}</span>
                  {item.passed ? (
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Passed</span>
                  ) : (
                    <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded">Pending Audit</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== DRAWING VAULT MODULE ==================== */}
      {activeSubTab === 'drawing' && (
        <div id="module_drawing" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Registered Technical Drawings</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (selectedDwgId) {
                        setCompDwgId(selectedDwgId);
                        setShowCompModal(true);
                      } else {
                        alert('Select a drawing first from the vault queue.');
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1 border border-slate-300 hover:bg-slate-50 rounded text-xs font-bold text-slate-600 transition"
                  >
                    Compare Revisions
                  </button>
                  <button
                    onClick={() => setShowDwgModal(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded"
                  >
                    <Plus className="h-3 w-3" /> Register Drawing
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredDrawings.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No vault CAD templates found.</div>
                ) : (
                  filteredDrawings.map(dwg => (
                    <div 
                      key={dwg.id} 
                      onClick={() => setSelectedDwgId(dwg.id)}
                      className={`p-4 hover:bg-slate-50/50 transition cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${selectedDwgId === dwg.id ? 'bg-blue-50/20 border-l-4 border-blue-500' : ''}`}
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
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Side Timeline revision history */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Revision History</span>
                <Sliders className="h-4 w-4 text-slate-400" />
              </div>

              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {revisions
                  .filter(rev => !selectedDwgId || rev.drawingId === selectedDwgId)
                  .map(rev => (
                    <div key={rev.id} className="flex gap-4 relative pl-6 text-xs">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white ring-1 ring-slate-200"></div>
                      <div className="space-y-0.5">
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

            <div className="divide-y divide-slate-100 text-xs">
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

      {/* ==================== CAD 3D VIEW MODULE ==================== */}
      {activeSubTab === 'cad' && (
        <div id="module_cad" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-900 mb-3 z-10 text-white">
              <div className="flex items-center gap-2">
                <Box className="h-5 w-5 text-blue-400 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Co-Pilot Interactive 3D CAD Viewer</span>
              </div>
              <div className="flex gap-1">
                {['blueprint', 'solid', 'wireframe'].map(m => (
                  <button
                    key={m}
                    onClick={() => setCadRenderMode(m as any)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border transition ${cadRenderMode === m ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated 3D projection canvas viewport */}
            <div className="flex-1 min-h-[350px] bg-slate-950/80 rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-900">
              <canvas
                ref={canvasRef}
                width={500}
                height={350}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                className="cursor-grab active:cursor-grabbing w-full max-w-[500px]"
              />
            </div>
          </div>

          {/* Model Controller variables panel */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Geometric Configurations</h3>

            <div className="space-y-1">
              <label className="font-semibold text-slate-600">Active Drawing Model</label>
              <select
                value={selectedCadFile}
                onChange={e => setSelectedCadFile(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl font-bold"
              >
                <option value="bracket">Multi-axis Turbine Bracket Assembly</option>
                <option value="sensor">Avionics Sensor enclosure</option>
                <option value="shell">Aerodynamic Shell structures</option>
              </select>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                <span>Assembly Explode Offsets</span>
                <span>{cadExplode}mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={cadExplode}
                onChange={e => setCadExplode(Number(e.target.value))}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
              <span>Automatic Rotation Loop</span>
              <button
                onClick={() => setCadAutoRotate(!cadAutoRotate)}
                className={`px-3 py-1 border text-[10px] rounded font-bold transition ${cadAutoRotate ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white text-slate-600'}`}
              >
                {cadAutoRotate ? 'Active' : 'Paused'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== QUOTATIONS MODULE ==================== */}
      {activeSubTab === 'quote' && (
        <div id="module_quotation" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs text-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Quotations</span>
            <button
              onClick={() => {
                if (rfqs.length > 0) {
                  setQuoteRfqId(rfqs[0].id);
                  setShowQuoteModal(true);
                } else {
                  alert('Create an incoming RFQ first to issue quotations.');
                }
              }}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded"
            >
              <Plus className="h-3 w-3" /> Issue Quotation
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {quotations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No quotations logged yet.</div>
            ) : (
              quotations.map(q => (
                <div key={q.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-100">{q.id}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">RFQ Source: {q.rfqId}</span>
                    </div>
                    <p className="text-slate-500 font-semibold">Client: {getCustomerName(q.customerId)} • Valid Until: {q.validUntil}</p>
                    {q.terms && <p className="text-slate-400 text-[10px] leading-relaxed">Payment Terms: {q.terms}</p>}
                  </div>

                  <span className="text-xs font-black font-mono text-slate-800">₹{Number(q.amount).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== PURCHASE ORDERS MODULE ==================== */}
      {activeSubTab === 'po' && (
        <div id="module_po" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs text-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Purchase Orders (POs)</span>
            <button
              onClick={() => {
                if (quotations.length > 0) {
                  setPoQuoteId(quotations[0].id);
                  setPoAmount(quotations[0].amount);
                  setShowPoModal(true);
                } else {
                  alert('Ensure a quotation has been finalized before creating a Purchase Order link.');
                }
              }}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded"
            >
              <Plus className="h-3 w-3" /> Log PO Link
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {pos.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No purchase orders registered.</div>
            ) : (
              pos.map(po => (
                <div key={po.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">{po.purchaseOrderNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">Quote Reference: {po.quotationId}</span>
                    </div>
                    <p className="text-slate-500 font-semibold">Client: {getCustomerName(po.customerId)} • Shipping Target: {po.targetDeliveryDate}</p>
                  </div>

                  <span className="text-xs font-black font-mono text-slate-800">₹{Number(po.amount).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== ECO / ECR MODULE ==================== */}
      {activeSubTab === 'ecr' && (
        <div id="module_ecr" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs text-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Engineering Change Requests (ECRs)</span>
            <button
              onClick={() => setShowEcrModal(true)}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded"
            >
              <Plus className="h-3 w-3" /> Raise ECR
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {ecrs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No ECR logs registered.</div>
            ) : (
              ecrs.map(e => (
                <div key={e.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-100">{e.id}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded border uppercase ${
                        e.priority === 'Critical' ? 'text-red-700 bg-red-50 border-red-100' : 'text-slate-500 bg-slate-50 border-slate-100'
                      }`}>{e.priority} ECR</span>
                    </div>
                    <h4 className="font-extrabold text-slate-800">{e.title}</h4>
                    <p className="text-slate-500">{e.description}</p>
                    <p className="text-slate-400 text-[10px] font-medium">Reason for change: {e.reasonForChange}</p>
                  </div>

                  <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded">{e.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== INVOICES MODULE ==================== */}
      {activeSubTab === 'invoice' && (
        <div id="module_invoice" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs text-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Outstanding Invoices</span>
            <span className="text-xs text-slate-400 font-bold">Aggregate: ₹{invoices.reduce((a, b) => a + Number(b.amount), 0).toLocaleString()}</span>
          </div>

          <div className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No invoices logged.</div>
            ) : (
              invoices.map(i => (
                <div key={i.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{i.id}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">PO: {i.purchaseOrderId}</span>
                    </div>
                    <p className="text-slate-500 font-semibold">Client: {getCustomerName(i.customerId)} • Generated: {i.issueDate}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black font-mono text-slate-800">₹{Number(i.amount).toLocaleString()}</span>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase ${
                      i.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                    }`}>{i.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CREATE MODAL WINDOWS */}

      {/* RFQ MODAL */}
      {showRfqModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Register incoming RFQ</h3>
              <button onClick={() => setShowRfqModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Cancel</button>
            </div>

            <form onSubmit={handleCreateRfq} className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase tracking-wide block">RFQ Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Titanium support collar machining"
                  value={rfqTitle}
                  onChange={e => setRfqTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Customer link</label>
                  <select
                    value={rfqCustId}
                    onChange={e => setRfqCustId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="">-- Select Client --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Project link</label>
                  <select
                    value={rfqProjId}
                    onChange={e => setRfqProjId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="">None (Internal)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Estimated Value (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g., 45000"
                    value={rfqValue}
                    onChange={e => setRfqValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wide block">Target Delivery</label>
                  <input
                    type="date"
                    required
                    value={rfqDelivery}
                    onChange={e => setRfqDelivery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase tracking-wide block">Drawing Reference Code</label>
                <input
                  type="text"
                  placeholder="e.g., CAD-APX-COLLAR"
                  value={rfqDwgRef}
                  onChange={e => setRfqDwgRef(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide shadow-sm"
              >
                {submitting ? 'Registering...' : 'Log RFQ Ingress'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD BOM ITEM MODAL */}
      {showAddBomModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-45 text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Add Part/Sub-item to BOM</h3>
              <button onClick={() => setShowAddBomModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Cancel</button>
            </div>

            <form onSubmit={handleAddBomItem} className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase block">Part Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., ASM-APX-012"
                  value={bomPartNo}
                  onChange={e => setBomPartNo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase block">Part Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Gasket flange spacer"
                  value={bomDesc}
                  onChange={e => setBomDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Material Grade</label>
                  <input
                    type="text"
                    value={bomMat}
                    onChange={e => setBomMat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={bomQty}
                    onChange={e => setBomQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Unit Cost (₹)</label>
                  <input
                    type="number"
                    value={bomCost}
                    onChange={e => setBomCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Weight (g)</label>
                  <input
                    type="number"
                    value={bomWeight}
                    onChange={e => setBomWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm"
              >
                Add part to BOM
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DRAWING REGISTER MODAL */}
      {showDwgModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Register Drawing</h3>
              <button onClick={() => setShowDwgModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Cancel</button>
            </div>

            <form onSubmit={handleCreateDrawing} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Drawing Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., AD-APX-301"
                    value={dwgNum}
                    onChange={e => setDwgNum(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Rev</label>
                  <input
                    type="text"
                    required
                    value={dwgRev}
                    onChange={e => setDwgRev(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase block">Drawing Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Titanium Base collar orthographic projection"
                  value={dwgTitle}
                  onChange={e => setDwgTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Customer</label>
                  <select
                    value={dwgCust}
                    onChange={e => setDwgCust(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="">-- Select Client --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Project Link</label>
                  <select
                    value={dwgProj}
                    onChange={e => setDwgProj(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="">None (Internal)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">File Format</label>
                  <select
                    value={dwgType}
                    onChange={e => setDwgType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="STEP">STEP Model (.stp)</option>
                    <option value="IGES">IGES Model (.igs)</option>
                    <option value="Creo">Creo View (.pvz)</option>
                    <option value="SolidWorks">SolidWorks Part (.sldprt)</option>
                    <option value="DXF">DXF Vector (.dxf)</option>
                    <option value="PDF">PDF Sheet Blueprint (.pdf)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">File Name Override</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if left empty"
                    value={dwgFileName}
                    onChange={e => setDwgFileName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide"
              >
                {submitting ? 'Registering...' : 'Register CAD Drawing Vault'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DRAWING APPROVAL NOTES MODAL */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 text-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Sign Off Blueprint Approval Notes</h3>
            
            <div className="space-y-3">
              <textarea
                rows={3}
                required
                placeholder="Insert structural signing, measurements validation, ECR link markers..."
                value={approvalNotes}
                onChange={e => setApprovalNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
              />
              <div className="flex justify-end gap-2 text-xs font-bold">
                <button 
                  onClick={() => setShowApprovalModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleApproveDrawing(selectedDwgId!, 'Released')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                >
                  Sign & Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVISION SIDE-BY-SIDE COMPARISON MODAL */}
      {showCompModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 text-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Side-by-Side Drawing Revision Comparison</h3>
              <button onClick={() => setShowCompModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Cancel</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest block">Revision A (Baseline)</span>
                <p className="font-bold text-slate-700">Volume: 145,200 mm³</p>
                <p className="font-bold text-slate-700">Material: Ti-6Al-4V</p>
                <p className="font-bold text-slate-700">Weight: 643 grams</p>
                <p className="font-bold text-slate-700">Tolerance: ISO 2768-m</p>
                <p className="text-[10px] text-slate-400 leading-normal font-sans">Initial prototype, drafted with standard clearance tolerances.</p>
              </div>

              <div className="bg-blue-50/20 p-4 rounded-xl border border-blue-100/50 space-y-2">
                <span className="font-extrabold text-[10px] text-blue-600 uppercase tracking-widest block">Revision B (Active Vault)</span>
                <p className="font-bold text-blue-800">Volume: 142,100 mm³ (-2%)</p>
                <p className="font-bold text-blue-800">Material: Ti-6Al-4V Grade 5</p>
                <p className="font-bold text-blue-800">Weight: 630 grams (-13g)</p>
                <p className="font-bold text-blue-800">Tolerance: ISO 2768-f (Tightened)</p>
                <p className="text-[10px] text-blue-500 leading-normal font-sans">Optimized collar throat thickness and thread fits to match aerospace spec.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE QUOTATION MODAL */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Issue Quotation</h3>
              <button onClick={() => setShowQuoteModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Cancel</button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase block">Source RFQ</label>
                <select
                  value={quoteRfqId}
                  onChange={e => setQuoteRfqId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                >
                  <option value="">-- Select Source RFQ --</option>
                  {rfqs.map(r => (
                    <option key={r.id} value={r.id}>[{r.id}] {r.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Quoted Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g., 52000"
                    value={quoteAmount}
                    onChange={e => setQuoteAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Valid Until</label>
                  <input
                    type="date"
                    required
                    value={quoteValid}
                    onChange={e => setQuoteValid(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase block">Payment & Shipping Terms</label>
                <input
                  type="text"
                  placeholder="e.g., NET 30, Ex-Works"
                  value={quoteTerms}
                  onChange={e => setQuoteTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide shadow-sm"
              >
                {submitting ? 'Issuing...' : 'Issue Quotation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PO MODAL */}
      {showPoModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Log client Purchase Order (PO) link</h3>
              <button onClick={() => setShowPoModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Cancel</button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">PO Reference Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., PO-RELIANCE-9901"
                    value={poNumVal}
                    onChange={e => setPoNumVal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Quotation Reference</label>
                  <select
                    value={poQuoteId}
                    onChange={e => setPoQuoteId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  >
                    <option value="">-- Select Quote --</option>
                    {quotations.map(qt => (
                      <option key={qt.id} value={qt.id}>[{qt.id}] Amount: ₹{qt.amount.toLocaleString()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">PO Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Auto-inherits quote amount if blank"
                    value={poAmount}
                    onChange={e => setPoAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Delivery Target Date</label>
                  <input
                    type="date"
                    required
                    value={poDelivery}
                    onChange={e => setPoDelivery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase block">Scanned File Name reference</label>
                <input
                  type="text"
                  placeholder="e.g., reliance_po_col_3012.pdf"
                  value={poFile}
                  onChange={e => setPoFile(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide shadow-sm"
              >
                {submitting ? 'Registering...' : 'Log Purchase Order link'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ECR MODAL */}
      {showEcrModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Raise ECR (Engineering Change Request)</h3>
              <button onClick={() => setShowEcrModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Cancel</button>
            </div>

            <form onSubmit={handleCreateEcr} className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase block">ECR Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Adjust base thickness clearance"
                  value={ecrTitle}
                  onChange={e => setEcrTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase block">Detailed Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the geometric adjustment and physical impacts..."
                  value={ecrDesc}
                  onChange={e => setEcrDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 uppercase block">Reason for Change</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Tool wear on thread slots, structural stability"
                  value={ecrReason}
                  onChange={e => setEcrReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Priority</label>
                  <select
                    value={ecrPriority}
                    onChange={e => setEcrPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Target Drawing Number</label>
                  <input
                    type="text"
                    placeholder="e.g., AD-APX-301"
                    value={ecrDwgNum}
                    onChange={e => setEcrDwgNum(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Customer</label>
                  <select
                    value={ecrCust}
                    onChange={e => setEcrCust(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="">-- Select Client --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase block">Project Link</label>
                  <select
                    value={ecrProj}
                    onChange={e => setEcrProj(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  >
                    <option value="">None (Internal)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm"
              >
                {submitting ? 'Submitting...' : 'Raise ECR / ECO Request'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
