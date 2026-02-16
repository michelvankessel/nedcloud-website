import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { validate, serviceSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'
    
    const services = await prisma.service.findMany({
      where: all ? {} : { published: true },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(services)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    const validation = validate(serviceSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }
    
    const service = await prisma.service.create({
      data: {
        title: validation.data.title,
        slug: validation.data.slug,
        description: validation.data.description,
        content: validation.data.content || '',
        icon: validation.data.icon,
        features: validation.data.features || [],
        order: validation.data.order || 0,
        published: validation.data.published || false,
      },
    })
    return NextResponse.json(service, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}