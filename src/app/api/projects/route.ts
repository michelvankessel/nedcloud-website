import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'
    
    const projects = await prisma.project.findMany({
      where: all ? {} : { published: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    })
    
    if (!adminUser) {
      return NextResponse.json({ error: 'No admin user found' }, { status: 500 })
    }
    
    const project = await prisma.project.create({
      data: {
        title: body.title,
        slug: body.slug,
        description: body.description,
        content: body.content || '',
        image: body.image,
        technologies: body.technologies || [],
        url: body.url,
        github: body.github,
        featured: body.featured || false,
        published: body.published || false,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        authorId: adminUser.id,
        serviceId: body.serviceId,
      },
    })
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}