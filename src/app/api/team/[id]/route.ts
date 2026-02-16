import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const member = await prisma.teamMember.findUnique({ where: { id } })
    
    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }
    
    return NextResponse.json(member)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch team member' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    
    const member = await prisma.teamMember.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
        bio: body.bio,
        image: body.image,
        email: body.email,
        linkedin: body.linkedin,
        github: body.github,
        twitter: body.twitter,
        order: body.order ?? 0,
        published: body.published ?? false,
      },
    })
    
    return NextResponse.json(member)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    await prisma.teamMember.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 })
  }
}