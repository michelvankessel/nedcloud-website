'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Star, Check, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Testimonial {
  id: string
  name: string
  role: string | null
  company: string | null
  content: string
  avatar: string | null
  rating: number
  featured: boolean
  approved: boolean
}

const emptyTestimonial: Partial<Testimonial> = {
  name: '',
  role: '',
  company: '',
  content: '',
  avatar: '',
  rating: 5,
  featured: false,
  approved: false,
}

export function TestimonialsManager({ initialTestimonials }: { initialTestimonials: Testimonial[] }) {
  const [testimonials, setTestimonials] = useState(initialTestimonials)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const openAddModal = () => {
    setEditingTestimonial(emptyTestimonial)
    setIsModalOpen(true)
  }

  const openEditModal = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTestimonial(null)
  }

  const handleSave = async () => {
    if (!editingTestimonial?.name || !editingTestimonial?.content) return

    setIsSaving(true)

    try {
      const isEditing = 'id' in editingTestimonial && editingTestimonial.id
      const url = isEditing 
        ? `/api/testimonials/${editingTestimonial.id}` 
        : '/api/testimonials'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTestimonial),
      })

      if (response.ok) {
        const savedTestimonial = await response.json()
        
        if (isEditing) {
          setTestimonials(testimonials.map(t => t.id === savedTestimonial.id ? savedTestimonial : t))
        } else {
          setTestimonials([...testimonials, savedTestimonial])
        }
        
        closeModal()
      }
    } catch (error) {
      console.error('Failed to save testimonial:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleApproved = async (id: string, approved: boolean) => {
    try {
      await fetch(`/api/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      })
      setTestimonials(testimonials.map(t => t.id === id ? { ...t, approved } : t))
    } catch (error) {
      console.error('Failed to update testimonial:', error)
    }
  }

  const toggleFeatured = async (id: string, featured: boolean) => {
    try {
      await fetch(`/api/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured }),
      })
      setTestimonials(testimonials.map(t => t.id === id ? { ...t, featured } : t))
    } catch (error) {
      console.error('Failed to update testimonial:', error)
    }
  }

  const deleteTestimonial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return
    
    try {
      await fetch(`/api/testimonials/${id}`, { method: 'DELETE' })
      setTestimonials(testimonials.filter(t => t.id !== id))
    } catch (error) {
      console.error('Failed to delete testimonial:', error)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Testimonials</h1>
        <Button variant="primary" iconLeft={<Plus size={18} />} onClick={openAddModal}>
          Add Testimonial
        </Button>
      </div>

      <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700/50">
              <th className="text-left p-4 text-gray-400 font-medium">Name</th>
              <th className="text-left p-4 text-gray-400 font-medium">Rating</th>
              <th className="text-left p-4 text-gray-400 font-medium">Approved</th>
              <th className="text-left p-4 text-gray-400 font-medium">Featured</th>
              <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {testimonials.map((testimonial) => (
              <tr key={testimonial.id} className="border-b border-dark-700/30 last:border-0">
                <td className="p-4">
                  <div className="text-white font-medium">{testimonial.name}</div>
                  {testimonial.role && testimonial.company && (
                    <div className="text-gray-500 text-sm">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  )}
                  <div className="text-gray-400 text-sm truncate max-w-sm mt-1">
                    {testimonial.content}
                  </div>
                </td>
                <td className="p-4">
                  {renderStars(testimonial.rating)}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleApproved(testimonial.id, !testimonial.approved)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      testimonial.approved
                        ? 'bg-neon-green/10 text-neon-green'
                        : 'bg-gray-600/10 text-gray-400'
                    }`}
                  >
                    {testimonial.approved ? <CheckCircle size={14} /> : <X size={14} />}
                    {testimonial.approved ? 'Approved' : 'Pending'}
                  </button>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleFeatured(testimonial.id, !testimonial.featured)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      testimonial.featured
                        ? 'bg-neon-blue/10 text-neon-blue'
                        : 'bg-gray-600/10 text-gray-400'
                    }`}
                  >
                    <Star size={14} className={testimonial.featured ? 'fill-current' : ''} />
                    {testimonial.featured ? 'Featured' : 'Normal'}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(testimonial)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteTestimonial(testimonial.id)}
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

        {testimonials.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No testimonials found. Add your first testimonial to get started.
          </div>
        )}
      </div>

      {isModalOpen && editingTestimonial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-xl font-bold text-white">
                {'id' in editingTestimonial && editingTestimonial.id ? 'Edit Testimonial' : 'Add Testimonial'}
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
                label="Name *"
                value={editingTestimonial.name || ''}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })}
                placeholder="John Doe"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Role"
                  value={editingTestimonial.role || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, role: e.target.value })}
                  placeholder="CEO"
                />

                <Input
                  label="Company"
                  value={editingTestimonial.company || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, company: e.target.value })}
                  placeholder="Acme Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content *</label>
                <textarea
                  value={editingTestimonial.content || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, content: e.target.value })}
                  placeholder="What did the client say about your work?"
                  rows={4}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-all resize-none"
                />
              </div>

              <Input
                label="Avatar URL"
                value={editingTestimonial.avatar || ''}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, avatar: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setEditingTestimonial({ ...editingTestimonial, rating })}
                      className="p-2 rounded-lg transition-colors hover:bg-dark-700"
                    >
                      <Star
                        size={24}
                        className={rating <= (editingTestimonial.rating || 5) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-600'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="approved"
                    checked={editingTestimonial.approved || false}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, approved: e.target.checked })}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-neon-green focus:ring-neon-green/50"
                  />
                  <label htmlFor="approved" className="text-gray-300">Approved</label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="featured-testimonial"
                    checked={editingTestimonial.featured || false}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-neon-blue focus:ring-neon-blue/50"
                  />
                  <label htmlFor="featured-testimonial" className="text-gray-300">Featured</label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-dark-700">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
                {isSaving ? 'Saving...' : 'Save Testimonial'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}