import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StickyNote, Plus, X, Tag } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Note {
  id: string;
  content: string;
  tags: string[];
  createdAt: Date;
  linkedTools?: string[];
}

export function QuickNotes() {
  const [notes, setNotes] = useLocalStorage<Note[]>('dev-dashboard-notes', []);
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const addNote = () => {
    if (!newNote.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      content: newNote,
      tags: [],
      createdAt: new Date(),
    };

    setNotes(prev => [note, ...prev]);
    setNewNote('');
    setIsAdding(false);
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const addTagToNote = (noteId: string, tag: string) => {
    if (!tag.trim()) return;
    
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, tags: [...new Set([...note.tags, tag.trim()])] }
        : note
    ));
  };

  const removeTagFromNote = (noteId: string, tag: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, tags: note.tags.filter(t => t !== tag) }
        : note
    ));
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between pb-3 border-b mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <StickyNote className="h-6 w-6" />
          Quick Notes & Scratchpad
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus className="h-4 w-4 mr-1" />
          {isAdding ? 'Cancel' : 'Add Note'}
        </Button>
      </div>
      <div className="space-y-4">
        {isAdding && (
          <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write your note here... (supports markdown)"
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={addNote} size="sm">
                Save Note
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewNote('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {notes.map((note) => (
            <div key={note.id} className="p-3 border rounded-lg bg-card">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm text-foreground whitespace-pre-wrap flex-1">
                  {note.content}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNote(note.id)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {note.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    {tag}
                    <X
                      className="h-2 w-2 cursor-pointer"
                      onClick={() => removeTagFromNote(note.id, tag)}
                    />
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2 items-center">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag..."
                  className="text-xs h-6 flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addTagToNote(note.id, newTag);
                      setNewTag('');
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    addTagToNote(note.id, newTag);
                    setNewTag('');
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Tag className="h-3 w-3" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(note.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
          
          {notes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notes yet. Click the + button to add your first note.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
