import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { securityConfig } from '../src/lib/security.config'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nedcloudsolutions.nl'
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123'

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin User',
      password: await hash(adminPassword, securityConfig.session.passwordHashRounds),
      role: 'ADMIN',
    },
  })

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      siteName: 'Nedcloud Solutions',
      siteTagline: 'Agentic AI & Infrastructure Consulting',
      siteDescription: 'Expert consulting in Agentic AI, Infrastructure, and Full-Stack Development. 25+ years of experience in data centers, cloud, storage, and servers.',
      email: 'info@nedcloudsolutions.nl',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/michelvankessel',
        github: 'https://github.com/NedCloud',
      },
    },
  })

  const services = [
    {
      title: 'Agentic AI Solutions',
      slug: 'agentic-ai',
      description: 'Intelligent autonomous agents that automate complex workflows and decision-making processes.',
      content: 'We design and implement agentic AI systems that can reason, plan, and execute complex tasks autonomously. From proof-of-concept to production deployment.',
      icon: 'brain',
      features: ['Autonomous Decision Making', 'Multi-Agent Systems', 'Tool Integration', 'Production Deployment'],
      order: 1,
      published: true,
    },
    {
      title: 'Infrastructure Architecture',
      slug: 'infrastructure',
      description: 'Design and implement robust, scalable infrastructure for modern applications.',
      content: 'Enterprise-grade infrastructure design with a focus on reliability, security, and performance. CCIE-certified expertise in data center technologies.',
      icon: 'server',
      features: ['Network Design', 'Cloud Migration', 'Hybrid Cloud', 'High Availability'],
      order: 2,
      published: true,
    },
    {
      title: 'Cloud & DevOps',
      slug: 'cloud',
      description: 'Modernize your deployment pipeline with cloud-native practices.',
      content: 'Streamline your development workflow with CI/CD pipelines, container orchestration, and infrastructure as code.',
      icon: 'cloud',
      features: ['CI/CD Pipelines', 'Kubernetes', 'Docker', 'Infrastructure as Code'],
      order: 3,
      published: true,
    },
    {
      title: 'Full-Stack Development',
      slug: 'fullstack',
      description: 'End-to-end application development from concept to deployment.',
      content: 'Modern web applications built with the latest technologies. TypeScript, React, Next.js, Node.js, and cloud services.',
      icon: 'code',
      features: ['React & Next.js', 'Node.js', 'TypeScript', 'API Development'],
      order: 4,
      published: true,
    },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: service,
    })
  }

  const testimonials = [
    {
      name: 'Dennis Wals',
      role: 'IT Infrastructure Lead',
      company: 'Enterprise Client',
      content: 'Michel van Kessel is one of the best, if not the best Cisco ACI designer and troubleshooter in the Netherlands and played an integral part in successfully migrating our datacenters.',
      rating: 5,
      featured: true,
      approved: true,
    },
  ]

  for (const testimonial of testimonials) {
    await prisma.testimonial.create({
      data: testimonial,
    })
  }

  await prisma.teamMember.upsert({
    where: { id: 'owner' },
    update: {},
    create: {
      id: 'owner',
      name: 'Michel van Kessel',
      role: 'Founder & Principal Consultant',
      bio: 'IT professional since 2000 with 25+ years across data centers, cloud, storage, servers, and networking. CCIE Data Center certified, Cisco Champion 2015-2025. Now pioneering Agentic AI solutions.',
      email: 'michel@nedcloudsolutions.nl',
      linkedin: 'https://www.linkedin.com/in/michelvankessel',
      github: 'https://github.com/NedCloud',
      order: 1,
      published: true,
    },
  })

  console.log('Seed data created successfully!')
  console.log(`Admin user: ${adminUser.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })