import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Nedcloud Solutions',
  description: 'Privacy policy for Nedcloud Solutions - How we collect, use, and protect your data.',
}

export default function PrivacyPage() {
  return (
    <div className="container-custom section-padding">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-300">
              Nedcloud Solutions (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you visit our website or use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <p className="text-gray-300 mb-4">We may collect information about you in various ways, including:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li><strong className="text-white">Personal Data:</strong> Name, email address, phone number, and company information when you contact us or subscribe to our newsletter.</li>
              <li><strong className="text-white">Usage Data:</strong> Browser type, IP address, pages visited, time spent on pages, and other diagnostic data.</li>
              <li><strong className="text-white">Cookies:</strong> We use cookies and similar tracking technologies to track activity on our website and hold certain information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">We use the information we collect in the following ways:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>To provide and maintain our services</li>
              <li>To respond to your inquiries and support requests</li>
              <li>To send you updates and marketing communications (with your consent)</li>
              <li>To analyze usage patterns and improve our website</li>
              <li>To detect and prevent fraud or technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing and Disclosure</h2>
            <p className="text-gray-300">
              We do not sell, trade, or otherwise transfer your personal information to outside parties 
              except to trusted third parties who assist us in operating our website, conducting our business, 
              or servicing you, so long as those parties agree to keep this information confidential.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
            <p className="text-gray-300">
              We implement appropriate technical and organizational security measures to protect your 
              personal information against unauthorized access, alteration, disclosure, or destruction. 
              However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p className="text-gray-300 mb-4">Under applicable data protection laws, you have the right to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies</h2>
            <p className="text-gray-300">
              Our website uses cookies to enhance your browsing experience. You can choose to accept or 
              decline cookies through your browser settings. However, disabling cookies may limit some 
              functionality of our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
            <p className="text-gray-300">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-gray-300 mt-2">
              <strong className="text-white">Email:</strong>{' '}
              <a href="mailto:info@nedcloudsolutions.nl" className="text-neon-blue hover:underline">
                info@nedcloudsolutions.nl
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}