import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Nedcloud Solutions',
  description: 'Privacy policy for Nedcloud Solutions - GDPR compliant data protection and privacy practices.',
}

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <div className="container-custom section-padding">
          <div className="max-w-4xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
            <p className="text-gray-400 mb-8">Last updated: June 19, 2026</p>

            <div className="prose prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction and Legal Basis</h2>
                <p className="text-gray-300">
                  Nedcloud Solutions (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy in accordance with 
                  the General Data Protection Regulation (GDPR) (EU) 2016/679 and the Dutch Implementation Act of the GDPR (Uitvoeringswet AVG). 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                  when you visit our website or use our services.
                </p>
                <p className="text-gray-300 mt-4">
                  <strong className="text-white">Data Controller:</strong> Nedcloud Solutions<br />
                  <strong className="text-white">Address:</strong> Netherlands<br />
                  <strong className="text-white">Email:</strong>{' '}
                  <a href="mailto:privacy@nedcloudsolutions.nl" className="text-neon-blue hover:underline">
                    privacy@nedcloudsolutions.nl
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect and Legal Basis</h2>
                <p className="text-gray-300 mb-4">We collect and process personal data based on the following legal grounds under GDPR Article 6:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li><strong className="text-white">Personal Data (Art. 6(1)(b) - Contract):</strong> Name, email address, phone number, and company information when you contact us or enter into a service agreement.</li>
                  <li><strong className="text-white">Usage Data (Art. 6(1)(f) - Legitimate Interest):</strong> Browser type, IP address, pages visited, time spent on pages, and other diagnostic data for website optimization and security.</li>
                  <li><strong className="text-white">Cookies (Art. 6(1)(a) - Consent):</strong> We use cookies and similar tracking technologies based on your explicit consent, which you can withdraw at any time.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-300 mb-4">We process your personal data for the following purposes:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>To provide and maintain our services (performance of contract)</li>
                  <li>To respond to your inquiries and support requests (legitimate interest)</li>
                  <li>To send you updates and marketing communications (with your explicit consent)</li>
                  <li>To analyze usage patterns and improve our website (legitimate interest)</li>
                  <li>To detect and prevent fraud or technical issues (legitimate interest/legal obligation)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">4. Data Retention</h2>
                <p className="text-gray-300">
                  We retain your personal data only for as long as necessary to fulfill the purposes for which 
                  it was collected, including for the purposes of satisfying any legal, accounting, or reporting requirements. 
                  Generally, we retain contact information for 7 years after the end of our business relationship, 
                  in accordance with Dutch tax and commercial law obligations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing and International Transfers</h2>
                <p className="text-gray-300">
                  We do not sell, trade, or otherwise transfer your personal information to outside parties 
                  except to trusted third parties who assist us in operating our website, conducting our business, 
                  or servicing you, so long as those parties agree to keep this information confidential and comply 
                  with GDPR requirements.
                </p>
                <p className="text-gray-300 mt-4">
                  If we transfer your personal data outside the European Economic Area (EEA), we ensure appropriate 
                  safeguards are in place, such as Standard Contractual Clauses (SCCs) approved by the European Commission, 
                  or ensure the recipient country has an adequacy decision from the European Commission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">6. Data Security</h2>
                <p className="text-gray-300">
                  We implement appropriate technical and organizational security measures to protect your 
                  personal information against unauthorized access, alteration, disclosure, or destruction, 
                  in accordance with Article 32 of the GDPR. This includes encryption, access controls, and 
                  regular security assessments. However, no method of transmission over the Internet or electronic 
                  storage is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights Under GDPR</h2>
                <p className="text-gray-300 mb-4">
                  Under the General Data Protection Regulation (GDPR), you have the following rights regarding 
                  your personal data:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li><strong className="text-white">Right to Access (Art. 15):</strong> You have the right to request copies of your personal data.</li>
                  <li><strong className="text-white">Right to Rectification (Art. 16):</strong> You have the right to request correction of inaccurate data.</li>
                  <li><strong className="text-white">Right to Erasure (Art. 17):</strong> You have the right to request deletion of your data under certain conditions.</li>
                  <li><strong className="text-white">Right to Restrict Processing (Art. 18):</strong> You have the right to request limitation of processing.</li>
                  <li><strong className="text-white">Right to Data Portability (Art. 20):</strong> You have the right to receive your data in a structured format.</li>
                  <li><strong className="text-white">Right to Object (Art. 21):</strong> You have the right to object to processing based on legitimate interests.</li>
                </ul>
                <p className="text-gray-300 mt-4">
                  To exercise any of these rights, please contact us at{' '}
                  <a href="mailto:privacy@nedcloudsolutions.nl" className="text-neon-blue hover:underline">
                    privacy@nedcloudsolutions.nl
                  </a>. We will respond to your request within one month as required by GDPR.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">8. Right to Lodge a Complaint</h2>
                <p className="text-gray-300">
                  If you believe we have not handled your personal data in accordance with the GDPR, 
                  you have the right to lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens):
                </p>
                <p className="text-gray-300 mt-4">
                  <strong className="text-white">Autoriteit Persoonsgegevens</strong><br />
                  Bezuidenhoutseweg 30<br />
                  2594 AV Den Haag<br />
                  The Netherlands<br />
                  Website:{' '}
                  <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="text-neon-blue hover:underline">
                    autoriteitpersoonsgegevens.nl
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">9. Cookies and Tracking Technologies</h2>
                <p className="text-gray-300">
                  Our website uses cookies and similar tracking technologies based on your explicit consent 
                  (Art. 6(1)(a) GDPR), which you can withdraw at any time. We use:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
                  <li><strong className="text-white">Essential cookies:</strong> Required for the website to function properly (legal basis: legitimate interest, Art. 6(1)(f))</li>
                  <li><strong className="text-white">Analytics cookies:</strong> Help us understand how visitors interact with our website (legal basis: consent, Art. 6(1)(a))</li>
                  <li><strong className="text-white">Marketing cookies:</strong> Used to deliver relevant advertisements (legal basis: consent, Art. 6(1)(a))</li>
                </ul>
                <p className="text-gray-300 mt-4">
                  You can manage your cookie preferences at any time by clicking the cookie settings link 
                  in the footer of our website or by contacting us at{' '}
                  <a href="mailto:privacy@nedcloudsolutions.nl" className="text-neon-blue hover:underline">
                    privacy@nedcloudsolutions.nl
                  </a>.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Privacy Policy</h2>
                <p className="text-gray-300">
                  We may update this Privacy Policy from time to time to reflect changes in our practices, 
                  legal requirements, or for other operational reasons. We will notify you of any material 
                  changes by posting the updated policy on this page with a revised &quot;Last updated&quot; date. 
                  For significant changes, we may also provide additional notice via email or a prominent 
                  notice on our website.
                </p>
                <p className="text-gray-300 mt-4">
                  We encourage you to review this Privacy Policy periodically to stay informed about how 
                  we are protecting your information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
                <p className="text-gray-300">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our 
                  data protection practices, please contact our Data Protection Officer:
                </p>
                <p className="text-gray-300 mt-4">
                  <strong className="text-white">Nedcloud Solutions</strong><br />
                  <strong className="text-white">Data Protection Officer</strong><br />
                  Email:{' '}
                  <a href="mailto:privacy@nedcloudsolutions.nl" className="text-neon-blue hover:underline">
                    privacy@nedcloudsolutions.nl
                  </a><br />
                  Address: Netherlands
                </p>
                <p className="text-gray-300 mt-4">
                  We will respond to your inquiry within 30 days as required by the GDPR. If you are 
                  not satisfied with our response, you have the right to lodge a complaint with the 
                  Dutch Data Protection Authority (Autoriteit Persoonsgegevens).
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
