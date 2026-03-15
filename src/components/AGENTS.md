# Components

**Purpose:** Organized component hierarchy for UI elements.

## STRUCTURE

```
components/
├── admin/
│   ├── AdminSidebar.tsx
│   ├── BlogManager.tsx
│   ├── ContactsManager.tsx
│   ├── ProjectsManager.tsx
│   ├── ServicesManager.tsx
│   ├── SettingsManager.tsx
│   ├── TeamManager.tsx
│   └── TestimonialsManager.tsx
├── layout/
│   ├── Header.tsx
│   └── Footer.tsx
├── sections/
│   ├── Contact.tsx
│   ├── Hero.tsx
│   ├── Projects.tsx
│   ├── Services.tsx
│   └── Testimonials.tsx
└── ui/
    ├── Button.tsx
    ├── Card.tsx
    └── Input.tsx
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add new project manager | admin/ProjectsManager.tsx |
| Update header navigation | layout/Header.tsx |
| Create contact form section | sections/Contact.tsx |
| Implement modal editing logic | admin/*Manager.tsx |
| Adjust primary button styling | ui/Button.tsx |

## CONVENTIONS

- Server Components by default; 'use client' only for interactive stateful components
- Use Tailwind classes for all styling (e.g., text-neon-blue, bg-dark-800)
- Isolate modal state controls (isModalOpen, editingItem) within manager components
- Import from @/components using path aliases for all component references
- Atomic structure: UI primitives in ui/, sections composed from them

## ANTI-PATTERNS

- Never hardcode color values or static styles; rely solely on Tailwind classes
- Avoid business logic inside presentational UI components
- Do not embed API endpoints or secrets in component files
- Skip inline styles for dynamic theming
- Never import directly from src/app; restrict imports to @/components or local paths
