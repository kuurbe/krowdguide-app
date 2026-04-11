import { useState, useCallback, type KeyboardEvent } from 'react';
import { Sparkles, ArrowUp, Mic } from 'lucide-react';

/**
 * Shared "Ask" bar — AI prompt input with coral accent and shimmer border.
 * Used in CityGuide ("Ask the City") and Predictions ("Ask the Forecast").
 */
export function AskBar({
  placeholder,
  onSubmit,
  suggestions,
}: {
  placeholder: string;
  onSubmit: (prompt: string) => void;
  suggestions?: string[];
}) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  }, [value, onSubmit]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  }, [handleSubmit]);

  const handleSuggestion = useCallback((s: string) => {
    onSubmit(s);
  }, [onSubmit]);

  return (
    <div className="w-full">
      {/* Ask input with shimmer border */}
      <div className="ask-bar-wrap">
        <div className="ask-bar relative flex items-center gap-2 px-4 py-3 rounded-[18px]">
          <Sparkles className="w-4 h-4 text-[var(--k-color-coral)] flex-shrink-0" />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-[14px] text-[var(--k-text)] placeholder:text-[var(--k-text-f)] outline-none min-w-0"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {value ? (
            <button
              onClick={handleSubmit}
              aria-label="Submit"
              className="w-7 h-7 rounded-full bg-[var(--k-color-coral)] flex items-center justify-center ios-press flex-shrink-0"
            >
              <ArrowUp className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            </button>
          ) : (
            <button
              aria-label="Voice input"
              className="w-7 h-7 rounded-full glass-chip flex items-center justify-center ios-press flex-shrink-0"
            >
              <Mic className="w-3.5 h-3.5 text-[var(--k-text-m)]" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestion chips */}
      {suggestions && suggestions.length > 0 && (
        <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full glass-chip text-[11px] font-semibold text-[var(--k-text-m)] ios-press whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
