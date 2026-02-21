import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'About | Nedcloud Solutions',
  description: 'Learn about Michel van Kessel and Nedcloud Solutions - 25+ years of IT expertise.',
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <section className="py-24 mesh-background">
          <div className="container-custom section-padding">
            <div className="max-w-4xl mx-auto">
              <span className="text-neon-blue text-sm font-medium uppercase tracking-wider">
                About
              </span>
              <h1 className="heading-xl text-white mt-4 mb-8">
                Michel van Kessel
              </h1>
              
                <div className="prose prose-invert max-w-none">
                <div className="glass-card p-8 mb-8">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    IT professional since 2000 with 25+ years across data centers, cloud, storage, servers, 
                    and networking. CCIE Data Center #44197 certified (2014), Cisco Champion for 10 consecutive 
                    years (2015-2025), Cisco Certified DevNet Associate, and certified in AI Solutions on 
                    Cisco Infrastructure Essentials. TOGAF and CompTIA Security+ certified.
                  </p>
                  <p className="text-gray-300 text-lg leading-relaxed mt-4">
                    That foundation taught me how complex systems break, scale, and evolve. Now I'm applying that expertise to the next paradigm shift: <strong className="text-white">Agentic AI for infrastructure and full-stack platforms</strong>.
                  </p>
                </div>

                <h2 className="text-2xl font-bold text-white mt-12 mb-6">The Foundation</h2>
                <div className="glass-card p-6 mb-6">
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-neon-blue mr-2">•</span>
                      <span>25+ years designing and operating enterprise infrastructure at scale</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-neon-blue mr-2">•</span>
                      <span>Deep networking expertise: Cisco CCIE Data Center, Palo Alto, Fortinet, LB, SDN, SDWAN</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-neon-blue mr-2">•</span>
                      <span>Cloud architecture: Azure, AWS, GCP, hybrid/multi-cloud environments</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-neon-blue mr-2">•</span>
                      <span>Storage and compute: NetApp, VMware, containerization, Docker</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-neon-blue mr-2">•</span>
                      <span>Industry certifications: TOGAF, Cisco CCIE Data Center, Microsoft (Azure), NetApp Storage</span>
                    </li>
                  </ul>
                </div>

                <h2 className="text-2xl font-bold text-white mt-12 mb-6">The Transformation</h2>
                <div className="glass-card p-6 mb-6">
                  <p className="text-gray-300 mb-4">
                    Agentic AI is reshaping infrastructure operations. Moving from "tools that assist" to "agents that execute." I'm building production systems where AI agents autonomously:
                  </p>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-neon-green mr-2">→</span>
                      <span>Deploy and optimize LLMs and RAG pipelines with built-in observability and cost control</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-neon-green mr-2">→</span>
                      <span>Self-heal infrastructure through predictive monitoring, data and network traffic analysis, and incident detection</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-neon-green mr-2">→</span>
                      <span>Orchestrate multi-agent workflows that handle planning, testing, deployment, and rollback</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-neon-green mr-2">→</span>
                      <span>Automate DevOps pipelines end-to-end, from code generation to production monitoring</span>
                    </li>
                  </ul>
                  <p className="text-gray-300 mt-4">
                    I'm not just deploying AI. I'm designing agentic infrastructure platforms where AI agents become operational assets, enabling teams to focus on strategic work.
                  </p>
                </div>

                <h2 className="text-2xl font-bold text-white mt-12 mb-6">Real-World Impact</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card p-4">
                    <h3 className="text-neon-blue font-semibold mb-2">Secure, Multi-Tenant LLM Platforms</h3>
                    <p className="text-gray-300 text-sm">Enterprise-grade LLM deployments with governance and security frameworks</p>
                  </div>
                  <div className="glass-card p-4">
                    <h3 className="text-neon-blue font-semibold mb-2">Internal AI Ops Assistants</h3>
                    <p className="text-gray-300 text-sm">AI agents that troubleshoot, analyze, and escalate infrastructure issues</p>
                  </div>
                  <div className="glass-card p-4">
                    <h3 className="text-neon-blue font-semibold mb-2">Infrastructure-as-Code with AI</h3>
                    <p className="text-gray-300 text-sm">AI agents in secure environments that propose, test, and deploy changes</p>
                  </div>
                  <div className="glass-card p-4">
                    <h3 className="text-neon-blue font-semibold mb-2">Predictive Systems</h3>
                    <p className="text-gray-300 text-sm">Configurations that prevent failures before they cascade</p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mt-12 mb-6">What This Means for Organizations</h2>
                <div className="glass-card p-6">
                  <p className="text-gray-300 leading-relaxed">
                    AI agents will reshape teams, with enterprises rapidly reducing human-in-the-loop involvement as agent autonomy increases. Infrastructure isn't just "being automated", it's becoming self-aware. Teams need people who understand both traditional infrastructure and how to build governance, orchestration, and security frameworks around autonomous AI agents.
                  </p>
                  <p className="text-gray-300 leading-relaxed mt-4">
                    Because of my background as Lead Technical Consultant and Senior Engineer, I bridge strategy and execution. I partner with teams to define and troubleshoot issues, architect solutions, and lead implementations into production.
                  </p>
                </div>

                <h2 className="text-2xl font-bold text-white mt-8 mb-4">Experience</h2>
                <div className="space-y-4">
                  <div className="glass-card p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-neon-blue">Routz</h3>
                        <p className="text-gray-400">IT Consulting & Infrastructure</p>
                      </div>
                      <span className="text-gray-500 text-sm">Netherlands</span>
                    </div>
                    <p className="text-gray-300 mt-2">
                      Consulting for enterprise clients across various industries, specializing 
                      in data center infrastructure, cloud migrations, and network architecture.
                    </p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mt-12 mb-6">Skills & Expertise</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    'CCIE Data Center',
                    'Cisco ACI & SDN',
                    'Palo Alto / Fortinet',
                    'Azure / AWS / GCP',
                    'VMware / NetApp',
                    'LLM Deployment',
                    'RAG Implementation',
                    'Multi-Agent Systems',
                    'Infrastructure-as-Code',
                    'Python / TypeScript',
                    'Docker / Kubernetes',
                    'TOGAF Architecture',
                  ].map((skill) => (
                    <div key={skill} className="glass-card p-3 text-center">
                      <span className="text-gray-300 text-sm">{skill}</span>
                    </div>
                  ))}
                </div>

                <h2 className="text-2xl font-bold text-white mt-8 mb-4">Languages</h2>
                <div className="flex flex-wrap gap-4">
                  {[
                    { lang: 'Dutch', level: 'Native' },
                    { lang: 'English', level: 'Professional' },
                    { lang: 'Portuguese', level: 'Professional' },
                    { lang: 'Spanish', level: 'Elementary' },
                    { lang: 'German', level: 'Elementary' },
                    { lang: 'Italian', level: 'Elementary' },
                  ].map(({ lang, level }) => (
                    <div key={lang} className="glass-card px-4 py-2">
                      <span className="text-gray-200">{lang}</span>
                      <span className="text-gray-500 text-sm ml-2">({level})</span>
                    </div>
                  ))}
                </div>

                <h2 className="text-2xl font-bold text-white mt-8 mb-4">Certifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'CCIE Data Center #44197',
                    'Cisco Certified DevNet Associate',
                    'Cisco Champion 2015-2025',
                    'AI Solutions on Cisco Infrastructure Essentials',
                    'CompTIA Security+',
                    'Microsoft Azure Fundamentals',
                    'LFS211: Linux Networking and Administration',
                    'TOGAF Certified',
                  ].map((cert) => (
                    <div key={cert} className="glass-card p-4">
                      <span className="text-gray-200">{cert}</span>
                    </div>
                  ))}
                </div>

                <h2 className="text-2xl font-bold text-white mt-8 mb-4">Current Focus</h2>
                <p className="text-gray-300">
                  Now expanding into Agentic AI and full-stack development, combining decades 
                  of infrastructure expertise with modern AI capabilities to build intelligent 
                  automation solutions.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}