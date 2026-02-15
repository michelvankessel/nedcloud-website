import { prisma } from '@/lib/prisma'
import { ServicesManager } from '@/components/admin/ServicesManager'

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: { order: 'asc' },
  })

  return <ServicesManager initialServices={services} />
}