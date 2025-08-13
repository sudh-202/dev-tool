import { Tool } from '@/types';

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

export function exportToolsAsCSV(tools: Tool[]) {
  const headers = [
    'Name',
    'URL',
    'Description',
    'Category',
    'Categories',
    'Tags',
    'Pinned',
    'Favorite',
    'Notes',
    'Created At',
    'Updated At',
    'Usage Count',
    'Last Used'
  ];

  const rows = tools.map((t) => [
    t.name ?? '',
    t.url ?? '',
    (t.description ?? '').replace(/"/g, '""'),
    t.category ?? '',
    (t.categories ?? []).join('|'),
    (t.tags ?? []).join('|'),
    t.isPinned ? 'Yes' : 'No',
    t.isFavorite ? 'Yes' : 'No',
    (t.notes ?? '').replace(/"/g, '""'),
    t.createdAt ? new Date(t.createdAt).toISOString() : '',
    t.updatedAt ? new Date(t.updatedAt).toISOString() : '',
    t.usageCount?.toString() ?? '',
    t.lastUsed ? new Date(t.lastUsed).toISOString() : ''
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/\n/g, ' ')}"`).join(','))].join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `tools_${new Date().toISOString().slice(0,10)}.csv`);
}

export function exportToolsAsJSON(tools: Tool[]) {
  const safe = tools.map((t) => ({
    id: t.id,
    name: t.name,
    url: t.url,
    description: t.description,
    category: t.category,
    categories: t.categories,
    tags: t.tags,
    isPinned: t.isPinned,
    isFavorite: t.isFavorite,
    notes: t.notes,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    usageCount: t.usageCount,
    lastUsed: t.lastUsed,
  }));
  const json = JSON.stringify(safe, null, 2);
  downloadBlob(new Blob([json], { type: 'application/json' }), `tools_${new Date().toISOString().slice(0,10)}.json`);
}


