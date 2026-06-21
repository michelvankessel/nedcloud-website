import { prisma } from '../src/lib/prisma'

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@nedcloudsolutions.nl' },
    select: {
      id: true,
      email: true,
      role: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      password: true,
    },
  })

  console.log(JSON.stringify(user, null, 2))
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
