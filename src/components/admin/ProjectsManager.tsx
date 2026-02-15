'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Project {
  id: string
  title: string
  slug: string
  description: string
  content: string
  image: string | null
  technologies: string[]
  url: string | null
  github: string | null
  featured: boolean
  published: boolean
}

const emptyProject: Partial<Project> = {
  title: '',
  slug: '',
  description: '',
  content: '',
  image: '',
  technologies: [],
  url: '',
  github: '',
  featured: false,
  published: false,
}

export function ProjectsManager({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const openAddModal = () => {
    setEditingProject(emptyProject)
    setIsModalOpen(true)
  }

  const openEditModal = (project: Project) => {
    setEditingProject(project)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProject(null)
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (title: string) => {
    if (editingProject) {
      setEditingProject({
        ...editingProject,
        title,
        slug: editingProject.slug || generateSlug(title),
      })
    }
  }

  const handleSave = async () => {
    if (!editingProject?.title || !editingProject?.slug) return

    setIsSaving(true)

    try {
      const isEditing = 'id' in editingProject && editingProject.id
      const url = isEditing 
        ? `/api/projects/${editingProject.id}` 
        : '/api/projects'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProject),
      })

      if (response.ok) {
        const savedProject = await response.json()
        
        if (isEditing) {
          setProjects(projects.map(p => p.id === savedProject.id ? savedProject : p))
        } else {
          setProjects([...projects, savedProject])
        }
        
        closeModal()
      }
    } catch (error) {
      console.error('Failed to save project:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const togglePublished = async (id: string, published: boolean) => {
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published }),
      })
      setProjects(projects.map(p => p.id === id ? { ...p, published } : p))
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const toggleFeatured = async (id: string, featured: boolean) => {
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured }),
      })
      setProjects(projects.map(p => p.id === id ? { ...p, featured } : p))
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      setProjects(projects.filter(p => p.id !== id))
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <Button variant="primary" iconLeft={<Plus size={18} />} onClick={openAddModal}>
          Add Project
        </Button>
      </div>

      <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700/50">
              <th className="text-left p-4 text-gray-400 font-medium">Title</th>
              <th className="text-left p-4 text-gray-400 font-medium">Technologies</th>
              <th className="text-left p-4 text-gray-400 font-medium">Status</th>
              <th className="text-left p-4 text-gray-400 font-medium">Featured</th>
              <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-dark-700/30 last:border-0">
                <td className="p-4">
                  <div className="text-white font-medium">{project.title}</div>
                  <div className="text-gray-500 text-sm truncate max-w-xs">
                    {project.description}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {project.technologies.slice(0, 3).map((tech) => (
                      <span key={tech} className="px-2 py-0.5 bg-dark-700 text-gray-300 text-xs rounded">
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="px-2 py-0.5 bg-dark-700 text-gray-400 text-xs rounded">
                        +{project.technologies.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => togglePublished(project.id, !project.published)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      project.published
                        ? 'bg-neon-green/10 text-neon-green'
                        : 'bg-gray-600/10 text-gray-400'
                    }`}
                  >
                    {project.published ? <Eye size={14} /> : <EyeOff size={14} />}
                    {project.published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleFeatured(project.id, !project.featured)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      project.featured
                        ? 'bg-neon-blue/10 text-neon-blue'
                        : 'bg-gray-600/10 text-gray-400'
                    }`}
                  >
                    <Star size={14} className={project.featured ? 'fill-current' : ''} />
                    {project.featured ? 'Featured' : 'Normal'}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(project)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {projects.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No projects found. Add your first project to get started.
          </div>
        )}
      </div>

      {isModalOpen && editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-xl font-bold text-white">
                {'id' in editingProject && editingProject.id ? 'Edit Project' : 'Add Project'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Input
                label="Title"
                value={editingProject.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Project title"
              />

              <Input
                label="Slug"
                value={editingProject.slug || ''}
                onChange={(e) => setEditingProject({ ...editingProject, slug: e.target.value })}
                placeholder="url-slug"
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  placeholder="Brief description"
                  rows={2}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                <textarea
                  value={editingProject.content || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, content: e.target.value })}
                  placeholder="Full project description (markdown supported)"
                  rows={6}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-all resize-none"
                />
              </div>

              <Input
                label="Image URL"
                value={editingProject.image || ''}
                onChange={(e) => setEditingProject({ ...editingProject, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Technologies (one per line)</label>
                <textarea
                  value={editingProject.technologies?.join('\n') || ''}
                  onChange={(e) => setEditingProject({ 
                    ...editingProject, 
                    technologies: e.target.value.split('\n').filter(t => t.trim()) 
                  })}
                  placeholder="Next.js&#10;TypeScript&#10;PostgreSQL"
                  rows={4}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Live URL"
                  value={editingProject.url || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, url: e.target.value })}
                  placeholder="https://project.com"
                />

                <Input
                  label="GitHub URL"
                  value={editingProject.github || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, github: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={editingProject.featured || false}
                    onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-neon-blue focus:ring-neon-blue/50"
                  />
                  <label htmlFor="featured" className="text-gray-300">Featured</label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="project-published"
                    checked={editingProject.published || false}
                    onChange={(e) => setEditingProject({ ...editingProject, published: e.target.checked })}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-neon-blue focus:ring-neon-blue/50"
                  />
                  <label htmlFor="project-published" className="text-gray-300">Published</label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-dark-700">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
                {isSaving ? 'Saving...' : 'Save Project'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}