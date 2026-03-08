import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './App.css';

// Components
import Navigation from './components/Navigation';

// Sections
import HeroSection from './components/sections/HeroSection';
import StatementSection from './components/sections/StatementSection';
import FeaturesSection from './components/sections/FeaturesSection';
import CheckVenueSection from './components/sections/CheckVenueSection';
import DistrictsSection from './components/sections/DistrictsSection';
import WorldCupSection from './components/sections/WorldCupSection';
import OperatorsSection from './components/sections/OperatorsSection';
import WaitlistSection from './components/sections/WaitlistSection';
import Footer from './components/sections/Footer';

gsap.registerPlugin(ScrollTrigger);

function App() {
  useEffect(() => {
    // Wait for all ScrollTriggers to be created
    const timer = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter((st) => st.vars.pin)
        .sort((a, b) => a.start - b.start);

      const maxScroll = ScrollTrigger.maxScroll(window);

      if (!maxScroll || pinned.length === 0) return;

      // Build pinned ranges and snap targets
      const pinnedRanges = pinned.map((st) => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center:
          (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      // Create global snap
      ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            // Check if within any pinned range (with small buffer)
            const inPinned = pinnedRanges.some(
              (r) => value >= r.start - 0.02 && value <= r.end + 0.02
            );

            if (!inPinned) return value; // Flowing section: free scroll

            // Find nearest pinned center
            const target = pinnedRanges.reduce(
              (closest, r) =>
                Math.abs(r.center - value) < Math.abs(closest - value)
                  ? r.center
                  : closest,
              pinnedRanges[0]?.center ?? 0
            );

            return target;
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        },
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <div className="relative bg-krowd-bg min-h-screen">
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative">
        {/* Section 1: Hero */}
        <HeroSection />

        {/* Section 2: Statement - Skip the Guesswork */}
        <StatementSection />

        {/* Section 3: Features (Flowing) */}
        <FeaturesSection />

        {/* Section 4: Check Any Venue */}
        <CheckVenueSection />

        {/* Section 5: Districts (Flowing) */}
        <DistrictsSection />

        {/* Section 6: World Cup */}
        <WorldCupSection />

        {/* Section 7: For Operators */}
        <OperatorsSection />

        {/* Section 8: Waitlist + Team (Flowing) */}
        <WaitlistSection />

        {/* Section 9: Footer */}
        <Footer />
      </main>
    </div>
  );
}

export default App;
