'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  FolderKanban,
  FileText,
  MessageSquareQuote,
  Users,
  Mail,
  LogOut,
  ChevronLeft,
  Settings,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/services', icon: Briefcase, label: 'Services' },
  { href: '/admin/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/admin/blog', icon: FileText, label: 'Blog' },
  { href: '/admin/testimonials', icon: MessageSquareQuote, label: 'Testimonials' },
  { href: '/admin/team', icon: Users, label: 'Team' },
  { href: '/admin/contacts', icon: Mail, label: 'Contacts' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-dark-900 border-r border-dark-700 flex flex-col">
      <div className="p-4 border-b border-dark-700">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={16} />
          <span className="text-sm">Back to site</span>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href))
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                      : 'text-gray-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-dark-700">
        <button
          onClick={() => signOut({ callbackUrl: `${window.location.origin}/admin/login` })}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-dark-800 transition-all"
        >
          <LogOut size={20} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}