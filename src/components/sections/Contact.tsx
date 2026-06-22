'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Mail, User, Building, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formTimestampRef = useRef(Date.now())

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const form = e.currentTarget
    const formData = new FormData(form)
    
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string || undefined,
      subject: formData.get('subject') as string || undefined,
      message: formData.get('message') as string,
      _hp: formData.get('_hp') as string || undefined,
      _ts: formData.get('_ts') as string || undefined,
    }
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (response.ok) {
        setIsSubmitted(true)
      } else {
        const result = await response.json()
        setError(result.error || 'Failed to send message')
      }
    } catch {
      setError('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="py-24 bg-dark-900 mesh-background">
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-neon-green text-sm font-medium uppercase tracking-wider">
              Contact
            </span>
            <h2 className="heading-lg text-white mt-4 mb-6">
              Let&apos;s Work Together
            </h2>
            <p className="text-gray-400 mb-8">
              Ready to transform your infrastructure or explore AI solutions? 
              I&apos;d love to hear about your project and discuss how I can help.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-gray-300">
                <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-neon-blue">
                  <Mail size={20} />
                </div>
                <span>info@nedcloudsolutions.nl</span>
              </div>
              <div className="flex items-center gap-4 text-gray-300">
                <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-neon-blue">
                  <Building size={20} />
                </div>
                <span>Netherlands</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {isSubmitted ? (
              <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-8 border border-dark-700/50 text-center">
                <div className="w-16 h-16 rounded-full bg-neon-green/20 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-neon-green" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
                <p className="text-gray-400">Thank you for reaching out. I&apos;ll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
                {error && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <Input
                      name="name"
                      placeholder="Your Name"
                      required
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <Input
                      name="email"
                      type="email"
                      placeholder="Email Address"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <Input
                      name="company"
                      placeholder="Company (optional)"
                      className="pl-10"
                    />
                </div>
                <div>
                  <textarea
                    name="message"
                    placeholder="Tell me about your project..."
                    required
                    rows={5}
                    suppressHydrationWarning
                    className="w-full px-4 py-3 bg-dark-800/50 border border-dark-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-all resize-none"
                  />
                </div>
                <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px]">
                  <label htmlFor="_hp">Website</label>
                  <input
                    type="text"
                    id="_hp"
                    name="_hp"
                    tabIndex={-1}
                    suppressHydrationWarning
                  />
<input
  type="hidden"
  name="_ts"
  value={formTimestampRef.current}
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isSubmitting}
                  iconRight={!isSubmitting ? <Send size={18} /> : undefined}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}