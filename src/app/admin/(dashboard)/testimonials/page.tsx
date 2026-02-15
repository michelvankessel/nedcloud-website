import { prisma } from '@/lib/prisma'
import { TestimonialsManager } from '@/components/admin/TestimonialsManager'

export default async function AdminTestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <TestimonialsManager initialTestimonials={testimonials} />
}