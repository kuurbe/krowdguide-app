import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const OperatorsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const subline = sublineRef.current;
    const cta = ctaRef.current;

    if (!section || !headline || !subline || !cta) return;

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
          { y: '14vh', opacity: 0 },
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
          cta,
          { scale: 0.92, opacity: 0 },
          { scale: 1, opacity: 1, ease: 'none' },
          0.18
        )
        .fromTo(
          '.operators-bg',
          { scale: 1.06 },
          { scale: 1, ease: 'none' },
          0
        );

      // Hold through SETTLE (30-70%)

      // EXIT (70-100%)
      scrollTl
        .to(headline, { y: '-10vh', opacity: 0, ease: 'power2.in' }, 0.7)
        .to(subline, { y: '-6vh', opacity: 0, ease: 'power2.in' }, 0.7)
        .to(cta, { y: '6vh', opacity: 0, ease: 'power2.in' }, 0.7);
    }, section);

    return () => ctx.revert();
  }, []);

  const handleRequestDemo = () => {
    const waitlistSection = document.querySelector('#waitlist');
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="operators"
      className="section-pinned flex items-center justify-center"
    >
      {/* Background Image */}
      <img
        src="/images/bar-backbar.jpg"
        alt="Bar backbar"
        className="operators-bg absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark Overlay */}
      <div
        className="absolute inset-0 z-[2]"
        style={{ background: 'rgba(11,11,13,0.70)' }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h2
          ref={headlineRef}
          className="heading-display text-krowd-text-primary mb-4 lg:mb-6"
        >
          RUN A VENUE, DISTRICT, OR EVENT?
        </h2>
        <p
          ref={sublineRef}
          className="body-text text-lg lg:text-xl max-w-2xl mx-auto mb-8 lg:mb-10"
        >
          Get a dashboard for real-time crowd intelligence. Venues · Districts ·
          Cities · Events
        </p>
        <button
          ref={ctaRef}
          onClick={handleRequestDemo}
          className="btn-primary text-lg px-10 py-5"
        >
          Request a Demo
        </button>
      </div>
    </section>
  );
};

export default OperatorsSection;
