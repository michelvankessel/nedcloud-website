'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'

const projects = [
  {
    title: 'Agentic Workflow Automation',
    description: 'Multi-agent system for automated business process orchestration with real-time decision making.',
    technologies: ['Python', 'LangChain', 'OpenAI', 'FastAPI'],
    image: null,
    featured: true,
  },
  {
    title: 'Enterprise Data Center Migration',
    description: 'Led the migration of enterprise data centers with zero downtime using Cisco ACI and virtualization technologies.',
    technologies: ['Cisco ACI', 'VMware', 'NetApp', 'F5'],
    image: null,
    featured: true,
  },
  {
    title: 'Cloud-Native Application Platform',
    description: 'Built a scalable microservices platform with Kubernetes, enabling rapid deployment and auto-scaling.',
    technologies: ['Kubernetes', 'Docker', 'Terraform', 'AWS'],
    image: null,
    featured: true,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const Projects = () => {
  return (
    <section className="py-24 bg-dark-900">
      <div className="container-custom section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-neon-cyan text-sm font-medium uppercase tracking-wider">
            Portfolio
          </span>
          <h2 className="heading-lg text-white mt-4 mb-6">
            Featured Projects
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            A selection of projects showcasing expertise in AI, infrastructure, and development.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {projects.map((project, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full flex flex-col">
                <div className="aspect-video bg-dark-700 rounded-lg mb-4 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Project Preview</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {project.title}
                </h3>
                <p className="text-gray-400 text-sm flex-1 mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 text-xs rounded bg-dark-700 text-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}