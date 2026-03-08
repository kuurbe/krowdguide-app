import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const StatementSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const subline = sublineRef.current;

    if (!section || !headline || !subline) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 0.5,
        },
      });

      // ENTRANCE (0-30%)
      scrollTl
        .fromTo(
          headline,
          { y: '18vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0
        )
        .fromTo(
          subline,
          { y: '10vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0.1
        )
        .fromTo(
          '.statement-bg',
          { scale: 1.08 },
          { scale: 1, ease: 'none' },
          0
        );

      // Hold through SETTLE (30-70%)

      // EXIT (70-100%)
      scrollTl
        .to(headline, { y: '-14vh', opacity: 0, ease: 'power2.in' }, 0.7)
        .to(subline, { y: '-8vh', opacity: 0, ease: 'power2.in' }, 0.7)
        .to(
          '.statement-overlay',
          { opacity: 0.9, ease: 'none' },
          0.7
        );
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
        src="/images/statement-crowd.jpg"
        alt="Busy venue"
        className="statement-bg absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark Overlay */}
      <div
        className="statement-overlay absolute inset-0 z-[2]"
        style={{ background: 'rgba(11,11,13,0.72)' }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <h2
          ref={headlineRef}
          className="heading-display text-krowd-text-primary mb-4 lg:mb-6"
        >
          SKIP THE{' '}
          <span className="text-krowd-accent">GUESSWORK.</span>
        </h2>
        <p
          ref={sublineRef}
          className="body-text text-lg lg:text-xl max-w-2xl mx-auto"
        >
          Everything you need to know about a place — before you get there.
        </p>
      </div>
    </section>
  );
};

export default StatementSection;
