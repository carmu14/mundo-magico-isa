import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export type VoiceStyle = 'hada' | 'princesa' | 'maternal';

@Injectable({ providedIn: 'root' })
export class VoiceService {
  private synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private audioCtx: AudioContext | null = null;
  private femaleVoice: SpeechSynthesisVoice | null = null;

  readonly style = signal<VoiceStyle>('hada');
  readonly pitch = signal<number>(1.22);
  readonly rate = signal<number>(0.92);
  readonly useGeminiTts = signal<boolean>(false);
  readonly selectedVoiceName = signal<string>('Buscando voz dulce...');

  private readonly preferredFemaleNames = [
    'paulina', 'sabina', 'dalia', 'helena', 'paloma', 'mónica', 'monica',
    'francisca', 'elvira', 'sofia', 'lucia', 'maria', 'femenina', 'female',
    'google español'
  ];

  private readonly excludedMaleNames = [
    'jorge', 'diego', 'carlos', 'pablo', 'raul', 'raúl', 'alvaro', 'álvaro',
    'enrique', 'andres', 'andrés', 'male', 'masculino'
  ];

  constructor() {
    if (this.synth) {
      this.loadFemaleVoice();
      this.synth.onvoiceschanged = () => this.loadFemaleVoice();
    }
  }

  private loadFemaleVoice(): void {
    if (!this.synth) return;
    const voices = this.synth.getVoices().filter(v => v.lang.toLowerCase().startsWith('es'));
    if (!voices.length) return;

    const nonMaleVoices = voices.filter(v => {
      const name = v.name.toLowerCase();
      return !this.excludedMaleNames.some(male => name.includes(male));
    });

    const bestMatch = nonMaleVoices.find(v => {
      const name = v.name.toLowerCase();
      return this.preferredFemaleNames.some(pref => name.includes(pref));
    });

    this.femaleVoice = bestMatch || nonMaleVoices[0] || voices[0];
    this.selectedVoiceName.set(this.femaleVoice?.name || 'Hada Dulce Español');
  }

  setStyle(style: VoiceStyle): void {
    this.style.set(style);
    if (style === 'hada') {
      this.pitch.set(1.22);
      this.rate.set(0.92);
    } else if (style === 'princesa') {
      this.pitch.set(1.34);
      this.rate.set(0.95);
    } else {
      this.pitch.set(1.12);
      this.rate.set(0.88);
    }
    this.playMagicArpeggio();
    this.speak('¡Hola princesa! Así suena mi voz mágica para acompañarte.');
  }

  async speak(text: string): Promise<void> {
    if (this.useGeminiTts() && environment.geminiApiKey) {
      const ok = await this.speakWithGemini(text);
      if (ok) return;
    }

    if (!this.synth) return;
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.femaleVoice) {
      utterance.voice = this.femaleVoice;
    }
    utterance.lang = this.femaleVoice?.lang || 'es-MX';
    utterance.pitch = this.pitch();
    utterance.rate = this.rate();
    this.synth.speak(utterance);
  }

  private async speakWithGemini(text: string): Promise<boolean> {
    try {
      const geminiVoiceMap: Record<VoiceStyle, string> = {
        hada: 'Aoede',
        princesa: 'Leda',
        maternal: 'Sulafat'
      };
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${environment.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Lee con voz de mujer muy dulce, tierna y cariñosa para una niña de 6 años: ${text}` }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: geminiVoiceMap[this.style()] } }
              }
            }
          })
        }
      );
      const data = await response.json();
      const base64Audio = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) return false;

      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      this.playPcmAudio(bytes.buffer, 24000);
      return true;
    } catch {
      return false;
    }
  }

  private playPcmAudio(pcmBuffer: ArrayBuffer, sampleRate: number): void {
    const ctx = this.getAudioContext();
    const int16 = new Int16Array(pcmBuffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

    const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
  }

  playMagicArpeggio(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => this.playTone(freq, 0.22, idx * 0.07));
  }

  playNote(index: number): void {
    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
    const freq = scale[index % scale.length];
    this.playTone(freq, 0.25, 0);
  }

  private playTone(freq: number, duration: number, delay: number): void {
    const ctx = this.getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

    gain.gain.setValueAtTime(0.18, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return this.audioCtx;
  }
}
