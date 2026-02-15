'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Star, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImage: string | null
  tags: string[]
  featured: boolean
  published: boolean
  publishedAt: Date | null
}

const emptyPost: Partial<Post> = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  tags: [],
  featured: false,
  published: false,
  publishedAt: null,
}

export function BlogManager({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const openAddModal = () => {
    setEditingPost(emptyPost)
    setIsModalOpen(true)
  }

  const openEditModal = (post: Post) => {
    setEditingPost({
      ...post,
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingPost(null)
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (title: string) => {
    if (editingPost) {
      setEditingPost({
        ...editingPost,
        title,
        slug: editingPost.slug || generateSlug(title),
      })
    }
  }

  const handleSave = async () => {
    if (!editingPost?.title || !editingPost?.slug) return

    setIsSaving(true)

    try {
      const isEditing = 'id' in editingPost && editingPost.id
      const url = isEditing 
        ? `/api/blog/${editingPost.id}` 
        : '/api/blog'
      const method = isEditing ? 'PUT' : 'POST'

      const dataToSend = {
        ...editingPost,
        publishedAt: editingPost.published ? new Date().toISOString() : null,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })

      if (response.ok) {
        const savedPost = await response.json()
        
        if (isEditing) {
          setPosts(posts.map(p => p.id === savedPost.id ? savedPost : p))
        } else {
          setPosts([...posts, savedPost])
        }
        
        closeModal()
      }
    } catch (error) {
      console.error('Failed to save post:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const togglePublished = async (id: string, published: boolean) => {
    try {
      await fetch(`/api/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          published,
          publishedAt: published ? new Date().toISOString() : null,
        }),
      })
      setPosts(posts.map(p => p.id === id ? { 
        ...p, 
        published,
        publishedAt: published ? new Date() : null,
      } : p))
    } catch (error) {
      console.error('Failed to update post:', error)
    }
  }

  const toggleFeatured = async (id: string, featured: boolean) => {
    try {
      await fetch(`/api/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured }),
      })
      setPosts(posts.map(p => p.id === id ? { ...p, featured } : p))
    } catch (error) {
      console.error('Failed to update post:', error)
    }
  }

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    try {
      await fetch(`/api/blog/${id}`, { method: 'DELETE' })
      setPosts(posts.filter(p => p.id !== id))
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not published'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Blog Posts</h1>
        <Button variant="primary" iconLeft={<Plus size={18} />} onClick={openAddModal}>
          Add Post
        </Button>
      </div>

      <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700/50">
              <th className="text-left p-4 text-gray-400 font-medium">Title</th>
              <th className="text-left p-4 text-gray-400 font-medium">Tags</th>
              <th className="text-left p-4 text-gray-400 font-medium">Published</th>
              <th className="text-left p-4 text-gray-400 font-medium">Featured</th>
              <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-dark-700/30 last:border-0">
                <td className="p-4">
                  <div className="text-white font-medium">{post.title}</div>
                  <div className="text-gray-500 text-sm truncate max-w-xs">
                    {post.excerpt || post.content.substring(0, 100)}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                    <Calendar size={12} />
                    {formatDate(post.publishedAt)}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-neon-blue/10 text-neon-blue text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="px-2 py-0.5 bg-dark-700 text-gray-400 text-xs rounded">
                        +{post.tags.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => togglePublished(post.id, !post.published)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      post.published
                        ? 'bg-neon-green/10 text-neon-green'
                        : 'bg-gray-600/10 text-gray-400'
                    }`}
                  >
                    {post.published ? <Eye size={14} /> : <EyeOff size={14} />}
                    {post.published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleFeatured(post.id, !post.featured)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      post.featured
                        ? 'bg-yellow-400/10 text-yellow-400'
                        : 'bg-gray-600/10 text-gray-400'
                    }`}
                  >
                    <Star size={14} className={post.featured ? 'fill-current' : ''} />
                    {post.featured ? 'Featured' : 'Normal'}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(post)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
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

        {posts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No posts found. Write your first blog post to get started.
          </div>
        )}
      </div>

      {isModalOpen && editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-xl font-bold text-white">
                {'id' in editingPost && editingPost.id ? 'Edit Post' : 'Add Post'}
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
                value={editingPost.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Blog post title"
              />

              <Input
                label="Slug"
                value={editingPost.slug || ''}
                onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                placeholder="url-slug"
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Excerpt</label>
                <textarea
                  value={editingPost.excerpt || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                  placeholder="Brief summary for previews and SEO"
                  rows={2}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content (Markdown)</label>
                <textarea
                  value={editingPost.content || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  placeholder="# Heading&#10;&#10;Your blog content here..."
                  rows={12}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-all resize-none font-mono text-sm"
                />
              </div>

              <Input
                label="Cover Image URL"
                value={editingPost.coverImage || ''}
                onChange={(e) => setEditingPost({ ...editingPost, coverImage: e.target.value })}
                placeholder="https://example.com/cover.jpg"
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags (one per line)</label>
                <textarea
                  value={editingPost.tags?.join('\n') || ''}
                  onChange={(e) => setEditingPost({ 
                    ...editingPost, 
                    tags: e.target.value.split('\n').filter(t => t.trim()) 
                  })}
                  placeholder="AI&#10;Infrastructure&#10;Cloud"
                  rows={4}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="post-featured"
                    checked={editingPost.featured || false}
                    onChange={(e) => setEditingPost({ ...editingPost, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-yellow-400 focus:ring-yellow-400/50"
                  />
                  <label htmlFor="post-featured" className="text-gray-300">Featured</label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="post-published"
                    checked={editingPost.published || false}
                    onChange={(e) => setEditingPost({ ...editingPost, published: e.target.checked })}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-neon-green focus:ring-neon-green/50"
                  />
                  <label htmlFor="post-published" className="text-gray-300">Published</label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-dark-700">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
                {isSaving ? 'Saving...' : 'Save Post'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}