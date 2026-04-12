import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem('kg-install-dismissed'));

  // Capture the beforeinstallprompt event (Chrome/Android)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Check if already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;

  if (isStandalone || dismissed) return null;

  // Detect iOS Safari
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const showPrompt = deferredPrompt || isIOS;

  if (!showPrompt) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('kg-install-dismissed', 'true');
  };

  return (
    <>
      {/* Install banner */}
      <div className="fixed bottom-[76px] left-4 right-4 z-[1050] animate-fadeUp">
        <div className="liquid-glass glass-border-glow rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--k-color-coral)]/15 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-[var(--k-color-coral)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[var(--k-text)]">Add to Home Screen</p>
            <p className="text-[11px] text-[var(--k-text-m)]">Get the full app experience</p>
          </div>
          <button
            onClick={handleInstall}
            className="px-4 py-2 rounded-full text-[12px] font-bold text-white ios-press flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--k-color-coral), var(--k-color-orange))' }}
          >
            Install
          </button>
          <button onClick={handleDismiss} className="w-6 h-6 flex items-center justify-center flex-shrink-0 ios-press">
            <X className="w-3.5 h-3.5 text-[var(--k-text-f)]" />
          </button>
        </div>
      </div>

      {/* iOS Share Sheet guide overlay */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[2000] bg-black/70 flex items-end justify-center p-4" onClick={() => setShowIOSGuide(false)}>
          <div className="liquid-glass glass-border-glow rounded-2xl p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-[var(--k-color-coral)]/15 flex items-center justify-center mx-auto mb-4">
              <span className="text-[20px] font-black text-[var(--k-color-coral)] font-syne">KG</span>
            </div>
            <h3 className="font-syne font-bold text-[18px] text-[var(--k-text)] mb-2">Add KrowdGuide</h3>
            <p className="text-[13px] text-[var(--k-text-m)] mb-4">
              Tap the <strong>Share</strong> button in Safari's toolbar, then scroll down and tap <strong>"Add to Home Screen"</strong>.
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-chip">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#007AFF]">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                </svg>
                <span className="text-[12px] font-bold text-[var(--k-text)]">Share</span>
              </div>
              <span className="text-[var(--k-text-m)]">→</span>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-chip">
                <span className="text-[14px]">➕</span>
                <span className="text-[12px] font-bold text-[var(--k-text)]">Add to Home</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 rounded-[16px] glass-chip text-[14px] font-bold text-[var(--k-text)] ios-press"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
