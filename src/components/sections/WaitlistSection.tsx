import React, { useRef, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { NvidiaLogo } from '../icons/FeatureIcons';
import { Building2, Clock, CheckCircle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const team = [
  {
    name: 'Jalisa Montgomery',
    role: 'CEO · Former HPD',
    image: '/images/team-jalisa.jpg',
  },
  {
    name: 'Jacolby White-Lake',
    role: 'CTO · Full-Stack Eng',
    image: '/images/team-jacolby.jpg',
  },
];

const badges = [
  { icon: <NvidiaLogo size={20} />, text: 'NVIDIA Inception Member' },
  { icon: <Building2 size={18} />, text: 'Texas Registered LLC' },
  { icon: <Clock size={18} />, text: 'Coming Soon' },
];

const WaitlistSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const left = leftRef.current;
    const right = rightRef.current;

    if (!section || !left || !right) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        left,
        { x: -60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        right,
        { x: 60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Team cards stagger
      gsap.fromTo(
        '.team-card',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: right,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="waitlist"
      className="relative bg-krowd-bg-secondary py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left Column - Form */}
          <div ref={leftRef}>
            <h2 className="heading-section text-krowd-text-primary mb-4">
              Know before you go.
            </h2>
            <p className="body-text text-lg mb-8">
              Be the first to know when Krowd Guide launches in Dallas.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-pill text-krowd-text-primary placeholder:text-krowd-text-secondary/60 focus:outline-none focus:border-krowd-accent/50 transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="btn-primary whitespace-nowrap"
                  disabled={isSubmitted}
                >
                  {isSubmitted ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle size={18} />
                      Joined!
                    </span>
                  ) : (
                    'Join Waitlist'
                  )}
                </button>
              </div>
              <p className="text-xs text-krowd-text-secondary/60">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          </div>

          {/* Right Column - Team & Badges */}
          <div ref={rightRef}>
            {/* Team Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {team.map((member, index) => (
                <div
                  key={index}
                  className="team-card relative overflow-hidden rounded-2xl bg-krowd-bg border border-white/[0.06]"
                >
                  <div className="aspect-square">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-display font-semibold text-krowd-text-primary text-sm mb-0.5">
                      {member.name}
                    </h4>
                    <p className="text-xs text-krowd-text-secondary">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              {badges.map((badge, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-full"
                >
                  <span className="text-krowd-accent">{badge.icon}</span>
                  <span className="text-sm text-krowd-text-secondary">
                    {badge.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WaitlistSection;
