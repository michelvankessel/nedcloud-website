'use client'

import { useState } from 'react'
import { Mail, Building, Calendar, CheckCircle, Circle, Trash2 } from 'lucide-react'

export interface ContactSubmission {
  id: string
  name: string
  email: string
  company: string | null
  subject: string | null
  message: string
  status: 'new' | 'read' | 'replied'
  createdAt: Date
}

const statusConfig = {
  new: { label: 'New', color: 'bg-neon-blue/10 text-neon-blue', icon: Circle },
  read: { label: 'Read', color: 'bg-yellow-500/10 text-yellow-500', icon: Circle },
  replied: { label: 'Replied', color: 'bg-neon-green/10 text-neon-green', icon: CheckCircle },
}

export function ContactsManager({ initialContacts }: { initialContacts: ContactSubmission[] }) {
  const [contacts, setContacts] = useState(initialContacts)
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null)

  const updateStatus = async (id: string, status: 'new' | 'read' | 'replied') => {
    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      
      if (response.ok) {
        setContacts(contacts.map(c => c.id === id ? { ...c, status } : c))
        if (selectedContact?.id === id) {
          setSelectedContact({ ...selectedContact, status })
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const deleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return
    
    try {
      const response = await fetch(`/api/contact/${id}`, { method: 'DELETE' })
      
      if (response.ok) {
        setContacts(contacts.filter(c => c.id !== id))
        if (selectedContact?.id === id) {
          setSelectedContact(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete contact:', error)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Contact Submissions</h1>
        <div className="flex items-center gap-4 text-sm">
          {Object.entries(statusConfig).map(([key, config]) => (
            <span key={key} className="flex items-center gap-2">
              <config.icon className={`w-3 h-3 ${key === 'replied' ? '' : 'fill-current'}`} style={{ color: key === 'new' ? '#00d4ff' : key === 'read' ? '#eab308' : '#22c55e' }} />
              {config.label}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {contacts.map((contact) => {
          const config = statusConfig[contact.status] || statusConfig.new
          
          return (
            <div
              key={contact.id}
              className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-medium text-lg">{contact.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail size={14} />
                      {contact.email}
                    </span>
                    {contact.company && (
                      <span className="flex items-center gap-1">
                        <Building size={14} />
                        {contact.company}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={contact.status}
                    onChange={(e) => updateStatus(contact.id, e.target.value as 'new' | 'read' | 'replied')}
                    className={`px-3 py-1 rounded-full text-sm border-0 cursor-pointer ${config.color}`}
                  >
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                  </select>
                </div>
              </div>

              {contact.subject && (
                <p className="text-neon-blue text-sm mb-2">{contact.subject}</p>
              )}
              
              <p className="text-gray-300">{contact.message}</p>

              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-dark-700/50">
                <a
                  href={`mailto:${contact.email}`}
                  className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
                >
                  <Mail size={16} />
                  Reply
                </a>
                <button 
                  onClick={() => deleteContact(contact.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {contacts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No contact submissions yet.
        </div>
      )}
    </div>
  )
}