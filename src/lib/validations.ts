import { z } from 'zod'
import { securityConfig } from './security.config'

const v = securityConfig.validation

export const serviceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(v.titleMaxLength),
  slug: z.string().min(1, 'Slug is required').max(v.titleMaxLength).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(1, 'Description is required').max(v.descriptionMaxLength),
  content: z.string().max(v.contentMaxLength).optional(),
  icon: z.string().max(50).optional(),
  features: z.array(z.string().max(v.descriptionMaxLength)).max(v.maxFeatures).optional(),
  order: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
})

export const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(v.titleMaxLength),
  slug: z.string().min(1, 'Slug is required').max(v.titleMaxLength).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(1, 'Description is required').max(v.descriptionMaxLength),
  content: z.string().max(v.postContentMaxLength).optional(),
  image: z.string().url('Must be a valid URL').max(v.urlMaxLength).optional().or(z.literal('')),
  technologies: z.array(z.string().max(100)).max(v.maxTechnologies).optional(),
  url: z.string().url('Must be a valid URL').max(v.urlMaxLength).optional().or(z.literal('')),
  github: z.string().url('Must be a valid URL').max(v.urlMaxLength).optional().or(z.literal('')),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  startDate: z.string().datetime().optional().or(z.literal('')),
  endDate: z.string().datetime().optional().or(z.literal('')),
})

export const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(v.titleMaxLength),
  slug: z.string().min(1, 'Slug is required').max(v.titleMaxLength).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  excerpt: z.string().max(v.descriptionMaxLength).optional(),
  content: z.string().min(1, 'Content is required').max(v.postContentMaxLength),
  coverImage: z.string().url('Must be a valid URL').max(v.urlMaxLength).optional().or(z.literal('')),
  tags: z.array(z.string().max(v.tagMaxLength)).max(v.maxTags).optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
})

export const testimonialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(v.nameMaxLength),
  role: z.string().max(v.nameMaxLength).optional(),
  company: z.string().max(v.nameMaxLength).optional(),
  content: z.string().min(1, 'Content is required').max(2000),
  avatar: z.string().url('Must be a valid URL').max(v.urlMaxLength).optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5).optional(),
  featured: z.boolean().optional(),
  approved: z.boolean().optional(),
})

export const teamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(v.nameMaxLength),
  role: z.string().min(1, 'Role is required').max(v.nameMaxLength),
  bio: z.string().max(v.contentMaxLength).optional(),
  image: z.string().url('Must be a valid URL').max(v.urlMaxLength).optional().or(z.literal('')),
  email: z.string().email('Must be a valid email').max(v.emailMaxLength).optional().or(z.literal('')),
  linkedin: z.string().url('Must be a valid URL').max(v.urlMaxLength).optional().or(z.literal('')),
  github: z.string().url('Must be a valid URL').max(v.urlMaxLength).optional().or(z.literal('')),
  twitter: z.string().url('Must be a valid URL').max(v.urlMaxLength).optional().or(z.literal('')),
  order: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(v.passwordMinLength, `Password must be at least ${v.passwordMinLength} characters`),
  newPassword: z.string().min(v.passwordMinLength, `Password must be at least ${v.passwordMinLength} characters`).max(v.passwordMaxLength),
})

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(v.nameMaxLength),
})

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: string[] }

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
  return { success: false, errors }
}