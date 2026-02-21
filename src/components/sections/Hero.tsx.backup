'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Cpu, Cloud, Code, Network } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const highlights = [
  { icon: Cpu, label: 'Agentic AI', value: 'Solutions' },
  { icon: Network, label: '25+', value: 'Years Experience' },
  { icon: Cloud, label: 'CCIE', value: 'Data Center' },
  { icon: Code, label: 'Full-Stack', value: 'Development' },
]

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center mesh-background overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-950/50 to-dark-950" />
      
      <div className="container-custom section-padding relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-dark-800/50 border border-dark-700 text-neon-blue text-sm font-medium mb-6">
              Infrastructure & AI Consulting
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="heading-xl text-white mb-6"
          >
            Building the Future with{' '}
            <span className="gradient-text">Agentic AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto"
          >
            Expert consulting in infrastructure, cloud, and intelligent automation.
            From data center architecture to cutting-edge AI agents.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href="/contact">
              <Button variant="primary" iconRight={<ArrowRight size={18} />}>
                Start a Project
              </Button>
            </Link>
            <Link href="/services">
              <Button variant="secondary">View Services</Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
          >
            {highlights.map((item, index) => (
              <div
                key={index}
                className="glass-card px-4 py-4 text-center"
              >
                <item.icon className="w-6 h-6 text-neon-blue mx-auto mb-2" />
                <div className="text-lg font-semibold text-white">{item.value}</div>
                <div className="text-sm text-gray-400">{item.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-950 to-transparent" />
    </section>
  )
}