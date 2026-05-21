# Admin CRUD Managers

**Generated:** 2026-05-21T22:55:40Z
**Commit:** b1c799c
**Purpose:** CMS components with modal pattern for content management.

## Pattern

All managers follow identical structure:

```tsx
'use client'
import { useState } from 'react'

export function XManager({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Partial<Item> | null>(null)
}
```

## Managers

| Manager | Model | Key Fields |
|---------|-------|------------|
| ServicesManager | Service | title, slug, description, features[], order, published |
| ProjectsManager | Project | title, slug, description, technologies[], url, github, featured, published |
| BlogManager | Post | title, slug, excerpt, content, coverImage, tags[], featured, published |
| TestimonialsManager | Testimonial | name, role, company, content, avatar, rating, featured, approved |
| TeamManager | TeamMember | name, role, bio, image, email, linkedin, github, twitter, order, published |
| ContactsManager | ContactSubmission | name, email, company, subject, message, status |
| SettingsManager | User | name, password change, **2FA management** |

## API Routes

All at `/api/[resource]/[id?]`:
- POST → create (auto-assigns authorId from first ADMIN)
- PUT → update
- DELETE → remove
- GET `?all=true` → all records (admin), else filtered by published/approved

## 2FA in SettingsManager

Enable/disable two-factor authentication:
- Enable: GET `/api/2fa/setup` → QR code → POST `/api/2fa/verify`
- Disable: POST `/api/2fa/disable` with verification code
- Status: GET `/api/2fa/status` on mount

## Styling

- Dark: `bg-dark-800`, `text-white`, `border-dark-700`
- Neon accents: `text-neon-blue`, `bg-neon-green/10`
- Modal: `fixed inset-0 bg-black/50`, `max-w-2xl`, `max-h-[90vh] overflow-y-auto`