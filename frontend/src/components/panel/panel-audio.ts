// Som e voz do painel de chamada. Os navegadores só liberam áudio depois de um clique,
// por isso o painel tem o botão "Ativar voz e som" antes de qualquer chamada.

export function createAudioContext(): AudioContext | null {
  return typeof window !== "undefined" && "AudioContext" in window ? new AudioContext() : null;
}

/** Dois tons (agudo e grave), como o aviso de senha */
export function playChime(context: AudioContext | null) {
  if (!context) return;
  const start = context.currentTime;
  [880, 660].forEach((frequency, index) => {
    const at = start + index * 0.3;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.25, at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.3);
  });
}

/** Fala o texto em português do Brasil, logo depois do sinal sonoro */
export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 0.95;
  const voice = synth.getVoices().find(item => item.lang.toLowerCase().startsWith("pt"));
  if (voice) utterance.voice = voice;
  window.setTimeout(() => synth.speak(utterance), 650);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
