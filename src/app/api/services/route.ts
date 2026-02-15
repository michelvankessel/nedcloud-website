import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'
    
    const services = await prisma.service.findMany({
      where: all ? {} : { published: true },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(services)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const service = await prisma.service.create({
      data: {
        title: body.title,
        slug: body.slug,
        description: body.description,
        content: body.content,
        icon: body.icon,
        features: body.features || [],
        order: body.order || 0,
        published: body.published || false,
      },
    })
    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}