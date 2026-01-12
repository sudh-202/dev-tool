import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, FileText, Plus, Trash2, Type } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getUserId } from '@/services/authService';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PromptDoc = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

type StorageMode = 'supabase' | 'local';
const PROMPT_DOCS_CATEGORY = 'Prompt Docs';

function applyBoldSegments(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf('**', i);
    if (start === -1) {
      parts.push(text.slice(i));
      break;
    }
    const end = text.indexOf('**', start + 2);
    if (end === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (start > i) parts.push(text.slice(i, start));
    const boldText = text.slice(start + 2, end);
    parts.push(<strong key={`${start}-${end}`}>{boldText}</strong>);
    i = end + 2;
  }
  return parts;
}

function renderMarkdown(content: string) {
  const lines = content.split('\n');
  return (
    <div className="space-y-3">
      {lines.map((line, idx) => {
        const trimmed = line.trimEnd();
        if (!trimmed) return <div key={idx} className="h-3" />;
        const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2] ?? '';
          const nodes = applyBoldSegments(text);
          if (level === 1) return <h1 key={idx} className="text-2xl font-bold">{nodes}</h1>;
          if (level === 2) return <h2 key={idx} className="text-xl font-bold">{nodes}</h2>;
          if (level === 3) return <h3 key={idx} className="text-lg font-semibold">{nodes}</h3>;
          return <h4 key={idx} className="text-base font-semibold">{nodes}</h4>;
        }
        return <p key={idx} className="text-sm leading-6 whitespace-pre-wrap">{applyBoldSegments(trimmed)}</p>;
      })}
    </div>
  );
}

export default function PromptDocs() {
  const navigate = useNavigate();
  const [cachedDocs, setCachedDocs] = useLocalStorage<PromptDoc[]>('dev-dashboard-prompt-docs', []);
  const [docs, setDocs] = useState<PromptDoc[]>(cachedDocs);
  const [selectedId, setSelectedId] = useState<string | null>(docs[0]?.id ?? null);
  const [search, setSearch] = useState('');
  const [storageMode, setStorageMode] = useState<StorageMode>('local');
  const [isPreview, setIsPreview] = useState(false);
  const [heading, setHeading] = useState<'normal' | 'h1' | 'h2' | 'h3' | 'h4'>('normal');
  const [pendingSave, setPendingSave] = useState<{ id: string; title: string; content: string } | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!selectedId && docs[0]?.id) setSelectedId(docs[0].id);
  }, [docs, selectedId]);

  useEffect(() => {
    setCachedDocs(docs);
  }, [docs, setCachedDocs]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const userId = getUserId();
        const { data, error } = await supabase
          .from('documentation')
          .select('*')
          .eq('user_id', userId)
          .eq('category', PROMPT_DOCS_CATEGORY)
          .order('updated_at', { ascending: false });

        if (error) {
          if (error.code === '42P01') {
            if (!cancelled) {
              setStorageMode('local');
              toast({
                title: 'Prompt / Docs is saving locally',
                description: 'Supabase table "documentation" is missing. Run the setup SQL to enable sync.',
                variant: 'destructive',
              });
            }
            return;
          }
          throw error;
        }

        const mapped: PromptDoc[] = (data || []).map((row) => ({
          id: row.id,
          title: row.title,
          content: row.content || '',
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        }));

        if (!cancelled) {
          setStorageMode('supabase');
          setDocs(mapped);
          setSelectedId((prev) => prev ?? mapped[0]?.id ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setStorageMode('local');
          toast({
            title: 'Supabase sync unavailable',
            description: err instanceof Error ? err.message : String(err),
            variant: 'destructive',
          });
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pendingSave) return;
    if (storageMode !== 'supabase') return;

    setSaveState('saving');
    const t = window.setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('documentation')
          .update({
            title: pendingSave.title,
            content: pendingSave.content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pendingSave.id)
          .eq('user_id', getUserId());

        if (error) throw error;
        setSaveState('saved');
        setPendingSave(null);
        window.setTimeout(() => setSaveState('idle'), 800);
      } catch (err) {
        setSaveState('error');
        toast({
          title: 'Failed to save to Supabase',
          description: err instanceof Error ? err.message : String(err),
          variant: 'destructive',
        });
      }
    }, 700);

    return () => window.clearTimeout(t);
  }, [pendingSave, storageMode]);

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) => (d.title || '').toLowerCase().includes(q) || (d.content || '').toLowerCase().includes(q));
  }, [docs, search]);

  const selectedDoc = useMemo(() => {
    if (!selectedId) return null;
    return docs.find((d) => d.id === selectedId) ?? null;
  }, [docs, selectedId]);

  const addDoc = async () => {
    const now = new Date();
    if (storageMode === 'supabase') {
      try {
        const { data, error } = await supabase
          .from('documentation')
          .insert({
            category: PROMPT_DOCS_CATEGORY,
            title: 'Untitled',
            content: '',
            user_id: getUserId(),
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .select('*')
          .single();

        if (error) throw error;

        const doc: PromptDoc = {
          id: data.id,
          title: data.title,
          content: data.content || '',
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setDocs((prev) => [doc, ...prev]);
        setSelectedId(doc.id);
        setSaveState('idle');
        return;
      } catch (err) {
        toast({
          title: 'Failed to create doc in Supabase',
          description: err instanceof Error ? err.message : String(err),
          variant: 'destructive',
        });
        setStorageMode('local');
      }
    }

    const localDoc: PromptDoc = {
      id: now.getTime().toString(),
      title: 'Untitled',
      content: '',
      createdAt: now,
      updatedAt: now,
    };
    setDocs((prev) => [localDoc, ...prev]);
    setSelectedId(localDoc.id);
  };

  const deleteSelectedDoc = async () => {
    if (!selectedDoc) return;
    if (storageMode === 'supabase') {
      try {
        const { error } = await supabase
          .from('documentation')
          .delete()
          .eq('id', selectedDoc.id)
          .eq('user_id', getUserId());
        if (error) throw error;
      } catch (err) {
        toast({
          title: 'Failed to delete from Supabase',
          description: err instanceof Error ? err.message : String(err),
          variant: 'destructive',
        });
      }
    }
    setDocs((prev) => prev.filter((d) => d.id !== selectedDoc.id));
    const remaining = docs.filter((d) => d.id !== selectedDoc.id);
    setSelectedId(remaining[0]?.id ?? null);
  };

  const updateSelectedDoc = (patch: Partial<Pick<PromptDoc, 'title' | 'content'>>) => {
    if (!selectedDoc) return;
    const now = new Date();
    setDocs((prev) =>
      prev.map((d) => (d.id === selectedDoc.id ? { ...d, ...patch, updatedAt: now } : d))
    );
    if (storageMode === 'supabase') {
      setPendingSave({
        id: selectedDoc.id,
        title: patch.title ?? selectedDoc.title,
        content: patch.content ?? selectedDoc.content,
      });
    }
  };

  const updateHeading = (value: 'normal' | 'h1' | 'h2' | 'h3' | 'h4') => {
    setHeading(value);
    const el = contentRef.current;
    if (!el || !selectedDoc) return;
    const level = value === 'normal' ? 0 : Number(value.slice(1));
    const text = selectedDoc.content ?? '';
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const lineEndIdx = text.indexOf('\n', end);
    const lineEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
    const block = text.slice(lineStart, lineEnd);
    const lines = block.split('\n').map((l) => {
      const stripped = l.replace(/^#{1,4}\s+/, '');
      if (level === 0) return stripped;
      if (!stripped.trim()) return stripped;
      return `${'#'.repeat(level)} ${stripped}`;
    });
    const next = text.slice(0, lineStart) + lines.join('\n') + text.slice(lineEnd);
    updateSelectedDoc({ content: next });
    window.setTimeout(() => {
      const node = contentRef.current;
      if (!node) return;
      node.focus();
    }, 0);
  };

  const toggleBold = () => {
    const el = contentRef.current;
    if (!el || !selectedDoc) return;
    const text = selectedDoc.content ?? '';
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = text.slice(start, end);
    const before = text.slice(0, start);
    const after = text.slice(end);
    const alreadyWrapped = before.endsWith('**') && after.startsWith('**');
    let nextText = text;
    let nextStart = start;
    let nextEnd = end;

    if (alreadyWrapped) {
      nextText = before.slice(0, -2) + selected + after.slice(2);
      nextStart = start - 2;
      nextEnd = end - 2;
    } else {
      nextText = before + `**${selected || 'bold text'}**` + after;
      if (selected) {
        nextStart = start + 2;
        nextEnd = end + 2;
      } else {
        nextStart = start + 2;
        nextEnd = start + 2 + 'bold text'.length;
      }
    }

    updateSelectedDoc({ content: nextText });
    window.setTimeout(() => {
      const node = contentRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(nextStart, nextEnd);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Prompt / Docs
              </h1>
              <p className="text-sm text-muted-foreground">Save prompts, requirements, and planning notes in one scrollable place.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {storageMode === 'supabase' ? 'Saved to Supabase' : 'Saved locally'}
              {storageMode === 'supabase' && saveState !== 'idle' && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Save failed'}
                </span>
              )}
            </Badge>
            <Button variant="outline" asChild>
              <Link to="/">Back to Dashboard</Link>
            </Button>
            <Button onClick={addDoc}>
              <Plus className="h-4 w-4 mr-2" />
              New Doc
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
          <Card className="md:sticky md:top-6 h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Docs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />

              <ScrollArea className="h-[55vh] pr-3">
                <div className="space-y-1">
                  {filteredDocs.map((doc) => (
                    <Button
                      key={doc.id}
                      variant="ghost"
                      className={cn(
                        'w-full justify-start h-auto py-2 px-2 whitespace-normal text-left',
                        selectedId === doc.id && 'bg-accent'
                      )}
                      onClick={() => setSelectedId(doc.id)}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{doc.title || 'Untitled'}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {new Date(doc.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </Button>
                  ))}

                  {docs.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-6">
                      No docs yet.
                      <div className="mt-3">
                        <Button onClick={addDoc} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Create your first doc
                        </Button>
                      </div>
                    </div>
                  )}

                  {docs.length > 0 && filteredDocs.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-6">No matches.</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Editor</CardTitle>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSelectedDoc}
                  disabled={!selectedDoc}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doc-title">Title</Label>
                <Input
                  id="doc-title"
                  value={selectedDoc?.title ?? ''}
                  onChange={(e) => updateSelectedDoc({ title: e.target.value })}
                  placeholder="e.g. Scrolling website requirements"
                  disabled={!selectedDoc}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-content">Content</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={heading} onValueChange={(v) => updateHeading(v as typeof heading)} disabled={!selectedDoc}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder="Normal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="h1">H1</SelectItem>
                        <SelectItem value="h2">H2</SelectItem>
                        <SelectItem value="h3">H3</SelectItem>
                        <SelectItem value="h4">H4</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button type="button" variant="outline" size="sm" onClick={toggleBold} disabled={!selectedDoc}>
                      <Type className="h-4 w-4 mr-2" />
                      Bold
                    </Button>

                    <Button
                      type="button"
                      variant={isPreview ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setIsPreview((s) => !s)}
                      disabled={!selectedDoc}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {isPreview ? 'Previewing' : 'Preview'}
                    </Button>
                  </div>

                  {isPreview ? (
                    <ScrollArea className="h-[60vh] border rounded-md p-3">
                      {renderMarkdown(selectedDoc?.content ?? '')}
                    </ScrollArea>
                  ) : (
                    <Textarea
                      id="doc-content"
                      ref={contentRef}
                      value={selectedDoc?.content ?? ''}
                      onChange={(e) => updateSelectedDoc({ content: e.target.value })}
                      placeholder="Write prompts, requirements, and notes here... (use headings and **bold**)"
                      className="h-[60vh] resize-none"
                      disabled={!selectedDoc}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

