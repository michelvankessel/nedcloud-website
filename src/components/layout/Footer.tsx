'use client'

import Link from 'next/link'
import { Mail } from 'lucide-react'
import { LinkedinIcon, GithubIcon } from '@/components/ui/BrandIcons'

const footerLinks = {
  services: [
    { href: '/services/agentic-ai', label: 'Agentic AI' },
    { href: '/services/infrastructure', label: 'Infrastructure' },
    { href: '/services/cloud', label: 'Cloud & DevOps' },
    { href: '/services/fullstack', label: 'Full-Stack' },
  ],
  company: [
    { href: '/about', label: 'About' },
    { href: '/projects', label: 'Projects' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
  ],
}

const socialLinks = [
  { href: 'https://www.linkedin.com/in/michelvankessel', icon: LinkedinIcon, label: 'LinkedIn' },
  { href: 'https://github.com/NedCloud', icon: GithubIcon, label: 'GitHub' },
  { href: 'mailto:info@nedcloudsolutions.nl', icon: Mail, label: 'Email' },
]

export const Footer = () => {
  return (
    <footer className="bg-dark-950 border-t border-dark-700/50">
      <div className="container-custom section-padding !py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="text-xl font-bold text-white">
                Nedcloud Solutions
              </span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-md">
              Expert consulting in Agentic AI, Infrastructure, and Full-Stack Development.
              25+ years of experience transforming businesses with technology.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-gray-400 hover:text-neon-blue hover:bg-dark-700 transition-all"
                  aria-label={link.label}
                >
                  <link.icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-dark-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Nedcloud Solutions. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}