import type { TicketmasterEvent } from '../../types';
import { Clock, Navigation, ExternalLink } from 'lucide-react';
import { openDirections } from '../../utils/directions';

export function EventCard({ event }: { event: TicketmasterEvent }) {
  const image = event.images?.[0]?.url;
  const venueName = event._embedded?.venues?.[0]?.name || 'TBA';
  const venueLocation = event._embedded?.venues?.[0]?.location;
  const date = event.dates?.start?.localDate;
  const time = event.dates?.start?.localTime;
  const genre = event.classifications?.[0]?.genre?.name || event.classifications?.[0]?.segment?.name || '';

  const formatTime = (t?: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour > 12 ? hour - 12 : hour}:${m} ${ampm}`;
  };

  const handleDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (venueLocation?.latitude && venueLocation?.longitude) {
      openDirections(parseFloat(venueLocation.latitude), parseFloat(venueLocation.longitude), venueName);
    }
  };

  const handleTickets = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.url) {
      let ticketUrl = event.url;
      try {
        const parsed = new URL(event.url);
        const realUrl = parsed.searchParams.get('u');
        if (realUrl) ticketUrl = realUrl;
      } catch {}
      window.open(ticketUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex gap-3.5 p-3.5 rounded-2xl bg-[var(--k-surface-solid)] border border-[var(--k-border)]
                     shadow-[var(--k-card-shadow)] ios-press transition-all">
      <div className="w-16 h-16 rounded-xl bg-[var(--k-surface)] overflow-hidden flex-shrink-0">
        {image && <img src={image} alt={event.name} className="w-full h-full object-cover" loading="lazy" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-[14px] line-clamp-2 text-[var(--k-text)] tracking-[-0.02em] leading-tight">{event.name}</h4>
        <p className="text-[12px] text-[#ff4d6a] mt-0.5 font-semibold">{venueName}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {(date || time) && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#a855f7] bg-[#a855f7]/10 px-2 py-[2px] rounded-full">
              <Clock className="w-3 h-3" />
              {date && new Date(date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {time && ` ${formatTime(time)}`}
            </span>
          )}
          {genre && (
            <span className="text-[11px] font-medium text-[var(--k-text-f)] bg-[var(--k-surface)] px-2 py-[2px] rounded-full capitalize">
              {genre}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          {event.url && (
            <button
              onClick={handleTickets}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#a855f7]/12 text-[#a855f7] text-[11px] font-bold
                         active:scale-95 transition-transform"
            >
              <ExternalLink className="w-3 h-3" /> Tickets
            </button>
          )}
          {venueLocation?.latitude && (
            <button
              onClick={handleDirections}
              aria-label={`Directions to ${venueName}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ff4d6a]/10 text-[#ff4d6a] text-[11px] font-bold
                         active:scale-95 transition-transform"
            >
              <Navigation className="w-3 h-3" /> Directions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
