import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Nedcloud Solutions',
  description: 'Terms of service for Nedcloud Solutions - Terms and conditions governing the use of our services.',
}

export default function TermsPage() {
  return (
    <div className="container-custom section-padding">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300">
              By accessing and using the services provided by Nedcloud Solutions (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), 
              you agree to be bound by these Terms of Service. If you do not agree to these terms, 
              please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Services</h2>
            <p className="text-gray-300">
              Nedcloud Solutions provides consulting services in Agentic AI, Infrastructure, Cloud & DevOps, 
              and Full-Stack Development. The specific scope and deliverables of any engagement will be 
              defined in a separate service agreement or statement of work.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Client Responsibilities</h2>
            <p className="text-gray-300 mb-4">As a client, you agree to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Provide accurate and complete information as required for the services</li>
              <li>Respond to requests for information in a timely manner</li>
              <li>Ensure access to necessary systems, data, and personnel</li>
              <li>Review and provide feedback on deliverables within agreed timeframes</li>
              <li>Make payments according to agreed payment terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Intellectual Property</h2>
            <p className="text-gray-300">
              Unless otherwise agreed in writing, all intellectual property rights in deliverables 
              created specifically for a client project shall be transferred to the client upon full payment. 
              Nedcloud Solutions retains all rights to pre-existing materials, methodologies, and tools 
              used in the provision of services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Confidentiality</h2>
            <p className="text-gray-300">
              Both parties agree to maintain the confidentiality of any proprietary or confidential 
              information shared during the course of the engagement. This obligation survives the 
              termination of services and remains in effect for a period of three (3) years thereafter.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Payment Terms</h2>
            <p className="text-gray-300">
              Payment terms will be specified in the service agreement or proposal. Unless otherwise 
              agreed, invoices are due within thirty (30) days of the invoice date. Late payments may 
              incur interest at the rate of 1.5% per month or the maximum permitted by law, whichever is less.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-300">
              To the maximum extent permitted by law, Nedcloud Solutions shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages, including loss of profits, 
              data, or business opportunities, even if advised of the possibility of such damages. 
              Our total liability shall not exceed the amount paid for the specific service giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Termination</h2>
            <p className="text-gray-300">
              Either party may terminate the service agreement with thirty (30) days written notice. 
              Upon termination, the client shall pay for all services rendered up to the termination date. 
              Sections regarding confidentiality, intellectual property, and limitation of liability 
              shall survive termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Governing Law</h2>
            <p className="text-gray-300">
              These Terms of Service shall be governed by and construed in accordance with the laws 
              of the Netherlands. Any disputes arising from these terms shall be resolved in the 
              competent courts of the Netherlands.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to Terms</h2>
            <p className="text-gray-300">
              We reserve the right to modify these Terms of Service at any time. Changes will be 
              effective immediately upon posting to our website. Your continued use of our services 
              after such changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact</h2>
            <p className="text-gray-300">
              For questions about these Terms of Service, please contact us at:
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