import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CheckVenueSection: React.FC = () => {
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
          { x: '-18vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0
        )
        .fromTo(
          subline,
          { x: '18vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0.1
        )
        .fromTo(
          '.checkvenue-bg',
          { scale: 1.06 },
          { scale: 1, ease: 'none' },
          0
        );

      // Hold through SETTLE (30-70%)

      // EXIT (70-100%)
      scrollTl
        .to(headline, { x: '-10vw', opacity: 0, ease: 'power2.in' }, 0.7)
        .to(subline, { x: '10vw', opacity: 0, ease: 'power2.in' }, 0.7);
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
        src="/images/venue-entrance.jpg"
        alt="Venue entrance"
        className="checkvenue-bg absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark Overlay */}
      <div
        className="absolute inset-0 z-[2]"
        style={{ background: 'rgba(11,11,13,0.68)' }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <h2
          ref={headlineRef}
          className="heading-display text-krowd-text-primary mb-4 lg:mb-6"
        >
          CHECK ANY VENUE IN{' '}
          <span className="text-krowd-accent">SECONDS.</span>
        </h2>
        <p
          ref={sublineRef}
          className="body-text text-lg lg:text-xl max-w-2xl mx-auto"
        >
          Browse first. Allow location when you're ready for live data.
        </p>
      </div>
    </section>
  );
};

export default CheckVenueSection;
