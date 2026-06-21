import { prisma } from '../src/lib/prisma'
import { hash } from 'bcryptjs'

async function fixPassword() {
  const email = 'admin@nedcloudsolutions.nl'
  const password = 'changeme-immediately-123!'
  
  // Generate hash with bcryptjs (12 rounds)
  const passwordHash = await hash(password, 12)
  
  console.log('Generated hash:', passwordHash.substring(0, 30) + '...')
  
  // Update user with new hash
  const updated = await prisma.user.update({
    where: { email },
    data: { password: passwordHash }
  })
  
  console.log('User updated:', updated.email)
}

fixPassword()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
