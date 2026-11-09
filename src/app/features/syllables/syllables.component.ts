import { Component, inject, signal, effect, untracked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceService } from '../../core/services/voice.service';
import { ProgressService } from '../../core/services/progress.service';
// Importación del servicio de actividades para consultar lenguaje desde Firestore
import { ActivityService } from '../../core/services/activity.service';

interface WordCard {
  word: string;
  syllable: string;
  emoji: string;
  options: string[];
}

@Component({
  selector: 'app-syllables',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-magic">
      <h2 class="section-title">🔤 Juego de Sílabas Mágicas</h2>

      <div class="word-showcase" (click)="speakCurrentWord()">
        <div class="big-emoji">{{ current().emoji }}</div>
        <div class="word-label">{{ current().word }}</div>
        <small>Toca el dibujo para escuchar su sonido</small>
      </div>

      <p class="prompt-q">¿Con qué sílaba empieza <strong>{{ current().word }}</strong>?</p>

      <div class="syllable-options">
        @for (syl of current().options; track syl) {
          <button class="btn-3d btn-pink syl-btn" (click)="selectSyllable(syl)">
            {{ syl }}
          </button>
        }
      </div>

      <div class="piano-box">
        <h3>🎹 Piano Fonético (Toca para escuchar)</h3>
        <div class="consonant-tabs">
          @for (group of syllableGroups; track group.consonant; let idx = $index) {
            <button
              class="btn-3d btn-lilac"
              (click)="activeGroupIndex.set(idx)">
              Letra {{ group.consonant }}
            </button>
          }
        </div>
        <div class="piano-keys">
          @for (s of syllableGroups[activeGroupIndex()].syllables; track s; let i = $index) {
            <button class="piano-key" (click)="playSyllableKey(s, i)">
              {{ s }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .section-title { text-align: center; color: #6B3FA0; margin-top: 0; }
    .word-showcase {
      text-align: center; background: #FFF5F8; border-radius: 24px; padding: 16px;
      border: 3px solid #FFD6E4; cursor: pointer; margin-bottom: 14px;
    }
    .big-emoji { font-size: 4rem; }
    .word-label { font-size: 1.7rem; font-weight: 700; color: #E05A7A; letter-spacing: 2px; }
    .prompt-q { text-align: center; font-size: 1.2rem; }
    .syllable-options { display: flex; justify-content: center; gap: 14px; margin: 16px 0 24px; }
    .syl-btn { font-size: 1.5rem; min-width: 82px; }
    .piano-box { background: #F8F2FF; padding: 14px; border-radius: 22px; text-align: center; }
    .consonant-tabs { display: flex; gap: 8px; justify-content: center; margin-bottom: 12px; flex-wrap: wrap; }
    .piano-keys { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
    .piano-key {
      background: white; border: 3px solid #B388EB; border-bottom-width: 7px;
      border-radius: 16px; padding: 14px 16px; font-family: 'Fredoka', sans-serif;
      font-size: 1.3rem; font-weight: 700; color: #5E35B1; cursor: pointer;
    }
    .piano-key:active { transform: translateY(3px); border-bottom-width: 4px; }
  `]
})
export class SyllablesComponent implements OnInit {
  private voice = inject(VoiceService);
  private progress = inject(ProgressService);
  // Inyección del servicio de actividades para obtener las palabras desde Firestore
  readonly activityService = inject(ActivityService);

  // Mapa de emojis asociados a palabras comunes para ilustrar las tarjetas dinámicas
  private readonly emojiMap: Record<string, string> = {
    MARIPOSA: '🦋',
    MESA: '🪑',
    MONO: '🐵',
    MAMA: '👩',
    MANO: '✋',
    PALOMA: '🕊️',
    PELOTA: '⚽',
    PAPA: '👨',
    PATO: '🦆',
    SAPO: '🐸',
    SOPA: '🍲',
    SOL: '☀️',
    LUNA: '🌙',
    LUPA: '🔍',
    LOMA: '⛰️'
  };

  // Tarjetas locales de respaldo en caso de que aún no haya datos en Firestore
  private readonly defaultCards: WordCard[] = [
    { word: 'MARIPOSA', syllable: 'MA', emoji: '🦋', options: ['MA', 'ME', 'MO'] },
    { word: 'MESA', syllable: 'ME', emoji: '🪑', options: ['MI', 'ME', 'MU'] },
    { word: 'MONO', syllable: 'MO', emoji: '🐵', options: ['MA', 'MO', 'MI'] },
    { word: 'PALOMA', syllable: 'PA', emoji: '🕊️', options: ['PA', 'PE', 'PO'] },
    { word: 'PELOTA', syllable: 'PE', emoji: '⚽', options: ['PI', 'PE', 'PU'] },
    { word: 'SAPO', syllable: 'SA', emoji: '🐸', options: ['SA', 'SE', 'SO'] },
    { word: 'LUNA', syllable: 'LU', emoji: '🌙', options: ['LA', 'LI', 'LU'] }
  ];

  // Signal con las tarjetas activas del juego (inicia con las tarjetas por defecto)
  readonly cards = signal<WordCard[]>(this.defaultCards);
  // Signal opcional para almacenar el tamaño de cuadrícula cuando venga desde Firestore
  readonly cuadricula = signal<number | undefined>(undefined);

  readonly syllableGroups = [
    { consonant: 'M', syllables: ['MA', 'ME', 'MI', 'MO', 'MU'] },
    { consonant: 'P', syllables: ['PA', 'PE', 'PI', 'PO', 'PU'] },
    { consonant: 'S', syllables: ['SA', 'SE', 'SI', 'SO', 'SU'] },
    { consonant: 'L', syllables: ['LA', 'LE', 'LI', 'LO', 'LU'] }
  ];

  readonly current = signal<WordCard>(this.defaultCards[0]);
  readonly activeGroupIndex = signal<number>(0);

  constructor() {
    // Efecto reactivo que escucha cuando actividadesLenguaje() recibe datos desde Firestore
    effect(() => {
      const actividades = this.activityService.actividadesLenguaje();
      if (actividades.length > 0 && actividades[0].palabras?.length > 0) {
        const actividad = actividades[0];
        // Transformamos cada palabra del array 'palabras' en una tarjeta de sílabas
        const nuevasTarjetas: WordCard[] = actividad.palabras.map((rawWord) => {
          const word = rawWord.trim().toUpperCase();
          const syllable = word.slice(0, 2);
          const consonant = word[0] || 'M';
          const vowels = ['A', 'E', 'I', 'O', 'U'];
          const opts = new Set<string>([syllable]);
          while (opts.size < 3) {
            const randomVowel = vowels[Math.floor(Math.random() * vowels.length)];
            opts.add(`${consonant}${randomVowel}`);
          }
          return {
            word,
            syllable,
            emoji: this.emojiMap[word] ?? '✨',
            options: Array.from(opts).sort()
          };
        });

        // Actualizamos los Signals sin generar dependencias circulares en el effect
        untracked(() => {
          this.cards.set(nuevasTarjetas);
          this.cuadricula.set(actividad.cuadricula);
          this.nextCard();
        });
      }
    });
  }

  ngOnInit(): void {
    // Consultamos las actividades de lenguaje de nivel 1 y operación 'silabas' en Firestore
    this.activityService.cargarLenguajePorNivel(1, 'silabas');
    this.nextCard();
  }

  nextCard(hablar = false): void {
    const lista = this.cards();
    const pick = lista[Math.floor(Math.random() * lista.length)];
    this.current.set(pick);
    if (hablar) {
      this.voice.speak(`¿Con qué sílaba empieza la palabra ${pick.word.toLowerCase()}?`);
    }
  }

  speakCurrentWord(): void {
    const c = this.current();
    this.voice.speak(`${c.word.toLowerCase()}. Empieza con...`);
  }

  selectSyllable(syl: string): void {
    const c = this.current();
    if (syl === c.syllable) {
      this.voice.playMagicArpeggio();
      this.voice.speak(`¡Muy bien! ${c.word.toLowerCase()} empieza con ${syl.toLowerCase()}. Ganaste dos estrellas.`);
      this.progress.addStars(2);
      setTimeout(() => this.nextCard(), 2500);
    } else {
      this.voice.speak(`Esa suena ${syl.toLowerCase()}. Escucha bien: ${c.word.toLowerCase()}.`);
    }
  }

  playSyllableKey(syl: string, index: number): void {
    this.voice.playNote(index);
    this.voice.speak(syl.toLowerCase());
  }
}
