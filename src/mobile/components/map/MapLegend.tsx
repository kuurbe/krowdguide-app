export function MapLegend() {
  return (
    <div className="absolute bottom-20 left-4 z-[1000] p-3 rounded-[16px] bg-[var(--k-elevated)] ios-blur-thick
                    border border-[var(--k-border)] shadow-[var(--k-float-shadow)]">
      <p className="text-[9px] font-bold text-[var(--k-text-f)] uppercase tracking-[0.08em] mb-1.5">Crowd Density</p>
      <div
        className="w-[110px] h-[6px] rounded-full"
        style={{ background: 'linear-gradient(to right, #34d399, #facc15, #f59e0b, #ff4d6a)' }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[8px] font-bold text-emerald-400/60">Low</span>
        <span className="text-[8px] font-bold text-[#ff4d6a]/60">High</span>
      </div>
    </div>
  );
}
