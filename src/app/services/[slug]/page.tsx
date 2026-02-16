import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ArrowRight, Check, Cpu, Server, Cloud, Code } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { sanitizeHtml } from '@/lib/sanitize'

export const dynamic = 'force-dynamic'

const iconMap: Record<string, typeof Cpu> = {
  brain: Cpu,
  server: Server,
  cloud: Cloud,
  code: Code,
}

interface ServicePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params
  const service = await prisma.service.findUnique({
    where: { slug },
  })

  if (!service) {
    return { title: 'Service Not Found' }
  }

  return {
    title: `${service.title} | Nedcloud Solutions`,
    description: service.description,
  }
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params
  const service = await prisma.service.findUnique({
    where: { slug },
  })

  if (!service || !service.published) {
    notFound()
  }

  const IconComponent = iconMap[service.icon || ''] || Cpu

  return (
    <>
      <Header />
      <main className="pt-20">
        <section className="py-24 mesh-background">
          <div className="container-custom section-padding">
            <div className="max-w-4xl mx-auto">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Services
              </Link>

              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                  <IconComponent className="w-8 h-8 text-neon-blue" />
                </div>
                <h1 className="heading-xl text-white">{service.title}</h1>
              </div>

              <p className="text-xl text-gray-400 mb-12">
                {service.description}
              </p>

              <div className="glass-card p-8 mb-12">
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(service.content.replace(/\n/g, '<br />')) }}
                />
              </div>

              {service.features.length > 0 && (
                <div className="mb-12">
                  <h2 className="heading-md text-white mb-6">Key Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 bg-dark-800/50 rounded-lg border border-dark-700/50"
                      >
                        <Check className="w-5 h-5 text-neon-green flex-shrink-0" />
                        <span className="text-gray-200">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact">
                  <Button variant="primary" iconRight={<ArrowRight size={18} />}>
                    Get Started
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button variant="secondary">View Related Projects</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}