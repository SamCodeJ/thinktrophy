import { Briefcase, Code, Megaphone, Users, BookOpen, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';

export default function Careers() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const roles = [
    {
      title: "1. Academic Content Creators",
      icon: BookOpen,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "Do you have a deep understanding of specific subjects? We need experts to develop high-quality, challenging questions that maintain our \"academic-quality\" standard."
    },
    {
      title: "2. Software Developers",
      icon: Code,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      description: "Help Samuel and the tech team scale our infrastructure, improve security, and build a seamless user experience for thousands of concurrent players."
    },
    {
      title: "3. Marketing & Brand Growth",
      icon: Megaphone,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      description: "Work alongside Victor to expand our reach across Nigeria and help us prepare for our expansion into neighboring countries."
    },
    {
      title: "4. Community & Support",
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      description: "Help Timothy ensure every Think Trophy user has a smooth experience, from staking to withdrawing winnings."
    }
  ];

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="section max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 dark:bg-brand-blue/15 text-brand-blue flex items-center justify-center mx-auto mb-6">
            <Briefcase size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-brand-dark dark:text-white mb-4">
            Careers at Think Trophy
          </h1>
          <p className="text-xl font-semibold text-brand-dark dark:text-white mb-4">
            Build the Future of Academic Gaming
          </p>
          <p className="text-slate-500 dark:text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
            At Think Trophy, we believe that knowledge should be rewarded. We are building a platform that turns learning into a competitive, rewarding experience. If you are passionate about education, technology, and building products that make a real impact in Nigeria, we want to hear from you.
          </p>
        </div>

        {/* Why Join Us */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="card p-6 border-t-4 border-t-brand-blue">
            <h3 className="font-bold text-brand-dark dark:text-white text-lg mb-2">Mission-Driven</h3>
            <p className="text-slate-600 dark:text-white/70 text-sm leading-relaxed">
              We aren't just a gaming site; we are a movement to elevate academic standards.
            </p>
          </div>
          <div className="card p-6 border-t-4 border-t-purple-500">
            <h3 className="font-bold text-brand-dark dark:text-white text-lg mb-2">Innovation</h3>
            <p className="text-slate-600 dark:text-white/70 text-sm leading-relaxed">
              Work on a unique platform where fintech meets edtech.
            </p>
          </div>
          <div className="card p-6 border-t-4 border-t-emerald-500">
            <h3 className="font-bold text-brand-dark dark:text-white text-lg mb-2">Remote-First</h3>
            <p className="text-slate-600 dark:text-white/70 text-sm leading-relaxed">
              We value results over office hours. Join our growing team from anywhere.
            </p>
          </div>
        </div>

        {/* Potential Roles */}
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white mb-3">
              Potential Roles
            </h2>
            <p className="text-slate-600 dark:text-white/70">
              While we are currently refining our core platform, we are always looking for brilliant minds in the following areas:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {roles.map((role) => (
              <div key={role.title} className="card p-8 group hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl ${role.bgColor} ${role.color} flex items-center justify-center mb-6`}>
                  <role.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-brand-dark dark:text-white mb-3">
                  {role.title}
                </h3>
                <p className="text-slate-600 dark:text-white/70 leading-relaxed">
                  {role.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Open Application CTA */}
        <div className="bg-brand-blue/5 dark:bg-brand-blue/10 border border-brand-blue/10 dark:border-brand-blue/20 rounded-3xl p-8 sm:p-12 mb-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark dark:text-white mb-4">
              Don't see a specific role for you?
            </h2>
            <p className="text-slate-600 dark:text-white/70 mb-8 leading-relaxed">
              We are always looking for "Thinkers." If you believe you have a skill that can take Think Trophy to the next level—whether in data science, legal compliance, or regional operations—we want to know.
            </p>
            <div className="bg-white dark:bg-brand-card rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-white/5 inline-block">
              <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 dark:text-white/40 mb-3">
                Send your CV and a short note to:
              </p>
              <a 
                href="mailto:contact@thinktrophy.com" 
                className="text-xl sm:text-2xl font-bold text-brand-blue hover:text-brand-blue/80 flex items-center justify-center gap-2 transition-colors group"
              >
                contact@thinktrophy.com
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* Culture & Closing */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-brand-dark dark:text-white mb-4">
            Our Culture
          </h2>
          <p className="text-slate-600 dark:text-white/70 leading-relaxed mb-8">
            We value <strong className="text-brand-dark dark:text-white font-semibold">accountability, precision, and curiosity</strong>. Just like our players who aim for that 10/10, we strive for excellence in every line of code and every academic question we publish.
          </p>
          <div className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/80 font-medium">
            ✨ Think Trophy is an equal opportunity employer. Let's build the trophy together.
          </div>
        </div>

      </div>
    </div>
  );
}