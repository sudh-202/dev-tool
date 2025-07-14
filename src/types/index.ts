export interface Tool {
  id: string;
  name: string;
  url: string;
  description?: string;
  tags: string[];
  categories: string[];
  category?: string;
  isPinned: boolean;
  isFavorite: boolean;
  favicon?: string;
  createdAt: Date;
  updatedAt: Date;
  email?: string;
  apiKey?: string;
  notes?: string;
  lastUsed?: Date;
  usageCount?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  toolCount: number;
}

export interface DashboardConfig {
  prompt: string;
  categories: Category[];
  createdAt: Date;
}
