import { prisma } from '@/lib/prisma'
import { BlogManager } from '@/components/admin/BlogManager'

export default async function AdminBlogPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <BlogManager initialPosts={posts} />
}