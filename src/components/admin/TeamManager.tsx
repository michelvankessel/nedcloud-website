'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Linkedin, Github, Twitter, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string | null
  image: string | null
  email: string | null
  linkedin: string | null
  github: string | null
  twitter: string | null
  order: number
  published: boolean
}

const emptyTeamMember: Partial<TeamMember> = {
  name: '',
  role: '',
  bio: '',
  image: '',
  email: '',
  linkedin: '',
  github: '',
  twitter: '',
  order: 0,
  published: false,
}

export function TeamManager({ initialMembers }: { initialMembers: TeamMember[] }) {
  const [members, setMembers] = useState(initialMembers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Partial<TeamMember> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const openAddModal = () => {
    setEditingMember(emptyTeamMember)
    setIsModalOpen(true)
  }

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingMember(null)
  }

  const handleSave = async () => {
    if (!editingMember?.name || !editingMember?.role) return

    setIsSaving(true)

    try {
      const isEditing = 'id' in editingMember && editingMember.id
      const url = isEditing 
        ? `/api/team/${editingMember.id}` 
        : '/api/team'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMember),
      })

      if (response.ok) {
        const savedMember = await response.json()
        
        if (isEditing) {
          setMembers(members.map(m => m.id === savedMember.id ? savedMember : m))
        } else {
          setMembers([...members, savedMember])
        }
        
        closeModal()
      }
    } catch (error) {
      console.error('Failed to save team member:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const togglePublished = async (id: string, published: boolean) => {
    try {
      await fetch(`/api/team/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published }),
      })
      setMembers(members.map(m => m.id === id ? { ...m, published } : m))
    } catch (error) {
      console.error('Failed to update team member:', error)
    }
  }

  const deleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return
    
    try {
      await fetch(`/api/team/${id}`, { method: 'DELETE' })
      setMembers(members.filter(m => m.id !== id))
    } catch (error) {
      console.error('Failed to delete team member:', error)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Team Members</h1>
        <Button variant="primary" iconLeft={<Plus size={18} />} onClick={openAddModal}>
          Add Team Member
        </Button>
      </div>

      <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700/50">
              <th className="text-left p-4 text-gray-400 font-medium">Name</th>
              <th className="text-left p-4 text-gray-400 font-medium">Role</th>
              <th className="text-left p-4 text-gray-400 font-medium">Links</th>
              <th className="text-left p-4 text-gray-400 font-medium">Status</th>
              <th className="text-left p-4 text-gray-400 font-medium">Order</th>
              <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-dark-700/30 last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {member.image ? (
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-gray-500">
                        {member.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-white font-medium">{member.name}</div>
                      {member.email && (
                        <div className="text-gray-500 text-sm">{member.email}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-gray-400">{member.role}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {member.linkedin && (
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-neon-blue">
                        <Linkedin size={16} />
                      </a>
                    )}
                    {member.github && (
                      <a href={member.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                        <Github size={16} />
                      </a>
                    )}
                    {member.twitter && (
                      <a href={member.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-neon-blue">
                        <Twitter size={16} />
                      </a>
                    )}
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="text-gray-400 hover:text-neon-green">
                        <Mail size={16} />
                      </a>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => togglePublished(member.id, !member.published)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      member.published
                        ? 'bg-neon-green/10 text-neon-green'
                        : 'bg-gray-600/10 text-gray-400'
                    }`}
                  >
                    {member.published ? <Eye size={14} /> : <EyeOff size={14} />}
                    {member.published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="p-4 text-gray-400">{member.order}</td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteMember(member.id)}
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

        {members.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No team members found. Add your first team member to get started.
          </div>
        )}
      </div>

      {isModalOpen && editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-xl font-bold text-white">
                {'id' in editingMember && editingMember.id ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Name *"
                  value={editingMember.name || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  placeholder="John Doe"
                />

                <Input
                  label="Role *"
                  value={editingMember.role || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                <textarea
                  value={editingMember.bio || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
                  placeholder="Short bio about the team member"
                  rows={3}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-all resize-none"
                />
              </div>

              <Input
                label="Image URL"
                value={editingMember.image || ''}
                onChange={(e) => setEditingMember({ ...editingMember, image: e.target.value })}
                placeholder="https://example.com/photo.jpg"
              />

              <Input
                label="Email"
                type="email"
                value={editingMember.email || ''}
                onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                placeholder="john@nedcloudsolutions.nl"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="LinkedIn URL"
                  value={editingMember.linkedin || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />

                <Input
                  label="GitHub URL"
                  value={editingMember.github || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, github: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>

              <Input
                label="Twitter URL"
                value={editingMember.twitter || ''}
                onChange={(e) => setEditingMember({ ...editingMember, twitter: e.target.value })}
                placeholder="https://twitter.com/..."
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Display Order"
                  type="number"
                  value={editingMember.order || 0}
                  onChange={(e) => setEditingMember({ ...editingMember, order: parseInt(e.target.value) || 0 })}
                />

                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="member-published"
                    checked={editingMember.published || false}
                    onChange={(e) => setEditingMember({ ...editingMember, published: e.target.checked })}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-neon-blue focus:ring-neon-blue/50"
                  />
                  <label htmlFor="member-published" className="text-gray-300 ml-3">Published</label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-dark-700">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
                {isSaving ? 'Saving...' : 'Save Team Member'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}