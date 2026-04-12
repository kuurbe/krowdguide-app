import { useState, useRef, useCallback } from 'react';
import gsap from 'gsap';
import type { Venue } from '../../types';
import { CrowdPill } from './CrowdPill';
import { CrowdPredictionChart } from '../charts/CrowdPredictionChart';
import { VenueIcon } from '../../utils/icons';
import { ShieldCheck, ChevronDown, Route, Footprints, Bike, Beer } from 'lucide-react';
import { useAppContext } from '../../context';
import type { TravelMode } from '../../services/directionsService';

const DIR_MODES: { id: TravelMode; label: string; Icon: typeof Route }[] = [
  { id: 'driving', label: 'Route', Icon: Route },
  { id: 'walking', label: 'Walk', Icon: Footprints },
  { id: 'cycling', label: 'Bike', Icon: Bike },
];

export function ExpandableVenueCard({ venue }: { venue: Venue }) {
  const { startDirections } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);
  const isOracle = venue.id.startsWith('oracle-');

  const toggle = useCallback(() => {
    const content = contentRef.current;
    const chevron = chevronRef.current;
    if (!content || !chevron) return;

    if (!expanded) {
      content.style.display = 'block';
      const h = content.scrollHeight;
      gsap.fromTo(content, { height: 0, opacity: 0 }, { height: h, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.75)', clearProps: 'height' });
      gsap.to(chevron, { rotation: 180, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(content, {
        height: 0, opacity: 0, duration: 0.35, ease: 'power2.inOut',
        onComplete: () => { content.style.display = 'none'; },
      });
      gsap.to(chevron, { rotation: 0, duration: 0.3, ease: 'power2.out' });
    }

    setExpanded(!expanded);
  }, [expanded]);

  return (
    <div
      data-vaul-no-drag
      onPointerDown={(e) => e.stopPropagation()}
      className={`rounded-2xl bg-[var(--k-surface-solid)] border overflow-hidden ios-press transition-shadow
                  shadow-[var(--k-shadow-sm)] ${isOracle ? 'border-emerald-500/20 ring-1 ring-emerald-500/[0.06]' : 'border-[var(--k-border)]'}`}
    >
      {/* Collapsed row — always visible */}
      <button onClick={toggle} className="w-full flex items-center gap-3 p-3.5 text-left">
        <div className="relative w-12 h-12 rounded-2xl bg-[var(--k-surface)] overflow-hidden flex-shrink-0">
          <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" loading="lazy" />
          {isOracle && (
            <div className="absolute -bottom-0.5 -right-0.5 w-[16px] h-[16px] rounded-full bg-emerald-500 flex items-center justify-center border-[1.5px] border-[var(--k-surface-solid)]">
              <ShieldCheck className="w-2 h-2 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="type-title-3 truncate text-[var(--k-text)] leading-tight">
            <VenueIcon iconId={venue.icon} className="w-3.5 h-3.5 text-[var(--k-text-m)] inline-block" /> {venue.name}
          </h4>
          <p className="text-[11px] text-[var(--k-text-m)] mt-0.5 leading-tight">{venue.type} · {venue.dist}</p>
        </div>
        <CrowdPill crowd={venue.crowd} pct={venue.pct} />
        <ChevronDown ref={chevronRef} className="w-4 h-4 text-[var(--k-text-f)] flex-shrink-0" />
      </button>

      {/* Expandable content */}
      <div ref={contentRef} className="max-w-full overflow-hidden" style={{ display: 'none', overflow: 'hidden' }}>
        <div className="px-3.5 pb-3.5 space-y-3 max-w-full">
          {/* Venue image — larger */}
          {venue.image && (
            <div className="relative h-[140px] rounded-xl overflow-hidden">
              <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
              <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold
                              ${venue.crowd === 'busy' ? 'bg-[var(--k-color-coral)]/90 text-white' :
                                venue.crowd === 'moderate' ? 'bg-amber-500/90 text-white' :
                                'bg-emerald-500/90 text-white'}`}>
                {venue.pct}% LOAD
              </div>
            </div>
          )}

          {/* Mini crowd prediction sparkline */}
          <CrowdPredictionChart venue={venue} mini />

          {/* Happy hour info */}
          {venue.hasHH && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-chip">
              <Beer className="w-3.5 h-3.5 text-[var(--k-color-orange)] flex-shrink-0" />
              <span className="text-[12px] font-bold text-[var(--k-color-orange)]">{venue.hhDeal}</span>
            </div>
          )}

          {/* Direction buttons — spring press + brand gradient */}
          <div className="flex gap-2">
            {DIR_MODES.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={(e) => {
                  e.stopPropagation();
                  startDirections({ coords: venue.coordinates, name: venue.name }, id);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[14px]
                           text-[12px] font-bold transition-all
                           ${id === 'walking'
                             ? 'text-white'
                             : 'glass-chip text-[var(--k-text-2)]'
                           }`}
                style={{
                  ...(id === 'walking' ? {
                    background: 'linear-gradient(135deg, var(--k-color-coral), var(--k-color-orange))',
                    boxShadow: '0 3px 12px rgba(255,77,106,0.25)',
                  } : {}),
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'; }}
                onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
