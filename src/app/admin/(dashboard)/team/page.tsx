import { prisma } from '@/lib/prisma'
import { TeamManager } from '@/components/admin/TeamManager'

export default async function AdminTeamPage() {
  const team = await prisma.teamMember.findMany({
    orderBy: { order: 'asc' },
  })

  return <TeamManager initialMembers={team} />
}