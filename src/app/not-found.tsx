import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen mesh-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-bold gradient-text mb-4">404</h1>
        <h2 className="text-2xl text-gray-400 mb-8">Page not found</h2>
        <Link
          href="/"
          className="btn-primary inline-block"
        >
          Return home
        </Link>
      </div>
    </div>
  )
}