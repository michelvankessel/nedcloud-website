# ADMIN COMPONENTS

**Purpose:** CMS CRUD managers with modal pattern for content management.

## PATTERN

All managers follow identical structure:

```tsx
'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

interface Item { id: string; ... }

const emptyItem: Partial<Item> = { ... }

export function XManager({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Partial<Item> | null>(null)
  
  // CRUD: openAddModal, openEditModal, closeModal, handleSave, deleteItem
}
```

## MANAGERS

| Manager | Model | Key Fields |
|---------|-------|------------|
| ServicesManager | Service | title, slug, description, content, icon, features[], order, published |
| ProjectsManager | Project | title, slug, description, content, image, technologies[], url, github, featured, published |
| BlogManager | Post | title, slug, excerpt, content, coverImage, tags[], featured, published, publishedAt |
| TestimonialsManager | Testimonial | name, role, company, content, avatar, rating, featured, approved |
| TeamManager | TeamMember | name, role, bio, image, email, linkedin, github, twitter, order, published |
| SettingsManager | User | name, password change |

## API ROUTES

All follow REST pattern at `/api/[resource]/[id?]`:
- POST → create (auto-assigns authorId from first ADMIN for posts/projects)
- PUT → update (partial update supported)
- DELETE → remove
- GET `?all=true` → returns all records (for admin), else filtered by published/approved

## STYLING

- Dark theme: `bg-dark-800`, `text-white`, `border-dark-700`
- Neon accents: `text-neon-blue`, `bg-neon-green/10`
- Glassmorphism: `backdrop-blur-sm`, `bg-dark-800/50`
- Modal: `fixed inset-0 bg-black/50`, `max-w-2xl`, `max-h-[90vh] overflow-y-auto`