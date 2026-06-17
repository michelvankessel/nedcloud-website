import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Nedcloud Solutions | Agentic AI & Infrastructure Consulting',
  description: 'Expert consulting in Agentic AI, Infrastructure, and Full-Stack Development. 25+ years of experience in data centers, cloud, storage, and servers.',
  keywords: ['Agentic AI', 'Infrastructure Consulting', 'Cloud', 'Data Center', 'Full-Stack Development', 'Cisco', 'CCIE'],
  authors: [{ name: 'Michel van Kessel' }],
  openGraph: {
    title: 'Nedcloud Solutions | Agentic AI & Infrastructure Consulting',
    description: 'Expert consulting in Agentic AI, Infrastructure, and Full-Stack Development.',
    type: 'website',
    locale: 'en_US',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}