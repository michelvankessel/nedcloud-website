import { prisma } from '@/lib/prisma'
import { Briefcase, FolderKanban, FileText, MessageSquareQuote, Users, Mail, TrendingUp } from 'lucide-react'

const stats = [
  { label: 'Services', icon: Briefcase, color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
  { label: 'Projects', icon: FolderKanban, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10' },
  { label: 'Blog Posts', icon: FileText, color: 'text-neon-purple', bg: 'bg-neon-purple/10' },
  { label: 'Testimonials', icon: MessageSquareQuote, color: 'text-neon-pink', bg: 'bg-neon-pink/10' },
  { label: 'Team Members', icon: Users, color: 'text-neon-green', bg: 'bg-neon-green/10' },
  { label: 'Contacts', icon: Mail, color: 'text-neon-orange', bg: 'bg-neon-orange/10' },
]

export default async function AdminDashboard() {
  const [
    servicesCount,
    projectsCount,
    postsCount,
    testimonialsCount,
    teamCount,
    contactsCount,
    recentContacts,
  ] = await Promise.all([
    prisma.service.count({ where: { published: true } }),
    prisma.project.count({ where: { published: true } }),
    prisma.post.count({ where: { published: true } }),
    prisma.testimonial.count({ where: { approved: true } }),
    prisma.teamMember.count({ where: { published: true } }),
    prisma.contactSubmission.count(),
    prisma.contactSubmission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const counts = [servicesCount, projectsCount, postsCount, testimonialsCount, teamCount, contactsCount]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome to the Nedcloud Solutions admin panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{counts[index]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-neon-blue" />
            Recent Contact Submissions
          </h2>
          {recentContacts.length > 0 ? (
            <div className="space-y-4">
              {recentContacts.map((contact: { id: string; name: string; email: string; company: string | null; subject: string | null; message: string; status: string; createdAt: Date }) => (
                <div
                  key={contact.id}
                  className="p-4 bg-dark-700/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{contact.name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{contact.email}</p>
                  <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                    {contact.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No contact submissions yet</p>
          )}
        </div>

        <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-neon-green" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/admin/services"
              className="p-4 bg-dark-700/50 rounded-lg text-center hover:bg-dark-700 transition-colors"
            >
              <Briefcase className="w-6 h-6 text-neon-blue mx-auto mb-2" />
              <span className="text-sm text-gray-300">Add Service</span>
            </a>
            <a
              href="/admin/projects"
              className="p-4 bg-dark-700/50 rounded-lg text-center hover:bg-dark-700 transition-colors"
            >
              <FolderKanban className="w-6 h-6 text-neon-cyan mx-auto mb-2" />
              <span className="text-sm text-gray-300">Add Project</span>
            </a>
            <a
              href="/admin/blog"
              className="p-4 bg-dark-700/50 rounded-lg text-center hover:bg-dark-700 transition-colors"
            >
              <FileText className="w-6 h-6 text-neon-purple mx-auto mb-2" />
              <span className="text-sm text-gray-300">Write Post</span>
            </a>
            <a
              href="/admin/testimonials"
              className="p-4 bg-dark-700/50 rounded-lg text-center hover:bg-dark-700 transition-colors"
            >
              <MessageSquareQuote className="w-6 h-6 text-neon-pink mx-auto mb-2" />
              <span className="text-sm text-gray-300">Add Testimonial</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}