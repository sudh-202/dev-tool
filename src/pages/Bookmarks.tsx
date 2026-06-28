import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout, useAppData } from '@/components/AppLayout';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Tool } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Search,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Loader2,
  X,
  Folder,
  Pencil,
  Trash2,
  Check,
  Plus,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { GROUP_ICONS, GROUP_EMOJIS, GroupIcon } from '@/lib/groupIcons';

/** Popover for picking a group avatar: a Lucide icon or an emoji. */
function IconPicker({
  value,
  onSelect,
  size = 'md',
}: {
  value?: string;
  onSelect: (icon: string) => void;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);
  const pick = (icon: string) => {
    onSelect(icon);
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn('flex-shrink-0', size === 'sm' ? 'h-8 w-8' : 'h-10 w-10')}
          title="Choose group avatar"
        >
          <GroupIcon icon={value} className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Icons
        </p>
        <div className="grid grid-cols-7 gap-1 mb-3">
          {Object.keys(GROUP_ICONS).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => pick(key)}
              className={cn(
                'h-8 w-8 rounded-md flex items-center justify-center hover:bg-accent transition-colors',
                value === key && 'bg-accent ring-1 ring-primary'
              )}
            >
              <GroupIcon icon={key} className="h-4 w-4" />
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Emoji
        </p>
        <div className="grid grid-cols-7 gap-1">
          {GROUP_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => pick(emoji)}
              className={cn(
                'h-8 w-8 rounded-md flex items-center justify-center text-base hover:bg-accent transition-colors',
                value === emoji && 'bg-accent ring-1 ring-primary'
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const getFaviconUrl = (url: string) => {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`;
  } catch {
    return null;
  }
};

const getHostname = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

const BookmarksContent = () => {
  const navigate = useNavigate();
  const { tools, loading } = useAppData();
  const {
    bookmarkIds,
    isBookmarked,
    toggleBookmark,
    groups,
    createGroup,
    renameGroup,
    deleteGroup,
    setGroupIcon,
    addToGroup,
    removeFromGroup,
    groupsForTool,
  } = useBookmarks();

  const [query, setQuery] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState<string | undefined>(undefined);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const toolById = useMemo(
    () => new Map(tools.map((t) => [t.id, t])),
    [tools]
  );

  // Bookmarked tools that aren't in any group.
  const ungroupedTools = useMemo(() => {
    const grouped = new Set(groups.flatMap((g) => g.toolIds));
    return bookmarkIds
      .map((id) => toolById.get(id))
      .filter((t): t is Tool => Boolean(t))
      .filter((t) => !grouped.has(t.id));
  }, [bookmarkIds, groups, toolById]);

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...tools].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.url ?? '').toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    );
  }, [tools, query]);

  const handleCreateGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    if (groups.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
      toast({ title: 'Group already exists', variant: 'destructive' });
      return;
    }
    createGroup(name, newGroupIcon);
    setNewGroupName('');
    setNewGroupIcon(undefined);
    toast({ title: 'Group created', description: `"${name}" is ready for tools.` });
  };

  const startEdit = (id: string, currentName: string) => {
    setEditingGroupId(id);
    setEditName(currentName);
  };

  const commitEdit = () => {
    if (editingGroupId && editName.trim()) {
      renameGroup(editingGroupId, editName.trim());
    }
    setEditingGroupId(null);
    setEditName('');
  };

  return (
    <div className="flex-1">
      <header className="border-b border-border bg-card px-4 sm:px-8 py-4 mt-12 md:mt-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-foreground" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Bookmarks</h1>
              <p className="text-sm text-muted-foreground">
                Organise your go-to tools into groups (e.g. "LLMs") for one-click access.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
        {/* Groups */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Groups ({groups.length})
            </h2>
          </div>

          {/* Create group */}
          <div className="flex gap-2 mb-4">
            <IconPicker value={newGroupIcon} onSelect={setNewGroupIcon} />
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
              placeholder="New group name (e.g. LLMs)"
              className="h-10 flex-1 max-w-sm"
            />
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()} className="gap-1.5">
              <Plus className="h-4 w-4" /> Create
            </Button>
          </div>

          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-muted/30 border border-border/50 rounded-md px-4 py-6 text-center">
              No groups yet. Create one above, then add tools to it from the list below.
            </p>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const groupTools = group.toolIds
                  .map((id) => toolById.get(id))
                  .filter((t): t is Tool => Boolean(t));
                return (
                  <div
                    key={group.id}
                    className="border border-border/60 rounded-lg p-3 sm:p-4 bg-card/50"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {editingGroupId === group.id ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitEdit();
                              if (e.key === 'Escape') {
                                setEditingGroupId(null);
                                setEditName('');
                              }
                            }}
                            className="h-8 max-w-xs"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={commitEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <IconPicker
                            value={group.icon}
                            onSelect={(icon) => setGroupIcon(group.id, icon)}
                            size="sm"
                          />
                          <span className="font-semibold text-foreground truncate">{group.name}</span>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {groupTools.length}
                          </Badge>
                        </div>
                      )}
                      {editingGroupId !== group.id && (
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => startEdit(group.id, group.name)}
                            title="Rename group"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              deleteGroup(group.id);
                              toast({
                                title: 'Group deleted',
                                description: `Tools in "${group.name}" stay bookmarked (now ungrouped).`,
                              });
                            }}
                            title="Delete group"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {groupTools.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Empty — use "Group" on a tool below to add it here.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {groupTools.map((tool) => {
                          const favicon = getFaviconUrl(tool.url);
                          return (
                            <Badge
                              key={tool.id}
                              variant="secondary"
                              className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 text-sm font-normal"
                            >
                              {favicon && <img src={favicon} alt="" className="h-4 w-4 rounded-sm" />}
                              <span className="max-w-[160px] truncate">{tool.name}</span>
                              <button
                                onClick={() => removeFromGroup(group.id, tool.id)}
                                className="rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                                title="Remove from group"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Ungrouped bookmarks */}
          {ungroupedTools.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Ungrouped ({ungroupedTools.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {ungroupedTools.map((tool) => {
                  const favicon = getFaviconUrl(tool.url);
                  return (
                    <Badge
                      key={tool.id}
                      variant="outline"
                      className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 text-sm font-normal"
                    >
                      {favicon && <img src={favicon} alt="" className="h-4 w-4 rounded-sm" />}
                      <span className="max-w-[160px] truncate">{tool.name}</span>
                      <button
                        onClick={() => toggleBookmark(tool.id)}
                        className="rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                        title="Remove bookmark"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Add tools */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            All tools
          </h2>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your tools..."
              className="pl-10 h-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading tools...
            </div>
          ) : filteredTools.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tools match your search.
            </p>
          ) : (
            <ScrollArea className="h-[55vh] rounded-md border border-border/50">
              <ul className="divide-y divide-border/40">
                {filteredTools.map((tool) => {
                  const favicon = getFaviconUrl(tool.url);
                  const bookmarked = isBookmarked(tool.id);
                  const toolGroupIds = groupsForTool(tool.id);
                  return (
                    <li
                      key={tool.id}
                      className="flex items-center gap-3 px-3 sm:px-4 py-2.5 hover:bg-muted/40"
                    >
                      {favicon ? (
                        <img src={favicon} alt="" className="h-6 w-6 rounded-sm flex-shrink-0" />
                      ) : (
                        <div className="h-6 w-6 rounded-sm bg-muted flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{tool.name}</span>
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                        <span className="text-xs text-muted-foreground truncate block">
                          {getHostname(tool.url)}
                        </span>
                      </div>

                      {/* Add to group */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant={toolGroupIds.length > 0 ? 'secondary' : 'outline'}
                            size="sm"
                            className="h-8 gap-1.5 flex-shrink-0"
                          >
                            <Folder className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">
                              {toolGroupIds.length > 0 ? `${toolGroupIds.length} group${toolGroupIds.length > 1 ? 's' : ''}` : 'Group'}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel>Add to group</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {groups.length === 0 ? (
                            <DropdownMenuItem disabled>
                              No groups — create one above
                            </DropdownMenuItem>
                          ) : (
                            groups.map((g) => (
                              <DropdownMenuCheckboxItem
                                key={g.id}
                                checked={g.toolIds.includes(tool.id)}
                                onCheckedChange={(checked) =>
                                  checked
                                    ? addToGroup(g.id, tool.id)
                                    : removeFromGroup(g.id, tool.id)
                                }
                                onSelect={(e) => e.preventDefault()}
                              >
                                {g.name}
                              </DropdownMenuCheckboxItem>
                            ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Bookmark toggle */}
                      <Button
                        variant={bookmarked ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => toggleBookmark(tool.id)}
                        className="h-8 gap-1.5 flex-shrink-0"
                      >
                        {bookmarked ? (
                          <BookmarkCheck className="h-3.5 w-3.5 text-foreground" />
                        ) : (
                          <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="hidden sm:inline">{bookmarked ? 'Added' : 'Add'}</span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </section>
      </main>
    </div>
  );
};

const Bookmarks = () => (
  <AppLayout>
    <BookmarksContent />
  </AppLayout>
);

export default Bookmarks;
