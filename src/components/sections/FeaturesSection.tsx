import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  CrowdIcon,
  ParkingIcon,
  AtmosphereIcon,
  SafetyIcon,
  DealsIcon,
  AlertsIcon,
} from '../icons/FeatureIcons';

gsap.registerPlugin(ScrollTrigger);

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: FeatureCard[] = [
  {
    icon: <CrowdIcon size={28} />,
    title: 'Crowd Levels',
    description: 'See how busy a place is right now. Find the energy you want — or skip the wait entirely.',
  },
  {
    icon: <ParkingIcon size={28} />,
    title: 'Parking Conditions',
    description: 'Stop circling the block. Check street, garage, and lot availability before you drive there.',
  },
  {
    icon: <AtmosphereIcon size={28} />,
    title: 'Atmosphere',
    description: 'Quiet brunch or high-energy patio? Find the vibe you want — without the guesswork.',
  },
  {
    icon: <SafetyIcon size={28} />,
    title: 'Safety Context',
    description: 'Historical safety info for the area. Context for making informed decisions about where to go.',
  },
  {
    icon: <DealsIcon size={28} />,
    title: 'Happy Hours & Specials',
    description: 'Find deals near you — restaurants, rooftops, coffee shops. Not just bars.',
  },
  {
    icon: <AlertsIcon size={28} />,
    title: 'Smart Alerts',
    description: 'Get notified when crowds change or parking opens up at your favorite spot.',
  },
];

const FeaturesSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const cards = cardsRef.current.filter(Boolean);

    if (!section || !header || cards.length === 0) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        header,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: header,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Cards animation with stagger
      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          { y: 80, opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            ease: 'power3.out',
            delay: index * 0.08,
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative bg-krowd-bg py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div ref={headerRef} className="mb-12 lg:mb-16 max-w-2xl">
          <h2 className="heading-section text-krowd-text-primary mb-4">
            What You Get
          </h2>
          <p className="body-text text-lg">
            Real-time signals so you can choose the right place, right now.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={(el) => { cardsRef.current[index] = el; }}
              className="group relative p-6 lg:p-8 rounded-2xl bg-krowd-bg-secondary border border-white/[0.06] card-hover"
            >
              {/* Icon */}
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-krowd-accent/10 text-krowd-accent mb-5 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="font-display font-semibold text-krowd-text-primary text-lg mb-2">
                {feature.title}
              </h3>
              <p className="body-text text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Glow */}
              <div className="absolute inset-0 rounded-2xl bg-krowd-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
