import { prisma } from '../src/lib/prisma'
import { compare, hash } from 'bcryptjs'

async function debug() {
  const email = 'admin@nedcloudsolutions.nl'
  const password = 'changeme-immediately-123!'
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, password: true }
  })
  
  if (!user) {
    console.log('User not found')
    return
  }
  
  console.log('User found:', user.email)
  console.log('Password hash exists:', !!user.password)
  
  if (user.password) {
    console.log('Hash prefix:', user.password.substring(0, 7))
    const isValid = await compare(password, user.password)
    console.log('Password valid:', isValid)
  }
}

debug()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
