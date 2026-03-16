/** Minimal Web Speech API wrapper for turn-by-turn voice guidance */

export function isVoiceSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text: string): void {
  if (!isVoiceSupported()) return;
  cancelSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 0.8;
  speechSynthesis.speak(utterance);
}

export function cancelSpeech(): void {
  if (!isVoiceSupported()) return;
  speechSynthesis.cancel();
}
