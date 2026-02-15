import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'
    
    const posts = await prisma.post.findMany({
      where: all ? {} : { published: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(posts)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
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
    
    const post = await prisma.post.create({
      data: {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: body.content,
        coverImage: body.coverImage,
        tags: body.tags || [],
        featured: body.featured || false,
        published: body.published || false,
        publishedAt: body.published ? new Date() : null,
        authorId: adminUser.id,
      },
    })
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}