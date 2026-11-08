import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceService } from '../../core/services/voice.service';
import { ProgressService } from '../../core/services/progress.service';

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

  private readonly cards: WordCard[] = [
    { word: 'MARIPOSA', syllable: 'MA', emoji: '🦋', options: ['MA', 'ME', 'MO'] },
    { word: 'MESA', syllable: 'ME', emoji: '🪑', options: ['MI', 'ME', 'MU'] },
    { word: 'MONO', syllable: 'MO', emoji: '🐵', options: ['MA', 'MO', 'MI'] },
    { word: 'PALOMA', syllable: 'PA', emoji: '🕊️', options: ['PA', 'PE', 'PO'] },
    { word: 'PELOTA', syllable: 'PE', emoji: '⚽', options: ['PI', 'PE', 'PU'] },
    { word: 'SAPO', syllable: 'SA', emoji: '🐸', options: ['SA', 'SE', 'SO'] },
    { word: 'LUNA', syllable: 'LU', emoji: '🌙', options: ['LA', 'LI', 'LU'] }
  ];

  readonly syllableGroups = [
    { consonant: 'M', syllables: ['MA', 'ME', 'MI', 'MO', 'MU'] },
    { consonant: 'P', syllables: ['PA', 'PE', 'PI', 'PO', 'PU'] },
    { consonant: 'S', syllables: ['SA', 'SE', 'SI', 'SO', 'SU'] },
    { consonant: 'L', syllables: ['LA', 'LE', 'LI', 'LO', 'LU'] }
  ];

  readonly current = signal<WordCard>(this.cards[0]);
  readonly activeGroupIndex = signal<number>(0);

  ngOnInit(): void {
    this.nextCard();
  }

  nextCard(): void {
    const pick = this.cards[Math.floor(Math.random() * this.cards.length)];
    this.current.set(pick);
    this.voice.speak(`¿Con qué sílaba empieza la palabra ${pick.word.toLowerCase()}?`);
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
