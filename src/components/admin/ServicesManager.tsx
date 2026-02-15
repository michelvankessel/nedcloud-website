'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Service {
  id: string
  title: string
  slug: string
  description: string
  content: string
  icon: string | null
  features: string[]
  order: number
  published: boolean
}

const emptyService: Partial<Service> = {
  title: '',
  slug: '',
  description: '',
  content: '',
  icon: '',
  features: [],
  order: 0,
  published: false,
}

export function ServicesManager({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState(initialServices)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const openAddModal = () => {
    setEditingService(emptyService)
    setIsModalOpen(true)
  }

  const openEditModal = (service: Service) => {
    setEditingService(service)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingService(null)
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (title: string) => {
    if (editingService) {
      setEditingService({
        ...editingService,
        title,
        slug: editingService.slug || generateSlug(title),
      })
    }
  }

  const handleSave = async () => {
    if (!editingService?.title || !editingService?.slug) return

    setIsSaving(true)

    try {
      const isEditing = 'id' in editingService && editingService.id
      const url = isEditing 
        ? `/api/services/${editingService.id}` 
        : '/api/services'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingService),
      })

      if (response.ok) {
        const savedService = await response.json()
        
        if (isEditing) {
          setServices(services.map(s => s.id === savedService.id ? savedService : s))
        } else {
          setServices([...services, savedService])
        }
        
        closeModal()
      }
    } catch (error) {
      console.error('Failed to save service:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const togglePublished = async (id: string, published: boolean) => {
    try {
      await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published }),
      })
      setServices(services.map(s => s.id === id ? { ...s, published } : s))
    } catch (error) {
      console.error('Failed to update service:', error)
    }
  }

  const deleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    
    try {
      await fetch(`/api/services/${id}`, { method: 'DELETE' })
      setServices(services.filter(s => s.id !== id))
    } catch (error) {
      console.error('Failed to delete service:', error)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Services</h1>
        <Button variant="primary" iconLeft={<Plus size={18} />} onClick={openAddModal}>
          Add Service
        </Button>
      </div>

      <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700/50">
              <th className="text-left p-4 text-gray-400 font-medium">Title</th>
              <th className="text-left p-4 text-gray-400 font-medium">Slug</th>
              <th className="text-left p-4 text-gray-400 font-medium">Status</th>
              <th className="text-left p-4 text-gray-400 font-medium">Order</th>
              <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-b border-dark-700/30 last:border-0">
                <td className="p-4">
                  <div className="text-white font-medium">{service.title}</div>
                  <div className="text-gray-500 text-sm truncate max-w-xs">
                    {service.description}
                  </div>
                </td>
                <td className="p-4 text-gray-400">{service.slug}</td>
                <td className="p-4">
                  <button
                    onClick={() => togglePublished(service.id, !service.published)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      service.published
                        ? 'bg-neon-green/10 text-neon-green'
                        : 'bg-gray-600/10 text-gray-400'
                    }`}
                  >
                    {service.published ? <Eye size={14} /> : <EyeOff size={14} />}
                    {service.published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="p-4 text-gray-400">{service.order}</td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(service)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteService(service.id)}
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

        {services.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No services found. Add your first service to get started.
          </div>
        )}
      </div>

      {isModalOpen && editingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-xl font-bold text-white">
                {'id' in editingService && editingService.id ? 'Edit Service' : 'Add Service'}
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
                value={editingService.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Service title"
              />

              <Input
                label="Slug"
                value={editingService.slug || ''}
                onChange={(e) => setEditingService({ ...editingService, slug: e.target.value })}
                placeholder="url-slug"
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  placeholder="Brief description"
                  rows={2}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                <textarea
                  value={editingService.content || ''}
                  onChange={(e) => setEditingService({ ...editingService, content: e.target.value })}
                  placeholder="Full service description"
                  rows={4}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Icon"
                  value={editingService.icon || ''}
                  onChange={(e) => setEditingService({ ...editingService, icon: e.target.value })}
                  placeholder="brain, server, cloud, code"
                />

                <Input
                  label="Order"
                  type="number"
                  value={editingService.order || 0}
                  onChange={(e) => setEditingService({ ...editingService, order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Features (one per line)</label>
                <textarea
                  value={editingService.features?.join('\n') || ''}
                  onChange={(e) => setEditingService({ 
                    ...editingService, 
                    features: e.target.value.split('\n').filter(f => f.trim()) 
                  })}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  rows={4}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  checked={editingService.published || false}
                  onChange={(e) => setEditingService({ ...editingService, published: e.target.checked })}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-neon-blue focus:ring-neon-blue/50"
                />
                <label htmlFor="published" className="text-gray-300">Published</label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-dark-700">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
                {isSaving ? 'Saving...' : 'Save Service'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}