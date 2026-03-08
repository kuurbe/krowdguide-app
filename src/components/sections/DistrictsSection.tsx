import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPinIcon } from '../icons/FeatureIcons';

gsap.registerPlugin(ScrollTrigger);

interface District {
  name: string;
  venues: number;
  tagline: string;
  image: string;
}

const districts: District[] = [
  {
    name: 'Deep Ellum',
    venues: 45,
    tagline: 'Live music capital',
    image: '/images/district-deep-ellum.jpg',
  },
  {
    name: 'Uptown',
    venues: 62,
    tagline: 'Rooftops & dining',
    image: '/images/district-uptown.jpg',
  },
  {
    name: 'Bishop Arts',
    venues: 28,
    tagline: 'Brunch & boutiques',
    image: '/images/district-bishop-arts.jpg',
  },
  {
    name: 'Victory Park',
    venues: 15,
    tagline: 'Game day energy',
    image: '/images/district-victory-park.jpg',
  },
  {
    name: 'Lower Greenville',
    venues: 35,
    tagline: 'Neighborhood charm',
    image: '/images/district-greenville.jpg',
  },
];

const DistrictsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const tiles = tilesRef.current.filter(Boolean);

    if (!section || !header || tiles.length === 0) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        header,
        { y: 50, opacity: 0 },
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

      // Tiles animation with stagger
      tiles.forEach((tile, index) => {
        gsap.fromTo(
          tile,
          { y: 100, opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            ease: 'power3.out',
            delay: index * 0.1,
            scrollTrigger: {
              trigger: tile,
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
      id="districts"
      className="relative bg-krowd-bg py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div ref={headerRef} className="mb-12 lg:mb-16">
          <h2 className="heading-section text-krowd-text-primary mb-4">
            Dallas Districts
          </h2>
          <p className="body-text text-lg flex items-center gap-2">
            <span className="text-krowd-accent font-semibold">Six districts.</span>
            <span>One app.</span>
          </p>
        </div>

        {/* Mosaic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {/* First row - 2 larger tiles */}
          {districts.slice(0, 2).map((district, index) => (
            <div
              key={district.name}
              ref={(el) => { tilesRef.current[index] = el; }}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer ${
                index === 0 ? 'lg:col-span-2' : ''
              }`}
              style={{ height: '280px' }}
            >
              {/* Image */}
              <img
                src={district.image}
                alt={district.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-krowd-bg via-krowd-bg/50 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-2">
                  <MapPinIcon size={16} className="text-krowd-accent" />
                  <span className="label-mono text-krowd-accent">
                    {district.venues} VENUES
                  </span>
                </div>
                <h3 className="font-display font-bold text-krowd-text-primary text-2xl lg:text-3xl mb-1">
                  {district.name}
                </h3>
                <p className="body-text text-sm">{district.tagline}</p>
              </div>

              {/* Hover Border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-krowd-accent/0 group-hover:border-krowd-accent/30 transition-colors duration-300 pointer-events-none" />
            </div>
          ))}

          {/* Second row - 3 equal tiles */}
          {districts.slice(2).map((district, index) => (
            <div
              key={district.name}
              ref={(el) => { tilesRef.current[index + 2] = el; }}
              className="group relative overflow-hidden rounded-2xl cursor-pointer"
              style={{ height: '240px' }}
            >
              {/* Image */}
              <img
                src={district.image}
                alt={district.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-krowd-bg via-krowd-bg/50 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-1.5">
                  <MapPinIcon size={14} className="text-krowd-accent" />
                  <span className="label-mono text-krowd-accent text-[10px]">
                    {district.venues} VENUES
                  </span>
                </div>
                <h3 className="font-display font-bold text-krowd-text-primary text-xl mb-0.5">
                  {district.name}
                </h3>
                <p className="body-text text-xs">{district.tagline}</p>
              </div>

              {/* Hover Border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-krowd-accent/0 group-hover:border-krowd-accent/30 transition-colors duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DistrictsSection;
