import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export type VoiceStyle = 'hada' | 'princesa' | 'maternal';

@Injectable({ providedIn: 'root' })
export class VoiceService {
  private synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private audioCtx: AudioContext | null = null;
  private femaleVoice: SpeechSynthesisVoice | null = null;
  // Propiedad de clase para mantener la referencia viva y evitar que el Garbage Collector corte el audio
  private utterance: SpeechSynthesisUtterance | null = null;
  // Cola de referencias activas hasta que termine el evento onend/onerror
  private activeUtterances: SpeechSynthesisUtterance[] = [];

  readonly style = signal<VoiceStyle>('hada');
  readonly pitch = signal<number>(1.22);
  readonly rate = signal<number>(0.92);
  readonly useGeminiTts = signal<boolean>(false);
  readonly selectedVoiceName = signal<string>('Buscando voz dulce...');

  // Nombres prioritarios de voces femeninas en español (incluyendo 'Google español', 'Sabina', 'Helena', 'Paulina', 'Monica', 'Laura', 'Female')
  private readonly preferredFemaleNames = [
    'google español', 'sabina', 'helena', 'paulina', 'monica', 'mónica',
    'laura', 'female', 'femenina', 'dalia', 'paloma', 'francisca',
    'elvira', 'sofia', 'sofía', 'lucia', 'lucía', 'maria', 'maría'
  ];

  private readonly excludedMaleNames = [
    'jorge', 'diego', 'carlos', 'pablo', 'raul', 'raúl', 'alvaro', 'álvaro',
    'enrique', 'andres', 'andrés', 'male', 'masculino'
  ];

  // Diccionario de palabras comunes sin tilde para corregir su acentuación antes de hablar
  private readonly correccionesPronunciacion: Record<string, string> = {
    murcielago: 'murciélago',
    pajaro: 'pájaro',
    arbol: 'árbol',
    platano: 'plátano',
    lapiz: 'lápiz',
    avion: 'avión',
    camion: 'camión',
    leon: 'león',
    raton: 'ratón',
    corazon: 'corazón',
    melon: 'melón',
    limon: 'limón',
    mama: 'mamá',
    papa: 'papá',
    telefono: 'teléfono',
    semaforo: 'semáforo',
    helicoptero: 'helicóptero',
    lampara: 'lámpara',
    musica: 'música',
    numero: 'número',
    numeros: 'números',
    silaba: 'sílaba',
    silabas: 'sílabas',
    brujula: 'brújula',
    brocoli: 'brócoli',
    delfin: 'delfín',
    jamon: 'jamón',
    boton: 'botón',
    balon: 'balón',
    tiburon: 'tiburón',
    camaleon: 'camaleón',
    azucar: 'azúcar',
    angel: 'ángel',
    facil: 'fácil'
  };

  constructor() {
    if (this.synth) {
      // Carga inicial de voces y suscripción al evento asíncrono onvoiceschanged
      this.loadFemaleVoice();
      this.synth.onvoiceschanged = () => this.loadFemaleVoice();
    }
  }

  // Busca específicamente 'Google español de Estados Unidos' y como segunda opción 'Google español'
  private loadFemaleVoice(): void {
    if (!this.synth) return;
    const allVoices = this.synth.getVoices();
    if (!allVoices.length) return;

    // 1. Buscamos específicamente 'Google español de Estados Unidos'
    const googleEsUs = allVoices.find(
      v => v.name.toLowerCase() === 'google español de estados unidos' ||
           v.name.toLowerCase().includes('google español de estados unidos')
    );

    // 2. Si no la encuentra, buscamos 'Google español'
    const googleEs = allVoices.find(
      v => v.name.toLowerCase() === 'google español' ||
           v.name.toLowerCase().includes('google español')
    );

    // 3. Respaldo adicional con otras voces femeninas en español
    const esVoices = allVoices.filter(v => v.lang.toLowerCase().includes('es'));
    const fallbackFemale = esVoices.find(v => {
      const name = v.name.toLowerCase();
      return (
        this.preferredFemaleNames.some(pref => name.includes(pref)) &&
        !this.excludedMaleNames.some(male => name.includes(male))
      );
    });

    this.femaleVoice = googleEsUs || googleEs || fallbackFemale || esVoices[0] || allVoices[0];
    this.selectedVoiceName.set(this.femaleVoice?.name || 'Google español de Estados Unidos');
  }

  // Corrige palabras comunes que vienen de Firestore sin tilde (ej: 'murcielago' -> 'murciélago')
  private corregirTextoHablar(text: string): string {
    let textoHablar = text;
    for (const [sinTilde, conTilde] of Object.entries(this.correccionesPronunciacion)) {
      const regex = new RegExp(`\\b${sinTilde.trim()}\\b`, 'gi');
      textoHablar = textoHablar.replace(regex, conTilde);
    }
    return textoHablar;
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
    // Aplicamos las correcciones de acentuación/tildes (ej: 'murcielago' -> 'murciélago')
    const textoHablar = this.corregirTextoHablar(text);

    if (this.useGeminiTts() && environment.geminiApiKey) {
      const ok = await this.speakWithGemini(textoHablar);
      if (ok) return;
    }

    if (!this.synth) return;

    // Si aún no se había cargado la voz femenina cuando se llamó a speak(), intentamos cargarla ahora
    if (!this.femaleVoice) {
      this.loadFemaleVoice();
    }

    // Si el sintetizador quedó pausado por el navegador, lo reanudamos sin cancelar el audio en curso
    if (this.synth.paused) {
      this.synth.resume();
    }

    // Guardamos la instancia en la propiedad de la clase para evitar que el Garbage Collector la elimine a mitad de frase
    this.utterance = new SpeechSynthesisUtterance(textoHablar);
    const currentUtterance = this.utterance;
    this.activeUtterances.push(currentUtterance);

    // Asignamos la voz femenina encontrada y el idioma nativo en español ('es-ES' o el de la voz seleccionada)
    if (this.femaleVoice) {
      currentUtterance.voice = this.femaleVoice;
    }
    currentUtterance.lang = this.femaleVoice?.lang || 'es-ES';
    currentUtterance.pitch = this.pitch();
    currentUtterance.rate = this.rate();

    // Limpiamos la referencia únicamente cuando el navegador termine de pronunciar toda la frase
    const cleanup = () => {
      this.activeUtterances = this.activeUtterances.filter(u => u !== currentUtterance);
    };
    currentUtterance.onend = cleanup;
    currentUtterance.onerror = cleanup;

    this.synth.speak(currentUtterance);
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
