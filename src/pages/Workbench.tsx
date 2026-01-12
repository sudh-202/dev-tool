import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getUserId } from '@/services/authService';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ClipboardCopy, Download, Eraser, Image as ImageIcon, PenTool, Plus, Trash2, Upload } from 'lucide-react';

type StorageMode = 'supabase' | 'local';

type StrokePoint = { x: number; y: number };
type Stroke = { color: string; width: number; points: StrokePoint[] };
type HandNote = { id: string; title: string; strokes: Stroke[]; updatedAt: string };

type ConverterFormat = 'image/png' | 'image/webp';
type ConvertedItem = { id: string; name: string; blob: Blob };

type CodeSnippet = {
  id: string;
  title: string;
  language: string;
  code: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type TaskStatus = 'todo' | 'doing' | 'done';
type TaskItem = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatUnknownError(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || String(err);
  if (!err) return 'Unknown error';
  const anyErr = err as Record<string, unknown>;
  if (typeof anyErr.message === 'string') return anyErr.message;
  if (typeof anyErr.error === 'string') return anyErr.error;
  if (typeof anyErr.statusText === 'string') return anyErr.statusText;
  if (typeof anyErr.code === 'string') return anyErr.code;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isBucketNotFoundError(err: unknown): boolean {
  const anyErr = err as Record<string, unknown> | null | undefined;
  const message = typeof anyErr?.message === 'string' ? anyErr.message.toLowerCase() : '';
  const error = typeof anyErr?.error === 'string' ? anyErr.error.toLowerCase() : '';
  const combined = `${message} ${error}`;
  const status = typeof anyErr?.status === 'number' ? anyErr.status : typeof anyErr?.statusCode === 'number' ? anyErr.statusCode : null;
  return (combined.includes('bucket') && combined.includes('not found')) || (status === 404 && combined.includes('bucket'));
}

function sanitizeStorageSegment(value: string): string {
  return value
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .join('/')
    .replace(/\.\./g, '.')
    .replace(/[^\w./ -]+/g, '_')
    .trim();
}

async function fileToText(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

async function imageFileToBlob(file: File, type: ConverterFormat, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');
  ctx.drawImage(bitmap, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), type, type === 'image/webp' ? quality : undefined);
  });
  if (!blob) throw new Error('Conversion failed');
  return blob;
}

export default function Workbench() {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const allowedTabs = useMemo(() => new Set(['images', 'handwriting', 'convert', 'code', 'tasks']), []);
  const [activeTab, setActiveTab] = useState('images');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!tab) return;
    if (!allowedTabs.has(tab)) return;
    if (tab === activeTab) return;
    setActiveTab(tab);
  }, [activeTab, allowedTabs, searchParams]);

  const onTabChange = useCallback(
    (nextTab: string) => {
      setActiveTab(nextTab);
      const nextParams = new URLSearchParams(searchParams);
      if (nextTab === 'images') nextParams.delete('tab');
      else nextParams.set('tab', nextTab);
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const [bucketName, setBucketName] = useLocalStorage('dev-dashboard-media-bucket', 'dev-tool-media');
  const [imageFolder] = useState(() => getUserId());
  const safeImageFolder = useMemo(() => sanitizeStorageSegment(imageFolder), [imageFolder]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [listedObjects, setListedObjects] = useState<string[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [uploading, setUploading] = useState(false);

  const refreshObjects = useCallback(async () => {
    try {
      setLoadingList(true);
      const { data, error } = await supabase.storage.from(bucketName).list(safeImageFolder, { limit: 100 });
      if (error) throw error;
      setListedObjects((data || []).filter((o) => o.name).map((o) => `${safeImageFolder}/${o.name}`));
    } catch (err) {
      const desc = isBucketNotFoundError(err)
        ? `Bucket "${bucketName}" not found. Create it in Supabase → Storage → Buckets, or change the bucket name here.`
        : formatUnknownError(err);
      toast({
        title: 'Supabase Storage not ready',
        description: desc,
        variant: 'destructive',
      });
      setListedObjects([]);
    } finally {
      setLoadingList(false);
    }
  }, [bucketName, safeImageFolder]);

  useEffect(() => {
    if (activeTab !== 'images') return;
    void refreshObjects();
  }, [activeTab, refreshObjects]);

  const uploadImages = async () => {
    if (imageFiles.length === 0) return;
    setUploading(true);
    try {
      for (const file of imageFiles) {
        const safeName = sanitizeStorageSegment(file.name).split('/').join('_');
        const path = `${safeImageFolder}/${Date.now()}-${safeName}`;
        const { error } = await supabase.storage.from(bucketName).upload(path, file, {
          upsert: false,
          contentType: file.type,
        });
        if (error) throw error;
      }
      toast({ title: 'Uploaded', description: `${imageFiles.length} image(s) uploaded.` });
      setImageFiles([]);
      await refreshObjects();
    } catch (err) {
      const desc = isBucketNotFoundError(err)
        ? `Bucket "${bucketName}" not found. Create it in Supabase → Storage → Buckets, or change the bucket name here.`
        : formatUnknownError(err);
      toast({
        title: 'Upload failed',
        description: desc,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadFromStorage = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(path, 60);
      if (error) throw error;
      const resp = await fetch(data.signedUrl);
      if (!resp.ok) throw new Error(`Download failed (${resp.status})`);
      const blob = await resp.blob();
      const filename = path.split('/').pop() || 'download';
      downloadBlob(blob, filename);
    } catch (err) {
      toast({
        title: 'Download failed',
        description: formatUnknownError(err),
        variant: 'destructive',
      });
    }
  };

  const openPreviewFromStorage = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(path, 60);
      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast({
        title: 'Preview failed',
        description: formatUnknownError(err),
        variant: 'destructive',
      });
    }
  };

  const [handNotes, setHandNotes] = useLocalStorage<HandNote[]>('dev-dashboard-handwritten-notes', []);
  const [activeHandId, setActiveHandId] = useState<string | null>(handNotes[0]?.id ?? null);
  const [penColor, setPenColor] = useState('#111827');
  const [penWidth, setPenWidth] = useState(3);
  const [toolMode, setToolMode] = useState<'pen' | 'eraser'>('pen');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef<{ active: boolean; stroke: Stroke | null; lastPoint: StrokePoint | null }>({
    active: false,
    stroke: null,
    lastPoint: null,
  });

  const activeHand = useMemo(() => {
    if (!activeHandId) return null;
    return handNotes.find((n) => n.id === activeHandId) ?? null;
  }, [activeHandId, handNotes]);

  useEffect(() => {
    if (!activeHandId && handNotes[0]?.id) setActiveHandId(handNotes[0].id);
  }, [activeHandId, handNotes]);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, rect.width, rect.height);
    const strokes = activeHand?.strokes ?? [];
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const first = stroke.points[0];
      ctx.moveTo(first.x * rect.width, first.y * rect.height);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        ctx.lineTo(p.x * rect.width, p.y * rect.height);
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    if (activeTab !== 'handwriting') return;
    resizeCanvas();
    redrawCanvas();
    const onResize = () => {
      resizeCanvas();
      redrawCanvas();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeHandId, handNotes]);

  const getCanvasPoint = (evt: PointerEvent | React.PointerEvent): StrokePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (('clientX' in evt ? evt.clientX : 0) - rect.left) / rect.width;
    const y = (('clientY' in evt ? evt.clientY : 0) - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  const ensureHandNote = () => {
    if (activeHand) return activeHand;
    const now = new Date().toISOString();
    const note: HandNote = { id: String(Date.now()), title: 'Untitled', strokes: [], updatedAt: now };
    setHandNotes((prev) => [note, ...prev]);
    setActiveHandId(note.id);
    return note;
  };

  const updateHandNote = (patch: Partial<Pick<HandNote, 'title' | 'strokes'>>) => {
    const now = new Date().toISOString();
    const id = activeHandId ?? ensureHandNote().id;
    setHandNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now } : n))
    );
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const note = ensureHandNote();
    const p = getCanvasPoint(e);
    if (!p) return;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    const stroke: Stroke = {
      color: toolMode === 'eraser' ? '#ffffff' : penColor,
      width: toolMode === 'eraser' ? penWidth * 4 : penWidth,
      points: [p],
    };
    drawingRef.current = { active: true, stroke, lastPoint: p };
    updateHandNote({ strokes: [...note.strokes, stroke] });
    redrawCanvas();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current.active) return;
    const p = getCanvasPoint(e);
    if (!p || !activeHand) return;
    const strokes = [...activeHand.strokes];
    const last = strokes[strokes.length - 1];
    if (!last) return;
    last.points = [...last.points, p];
    updateHandNote({ strokes });
    redrawCanvas();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current.active) return;
    drawingRef.current = { active: false, stroke: null, lastPoint: null };
    (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
  };

  const exportHandwritingPng = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = Math.max(1, Math.floor(rect.width));
    exportCanvas.height = Math.max(1, Math.floor(rect.height));
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    const strokes = activeHand?.strokes ?? [];
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const first = stroke.points[0];
      ctx.moveTo(first.x * exportCanvas.width, first.y * exportCanvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        ctx.lineTo(p.x * exportCanvas.width, p.y * exportCanvas.height);
      }
      ctx.stroke();
    }
    const blob = await new Promise<Blob | null>((resolve) => exportCanvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    downloadBlob(blob, `${activeHand?.title || 'handwriting'}.png`);
  };

  const addHandNote = () => {
    const now = new Date().toISOString();
    const note: HandNote = { id: String(Date.now()), title: 'Untitled', strokes: [], updatedAt: now };
    setHandNotes((prev) => [note, ...prev]);
    setActiveHandId(note.id);
  };

  const deleteHandNote = () => {
    if (!activeHand) return;
    setHandNotes((prev) => prev.filter((n) => n.id !== activeHand.id));
    const remaining = handNotes.filter((n) => n.id !== activeHand.id);
    setActiveHandId(remaining[0]?.id ?? null);
  };

  const clearHandwriting = () => {
    updateHandNote({ strokes: [] });
    redrawCanvas();
  };

  const [converterFiles, setConverterFiles] = useState<File[]>([]);
  const [converterFormat, setConverterFormat] = useState<ConverterFormat>('image/webp');
  const [webpQuality, setWebpQuality] = useState(0.85);
  const [converted, setConverted] = useState<ConvertedItem[]>([]);
  const [converting, setConverting] = useState(false);

  const convertImages = async () => {
    if (converterFiles.length === 0) return;
    setConverting(true);
    try {
      const items: ConvertedItem[] = [];
      for (const f of converterFiles) {
        const blob = await imageFileToBlob(f, converterFormat, webpQuality);
        const ext = converterFormat === 'image/webp' ? 'webp' : 'png';
        const base = f.name.replace(/\.[^.]+$/, '');
        items.push({ id: `${Date.now()}-${f.name}`, name: `${base}.${ext}`, blob });
      }
      setConverted(items);
      toast({ title: 'Converted', description: `${items.length} file(s) ready to download.` });
    } catch (err) {
      toast({
        title: 'Convert failed',
        description: formatUnknownError(err),
        variant: 'destructive',
      });
    } finally {
      setConverting(false);
    }
  };

  const downloadAllConverted = () => {
    for (const item of converted) {
      downloadBlob(item.blob, item.name);
    }
  };

  const [snippetsCache, setSnippetsCache] = useLocalStorage<CodeSnippet[]>('dev-dashboard-code-snippets', []);
  const [snippets, setSnippets] = useState<CodeSnippet[]>(snippetsCache);
  const [snippetMode, setSnippetMode] = useState<StorageMode>('local');
  const [selectedSnippetId, setSelectedSnippetId] = useState<string | null>(snippets[0]?.id ?? null);
  const [snippetSearch, setSnippetSearch] = useState('');

  useEffect(() => {
    setSnippetsCache(snippets);
  }, [snippets, setSnippetsCache]);

  useEffect(() => {
    if (activeTab !== 'code') return;
    let cancelled = false;
    const load = async () => {
      try {
        const userId = getUserId();
        const { data, error } = await supabase
          .from('snippets')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (error) {
          if (error.code === '42P01') {
            if (!cancelled) {
              setSnippetMode('local');
              toast({
                title: 'Code vault is saving locally',
                description: 'Supabase table "snippets" is missing. Run the setup SQL to enable sync.',
                variant: 'destructive',
              });
            }
            return;
          }
          throw error;
        }

        const mapped: CodeSnippet[] = (data || []).map((row) => ({
          id: row.id,
          title: row.title,
          language: row.language,
          code: row.code,
          tags: Array.isArray(row.tags) ? row.tags : [],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        if (!cancelled) {
          setSnippetMode('supabase');
          setSnippets(mapped);
          setSelectedSnippetId((prev) => prev ?? mapped[0]?.id ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setSnippetMode('local');
          toast({
            title: 'Supabase sync unavailable',
            description: formatUnknownError(err),
            variant: 'destructive',
          });
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const filteredSnippets = useMemo(() => {
    const q = snippetSearch.trim().toLowerCase();
    if (!q) return snippets;
    return snippets.filter((s) => s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }, [snippets, snippetSearch]);

  const selectedSnippet = useMemo(() => {
    if (!selectedSnippetId) return null;
    return snippets.find((s) => s.id === selectedSnippetId) ?? null;
  }, [snippets, selectedSnippetId]);

  const addSnippet = async () => {
    const now = new Date().toISOString();
    if (snippetMode === 'supabase') {
      try {
        const { data, error } = await supabase
          .from('snippets')
          .insert({
            title: 'Untitled',
            code: '',
            language: 'text',
            tags: [],
            user_id: getUserId(),
            created_at: now,
            updated_at: now,
          })
          .select('*')
          .single();
        if (error) throw error;
        const snip: CodeSnippet = {
          id: data.id,
          title: data.title,
          language: data.language,
          code: data.code,
          tags: Array.isArray(data.tags) ? data.tags : [],
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        setSnippets((prev) => [snip, ...prev]);
        setSelectedSnippetId(snip.id);
        return;
      } catch (err) {
        toast({
          title: 'Failed to create in Supabase',
          description: formatUnknownError(err),
          variant: 'destructive',
        });
        setSnippetMode('local');
      }
    }

    const local: CodeSnippet = {
      id: String(Date.now()),
      title: 'Untitled',
      language: 'text',
      code: '',
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
    setSnippets((prev) => [local, ...prev]);
    setSelectedSnippetId(local.id);
  };

  const deleteSnippet = async () => {
    if (!selectedSnippet) return;
    if (snippetMode === 'supabase') {
      try {
        const { error } = await supabase.from('snippets').delete().eq('id', selectedSnippet.id).eq('user_id', getUserId());
        if (error) throw error;
      } catch (err) {
        toast({
          title: 'Failed to delete from Supabase',
          description: formatUnknownError(err),
          variant: 'destructive',
        });
      }
    }
    const next = snippets.filter((s) => s.id !== selectedSnippet.id);
    setSnippets(next);
    setSelectedSnippetId(next[0]?.id ?? null);
  };

  const updateSnippet = async (patch: Partial<Pick<CodeSnippet, 'title' | 'code' | 'language' | 'tags'>>) => {
    if (!selectedSnippet) return;
    const now = new Date().toISOString();
    const updated: CodeSnippet = { ...selectedSnippet, ...patch, updatedAt: now };
    setSnippets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (snippetMode !== 'supabase') return;
    try {
      const { error } = await supabase
        .from('snippets')
        .update({
          title: updated.title,
          code: updated.code,
          language: updated.language,
          tags: updated.tags,
          updated_at: now,
        })
        .eq('id', updated.id)
        .eq('user_id', getUserId());
      if (error) throw error;
    } catch (err) {
      toast({
        title: 'Failed to save to Supabase',
        description: formatUnknownError(err),
        variant: 'destructive',
      });
      setSnippetMode('local');
    }
  };

  const copySnippet = async () => {
    if (!selectedSnippet) return;
    try {
      await navigator.clipboard.writeText(selectedSnippet.code || '');
      toast({ title: 'Copied', description: 'Code copied to clipboard.' });
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: formatUnknownError(err),
        variant: 'destructive',
      });
    }
  };

  const uploadCodeFile = async (file: File) => {
    if (!selectedSnippet) return;
    try {
      const text = await fileToText(file);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'text';
      const languageGuess = ['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'html', 'md', 'py', 'go', 'rs', 'java'].includes(ext) ? ext : 'text';
      await updateSnippet({ code: text, language: languageGuess, title: selectedSnippet.title || file.name });
    } catch (err) {
      toast({
        title: 'File load failed',
        description: formatUnknownError(err),
        variant: 'destructive',
      });
    }
  };

  const [tasks, setTasks] = useLocalStorage<TaskItem[]>('dev-dashboard-tasks', []);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  const addTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    const now = new Date().toISOString();
    const t: TaskItem = {
      id: String(Date.now()),
      title,
      description: newTaskDescription.trim(),
      assignee: newTaskAssignee.trim(),
      status: 'todo',
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [t, ...prev]);
    setNewTaskTitle('');
    setNewTaskAssignee('');
    setNewTaskDescription('');
  };

  const updateTask = (id: string, patch: Partial<TaskItem>) => {
    const now = new Date().toISOString();
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: now } : t)));
  };

  const deleteTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const onDragStartTask = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDropToStatus = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    updateTask(id, { status });
  };

  const columns: Array<{ key: TaskStatus; title: string }> = [
    { key: 'todo', title: 'To Do' },
    { key: 'doing', title: 'In Progress' },
    { key: 'done', title: 'Done' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Workbench</h1>
              <p className="text-sm text-muted-foreground">Images, handwriting, converters, code vault, and tasks.</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/">Back to Dashboard</Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="handwriting">Handwriting</TabsTrigger>
            <TabsTrigger value="convert">Convert</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Upload / Download (Supabase Storage)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bucket name</Label>
                    <Input value={bucketName} onChange={(e) => setBucketName(e.target.value)} placeholder="dev-tool-media" />
                    <p className="text-xs text-muted-foreground">
                      Create this bucket in Supabase Storage. Files are saved under folder: <span className="font-mono">{safeImageFolder}/</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Select images</Label>
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                    />
                    <div className="flex gap-2">
                      <Button onClick={uploadImages} disabled={uploading || imageFiles.length === 0}>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Uploading…' : 'Upload'}
                      </Button>
                      <Button variant="outline" onClick={refreshObjects} disabled={loadingList}>
                        Refresh
                      </Button>
                    </div>
                    {imageFiles.length > 0 && (
                      <p className="text-xs text-muted-foreground">{imageFiles.length} file(s) selected</p>
                    )}
                  </div>
                </div>

                <div className="border rounded-md">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Supabase</Badge>
                      <span className="text-sm font-medium">Files</span>
                    </div>
                    {loadingList && <span className="text-xs text-muted-foreground">Loading…</span>}
                  </div>
                  <div className="divide-y">
                    {listedObjects.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">No files found.</div>
                    ) : (
                      listedObjects.map((path) => (
                        <div key={path} className="p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{path.split('/').pop()}</p>
                            <p className="text-xs text-muted-foreground truncate">{path}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button size="sm" variant="outline" onClick={() => openPreviewFromStorage(path)}>
                              Preview
                            </Button>
                            <Button size="sm" onClick={() => downloadFromStorage(path)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="handwriting" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  Handwritten Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button onClick={addHandNote} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New
                    </Button>
                    <Button onClick={deleteHandNote} size="sm" variant="outline" disabled={!activeHand}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <div className="border rounded-md divide-y max-h-[55vh] overflow-auto">
                      {handNotes.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground">No notes yet.</div>
                      ) : (
                        handNotes.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => setActiveHandId(n.id)}
                            className={`w-full text-left p-3 hover:bg-muted ${n.id === activeHandId ? 'bg-muted' : ''}`}
                          >
                            <div className="text-sm font-medium">{n.title || 'Untitled'}</div>
                            <div className="text-xs text-muted-foreground">{new Date(n.updatedAt).toLocaleString()}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={activeHand?.title ?? ''}
                        onChange={(e) => updateHandNote({ title: e.target.value })}
                        placeholder="Untitled"
                        disabled={!activeHand}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button variant={toolMode === 'pen' ? 'default' : 'outline'} onClick={() => setToolMode('pen')}>
                        <PenTool className="h-4 w-4 mr-2" />
                        Pen
                      </Button>
                      <Button variant={toolMode === 'eraser' ? 'default' : 'outline'} onClick={() => setToolMode('eraser')}>
                        <Eraser className="h-4 w-4 mr-2" />
                        Eraser
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} disabled={!activeHand || toolMode === 'eraser'} />
                    </div>
                    <div className="space-y-2">
                      <Label>Width</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={penWidth}
                        onChange={(e) => setPenWidth(Number(e.target.value) || 1)}
                        disabled={!activeHand}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button variant="outline" onClick={clearHandwriting} disabled={!activeHand}>
                        Clear
                      </Button>
                      <Button onClick={exportHandwritingPng} disabled={!activeHand}>
                        <Download className="h-4 w-4 mr-2" />
                        Export PNG
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-md bg-white">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-[60vh] touch-none"
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="convert" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Image Converter (PNG / WebP)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select images</Label>
                    <Input type="file" multiple accept="image/*" onChange={(e) => setConverterFiles(Array.from(e.target.files || []))} />
                    <p className="text-xs text-muted-foreground">{converterFiles.length} file(s) selected</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Output format</Label>
                    <Select value={converterFormat} onValueChange={(v) => setConverterFormat(v as ConverterFormat)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image/webp">WebP</SelectItem>
                        <SelectItem value="image/png">PNG</SelectItem>
                      </SelectContent>
                    </Select>
                    {converterFormat === 'image/webp' && (
                      <div className="space-y-2">
                        <Label>WebP quality (0.1 - 1.0)</Label>
                        <Input
                          type="number"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={webpQuality}
                          onChange={(e) => setWebpQuality(Math.max(0.1, Math.min(1, Number(e.target.value) || 0.85)))}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={convertImages} disabled={converting || converterFiles.length === 0}>
                    {converting ? 'Converting…' : 'Convert'}
                  </Button>
                  <Button variant="outline" onClick={downloadAllConverted} disabled={converted.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Download all
                  </Button>
                </div>

                <div className="border rounded-md divide-y">
                  {converted.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">Converted files will appear here.</div>
                  ) : (
                    converted.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{Math.round(item.blob.size / 1024)} KB</p>
                        </div>
                        <Button size="sm" onClick={() => downloadBlob(item.blob, item.name)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span>Code Vault</span>
                  <Badge variant="secondary">{snippetMode === 'supabase' ? 'Saved to Supabase' : 'Saved locally'}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button onClick={addSnippet} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New
                    </Button>
                    <Button onClick={deleteSnippet} size="sm" variant="outline" disabled={!selectedSnippet}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                  <Input value={snippetSearch} onChange={(e) => setSnippetSearch(e.target.value)} placeholder="Search..." />
                  <div className="border rounded-md divide-y max-h-[60vh] overflow-auto">
                    {filteredSnippets.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">No snippets.</div>
                    ) : (
                      filteredSnippets.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSnippetId(s.id)}
                          className={`w-full text-left p-3 hover:bg-muted ${s.id === selectedSnippetId ? 'bg-muted' : ''}`}
                        >
                          <div className="text-sm font-medium">{s.title || 'Untitled'}</div>
                          <div className="text-xs text-muted-foreground">{s.language}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={selectedSnippet?.title ?? ''}
                        onChange={(e) => void updateSnippet({ title: e.target.value })}
                        placeholder="Untitled"
                        disabled={!selectedSnippet}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select
                        value={selectedSnippet?.language ?? 'text'}
                        onValueChange={(v) => void updateSnippet({ language: v })}
                        disabled={!selectedSnippet}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">text</SelectItem>
                          <SelectItem value="ts">ts</SelectItem>
                          <SelectItem value="tsx">tsx</SelectItem>
                          <SelectItem value="js">js</SelectItem>
                          <SelectItem value="jsx">jsx</SelectItem>
                          <SelectItem value="json">json</SelectItem>
                          <SelectItem value="html">html</SelectItem>
                          <SelectItem value="css">css</SelectItem>
                          <SelectItem value="md">md</SelectItem>
                          <SelectItem value="py">py</SelectItem>
                          <SelectItem value="go">go</SelectItem>
                          <SelectItem value="rs">rs</SelectItem>
                          <SelectItem value="java">java</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Tags (comma separated)</Label>
                      <Input
                        value={(selectedSnippet?.tags ?? []).join(', ')}
                        onChange={(e) => {
                          const tags = e.target.value
                            .split(',')
                            .map((t) => t.trim())
                            .filter(Boolean);
                          void updateSnippet({ tags });
                        }}
                        placeholder="api, auth, utils"
                        disabled={!selectedSnippet}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload code file</Label>
                      <Input
                        type="file"
                        accept=".txt,.js,.jsx,.ts,.tsx,.json,.css,.html,.md,.py,.go,.rs,.java"
                        disabled={!selectedSnippet}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadCodeFile(f);
                          e.currentTarget.value = '';
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button onClick={copySnippet} disabled={!selectedSnippet}>
                      <ClipboardCopy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!selectedSnippet) return;
                        const blob = new Blob([selectedSnippet.code || ''], { type: 'text/plain;charset=utf-8' });
                        downloadBlob(blob, `${selectedSnippet.title || 'snippet'}.${selectedSnippet.language || 'txt'}`);
                      }}
                      disabled={!selectedSnippet}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Textarea
                      value={selectedSnippet?.code ?? ''}
                      onChange={(e) => void updateSnippet({ code: e.target.value })}
                      className="h-[60vh] font-mono text-sm"
                      placeholder="Paste or upload code…"
                      disabled={!selectedSnippet}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Task Board</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Implement login UI" />
                  </div>
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Input value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} placeholder="Sudhanshu" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} placeholder="Short details…" />
                  </div>
                </div>
                <Button onClick={addTask} disabled={!newTaskTitle.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add task
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      className="border rounded-md bg-muted/30"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => onDropToStatus(e, col.key)}
                    >
                      <div className="px-3 py-2 border-b flex items-center justify-between">
                        <div className="font-medium text-sm">{col.title}</div>
                        <Badge variant="secondary">{tasks.filter((t) => t.status === col.key).length}</Badge>
                      </div>
                      <div className="p-3 space-y-3 min-h-[35vh]">
                        {tasks
                          .filter((t) => t.status === col.key)
                          .map((t) => (
                            <div
                              key={t.id}
                              draggable
                              onDragStart={(e) => onDragStartTask(e, t.id)}
                              className="bg-background border rounded-md p-3 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="font-medium text-sm truncate">{t.title}</div>
                                  {!!t.description && <div className="text-xs text-muted-foreground mt-1">{t.description}</div>}
                                  {!!t.assignee && <div className="text-xs mt-2">Assignee: <span className="font-medium">{t.assignee}</span></div>}
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => deleteTask(t.id)} aria-label="Delete">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="mt-3 grid grid-cols-1 gap-2">
                                <Input
                                  value={t.assignee}
                                  onChange={(e) => updateTask(t.id, { assignee: e.target.value })}
                                  placeholder="Assignee"
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
