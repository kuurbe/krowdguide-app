import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const countries = [
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'GB', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
];

const WorldCupSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const countriesRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const line1 = line1Ref.current;
    const line2 = line2Ref.current;
    const details = detailsRef.current;
    const countries = countriesRef.current;

    if (!section || !line1 || !line2 || !details || !countries) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.5,
        },
      });

      // ENTRANCE (0-30%)
      scrollTl
        .fromTo(
          line1,
          { y: '16vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0
        )
        .fromTo(
          line2,
          { y: '16vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0.08
        )
        .fromTo(
          details,
          { y: '8vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0.15
        )
        .fromTo(
          countries,
          { y: '6vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0.2
        )
        .fromTo(
          '.worldcup-bg',
          { scale: 1.08 },
          { scale: 1, ease: 'none' },
          0
        );

      // Hold through SETTLE (30-70%)

      // EXIT (70-100%)
      scrollTl
        .to([line1, line2], { y: '-12vh', opacity: 0, ease: 'power2.in' }, 0.7)
        .to(details, { y: '-6vh', opacity: 0, ease: 'power2.in' }, 0.7)
        .to(countries, { y: '-4vh', opacity: 0, ease: 'power2.in' }, 0.75);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-pinned flex items-center justify-center"
    >
      {/* Background Image */}
      <img
        src="/images/stadium-crowd.jpg"
        alt="Stadium crowd"
        className="worldcup-bg absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark Overlay */}
      <div
        className="absolute inset-0 z-[2]"
        style={{ background: 'rgba(11,11,13,0.78)' }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Headlines */}
        <div className="mb-6 lg:mb-8">
          <div ref={line1Ref} className="heading-display text-krowd-text-primary mb-2">
            DALLAS IS HOSTING
          </div>
          <div ref={line2Ref} className="heading-display text-krowd-accent">
            THE WORLD.
          </div>
        </div>

        {/* Details */}
        <div ref={detailsRef} className="mb-8 lg:mb-10">
          <p className="font-display font-semibold text-krowd-text-primary text-lg lg:text-xl mb-3">
            9 International Matches · June–July 2026 · AT&T Stadium
          </p>
          <p className="body-text max-w-2xl mx-auto">
            Millions of visitors. Thousands at fan zones daily. Krowd Guide covers
            everything outside the stadium — watch parties, restaurants, fan zones,
            and entertainment districts.
          </p>
        </div>

        {/* Countries */}
        <div
          ref={countriesRef}
          className="flex flex-wrap justify-center gap-3 lg:gap-4"
        >
          {countries.map((country) => (
            <div
              key={country.code}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full"
            >
              <span className="text-xl">{country.flag}</span>
              <span className="text-sm text-krowd-text-secondary hidden sm:inline">
                {country.name}
              </span>
            </div>
          ))}
        </div>

        {/* Source */}
        <p className="mt-6 text-xs text-krowd-text-secondary/60">
          Source:{' '}
          <a
            href="https://www.dallasfwc26.com/our-venues/match-schedule/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-krowd-accent transition-colors"
          >
            dallasfwc26.com
          </a>{' '}
          · Schedule confirmed December 2025
        </p>
      </div>
    </section>
  );
};

export default WorldCupSection;
