import React, { useRef, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { NvidiaLogo } from '../icons/FeatureIcons';
import { Users, MessageSquare, Activity } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const HeroSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const phone = phoneRef.current;
    const stats = statsRef.current;

    if (!section || !content || !phone || !stats) return;

    const ctx = gsap.context(() => {
      // Initial load animation
      const loadTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      loadTl
        .fromTo(
          '.hero-bg',
          { scale: 1.08, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.9 }
        )
        .fromTo(
          '.hero-label',
          { x: -30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.6 },
          0.2
        )
        .fromTo(
          '.hero-headline',
          { x: -40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.7 },
          0.3
        )
        .fromTo(
          '.hero-subheadline',
          { x: -30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.6 },
          0.45
        )
        .fromTo(
          '.hero-form',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 },
          0.55
        )
        .fromTo(
          phone,
          { x: 100, opacity: 0, rotateY: 15 },
          { x: 0, opacity: 1, rotateY: 0, duration: 1 },
          0.3
        )
        .fromTo(
          stats,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 },
          0.7
        );

      // Scroll-driven exit animation
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.5,
          onLeaveBack: () => {
            // Reset elements when scrolling back to top
            gsap.set([content, phone, stats], { clearProps: 'all' });
            loadTl.progress(1);
          },
        },
      });

      // ENTRANCE (0-30%): Hold position (already animated in)
      // SETTLE (30-70%): Hold position
      // EXIT (70-100%): Animate out
      scrollTl
        .fromTo(
          content,
          { x: 0, opacity: 1 },
          { x: '-18vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(
          phone,
          { x: 0, y: 0, opacity: 1 },
          { x: '18vw', y: '-6vh', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(
          stats,
          { y: 0, opacity: 1 },
          { y: '6vh', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(
          '.hero-bg',
          { scale: 1 },
          { scale: 1.06, ease: 'none' },
          0.7
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
      className="section-pinned bg-krowd-bg flex items-center"
    >
      {/* Background Image */}
      <img
        src="/images/hero-bg.jpg"
        alt="City nightlife"
        className="hero-bg absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark Overlay Gradient */}
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background:
            'linear-gradient(90deg, rgba(11,11,13,0.92) 0%, rgba(11,11,13,0.65) 50%, rgba(11,11,13,0.45) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full px-6 lg:px-12 pt-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 max-w-[1600px] mx-auto">
          {/* Left Content */}
          <div
            ref={contentRef}
            className="flex-1 max-w-xl lg:max-w-2xl text-center lg:text-left"
          >
            {/* Label */}
            <div className="hero-label label-mono text-krowd-accent mb-4 lg:mb-6">
              DALLAS, TX — COMING SOON
            </div>

            {/* Headline */}
            <h1 className="hero-headline heading-display text-krowd-text-primary mb-4 lg:mb-6">
              IS IT A GOOD TIME TO{' '}
              <span className="text-krowd-accent">GO?</span>
            </h1>

            {/* Subheadline */}
            <p className="hero-subheadline body-text text-lg lg:text-xl mb-6 lg:mb-8 max-w-md mx-auto lg:mx-0">
              Check crowds, parking, and vibe before you leave the house.
            </p>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="hero-form flex flex-col sm:flex-row gap-3 max-w-md mx-auto lg:mx-0"
            >
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
                {isSubmitted ? 'Joined!' : 'Join Waitlist'}
              </button>
            </form>

            <p className="hero-form text-xs text-krowd-text-secondary/60 mt-3">
              No spam. Unsubscribe anytime.
            </p>
          </div>

          {/* Phone Mockup */}
          <div
            ref={phoneRef}
            className="relative flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[380px] xl:w-[420px]"
            style={{ perspective: '1000px' }}
          >
            <div
              className="relative bg-krowd-bg-secondary rounded-[36px] p-3 shadow-phone"
              style={{
                boxShadow:
                  '0 24px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Phone Screen */}
              <div className="bg-krowd-bg rounded-[28px] overflow-hidden">
                {/* App Header */}
                <div className="p-4 border-b border-white/5">
                  <div className="font-display font-bold text-krowd-text-primary text-center">
                    Krowd<span className="text-krowd-accent">Guide</span>
                  </div>
                  <div className="text-xs text-krowd-text-secondary text-center mt-0.5">
                    Deep Ellum · Dallas
                  </div>
                </div>

                {/* Search */}
                <div className="p-3">
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-white/5 rounded-full">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-krowd-text-secondary"
                    >
                      <circle
                        cx="11"
                        cy="11"
                        r="8"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M21 21l-4.35-4.35"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-sm text-krowd-text-secondary/60">
                      Where are you headed?
                    </span>
                  </div>
                </div>

                {/* Notification Badge */}
                <div className="px-3 pb-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-krowd-accent/20 rounded-full">
                    <span className="text-lg">🍹</span>
                    <span className="text-xs font-medium text-krowd-accent">
                      12 Happy Hours Near You
                    </span>
                  </div>
                </div>

                {/* Venue Cards */}
                <div className="px-3 pb-4 space-y-2">
                  {[
                    {
                      name: 'Truth & Alibi',
                      distance: '0.3 mi',
                      time: '5-8pm',
                      crowd: 'Moderate',
                      parking: 'Limited',
                      color: 'bg-yellow-500',
                    },
                    {
                      name: 'Vidorra',
                      distance: '0.5 mi',
                      time: '4-6pm',
                      vibe: 'Lively',
                      crowd: 'Busy',
                      color: 'bg-red-500',
                    },
                    {
                      name: 'Ruins',
                      distance: '0.4 mi',
                      time: '4-8pm',
                      crowd: 'Chill',
                      parking: 'Easy',
                      color: 'bg-green-500',
                    },
                  ].map((venue, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white/5 rounded-xl border border-white/5"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-krowd-text-primary text-sm">
                          {venue.name}
                        </span>
                        <span className="text-xs text-krowd-text-secondary">
                          {venue.distance}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 bg-krowd-accent/20 text-krowd-accent text-[10px] rounded-full">
                          🍹 {venue.time}
                        </span>
                        {venue.vibe && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded-full">
                            ✨ {venue.vibe}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 ${venue.color}/20 text-${
                            venue.color === 'bg-yellow-500'
                              ? 'yellow'
                              : venue.color === 'bg-red-500'
                              ? 'red'
                              : 'green'
                          }-400 text-[10px] rounded-full flex items-center gap-1`}
                        >
                          <Users size={10} /> {venue.crowd}
                        </span>
                        {venue.parking && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded-full">
                            🅿️ {venue.parking}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Info Badge */}
              <div className="absolute -left-8 bottom-24 bg-krowd-bg-secondary/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-card animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-krowd-text-secondary">
                    Moderate — 6:42pm
                  </span>
                </div>
              </div>

              {/* Floating Parking Badge */}
              <div className="absolute -right-4 bottom-8 bg-krowd-bg-secondary/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-card animate-float animation-delay-300">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🅿️</span>
                  <span className="text-xs text-green-400">
                    Street Parking Available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div
          ref={statsRef}
          className="absolute bottom-8 left-6 right-6 lg:left-12 lg:right-12"
        >
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 lg:gap-10">
            {/* NVIDIA Badge */}
            <div className="flex items-center gap-2">
              <NvidiaLogo size={28} />
              <span className="text-xs text-krowd-text-secondary">
                NVIDIA Inception Member
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2">
              <Users size={18} className="text-krowd-accent" />
              <div>
                <span className="font-display font-bold text-krowd-text-primary">
                  495
                </span>
                <span className="text-xs text-krowd-text-secondary ml-1">
                  Field test users
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Activity size={18} className="text-krowd-accent" />
              <div>
                <span className="font-display font-bold text-krowd-text-primary">
                  6,900+
                </span>
                <span className="text-xs text-krowd-text-secondary ml-1">
                  Interactions logged
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-krowd-accent" />
              <div>
                <span className="font-display font-bold text-krowd-text-primary">
                  200+
                </span>
                <span className="text-xs text-krowd-text-secondary ml-1">
                  Customer interviews
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
