import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceService } from '../../core/services/voice.service';
import { ProgressService } from '../../core/services/progress.service';

interface CountItem {
  index: number;
  emoji: string;
  counted: boolean;
}

@Component({
  selector: 'app-math',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-magic math-box">
      <div class="mode-switch">
        <button class="btn-3d" [class.btn-pink]="mode() === 'contar'" (click)="setMode('contar')">
          🍓 Contar Tocando
        </button>
        <button class="btn-3d" [class.btn-lilac]="mode() === 'sumar'" (click)="setMode('sumar')">
          ➕ Sumas Mágicas
        </button>
      </div>

      <h2 class="prompt-title" (click)="repeatQuestion()">
        🔊 {{ questionText() }}
      </h2>

      @if (mode() === 'contar') {
        <p class="helper-text">Toca cada figurita para contarla conmigo:</p>
        <div class="items-grid">
          @for (item of items(); track item.index) {
            <button
              class="item-bubble"
              [class.counted]="item.counted"
              (click)="touchItem(item)">
              <span class="emoji">{{ item.emoji }}</span>
              @if (item.counted) {
                <span class="badge-num">{{ item.index }}</span>
              }
            </button>
          }
        </div>
      } @else {
        <div class="sum-visual">
          <div class="sum-group">
            <div class="mini-emojis">{{ repeatEmoji(currentEmoji(), numA()) }}</div>
            <span class="big-digit">{{ numA() }}</span>
          </div>
          <span class="plus-sign">+</span>
          <div class="sum-group">
            <div class="mini-emojis">{{ repeatEmoji(currentEmoji(), numB()) }}</div>
            <span class="big-digit">{{ numB() }}</span>
          </div>
          <span class="plus-sign">=</span>
          <span class="question-mark">❓</span>
        </div>
      }

      <div class="options-row">
        @for (opt of options(); track opt) {
          <button class="btn-3d btn-sun option-btn" (click)="checkAnswer(opt)">
            {{ opt }}
          </button>
        }
      </div>

      @if (feedback()) {
        <div class="feedback-banner">{{ feedback() }}</div>
      }
    </div>
  `,
  styles: [`
    .math-box { text-align: center; }
    .mode-switch { display: flex; gap: 10px; justify-content: center; margin-bottom: 14px; flex-wrap: wrap; }
    .prompt-title { font-size: 1.35rem; color: #6B3FA0; cursor: pointer; margin: 10px 0; }
    .helper-text { margin: 4px 0 12px; font-size: 1rem; color: #7A5C85; }
    .items-grid { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin: 16px 0; }
    .item-bubble {
      width: 74px; height: 74px; border-radius: 22px; border: 3px dashed #FFB3C6;
      background: #FFF9FB; font-size: 2.2rem; position: relative; cursor: pointer;
      transition: transform 0.2s;
    }
    .item-bubble.counted {
      background: #FFE0EC; border-style: solid; border-color: #FF85A2; transform: scale(1.08);
    }
    .badge-num {
      position: absolute; top: -8px; right: -8px; background: #FF85A2; color: white;
      width: 26px; height: 26px; border-radius: 50%; font-size: 0.95rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .sum-visual { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 18px 0; flex-wrap: wrap; }
    .sum-group { background: #FFF5F8; padding: 12px 16px; border-radius: 20px; border: 2px solid #FFD6E4; }
    .mini-emojis { font-size: 1.6rem; letter-spacing: 3px; }
    .big-digit { font-size: 1.8rem; font-weight: 700; color: #E05A7A; }
    .plus-sign, .question-mark { font-size: 2rem; font-weight: 700; color: #8E5EC9; }
    .options-row { display: flex; justify-content: center; gap: 16px; margin-top: 18px; }
    .option-btn { font-size: 1.7rem; min-width: 78px; min-height: 68px; }
    .feedback-banner { margin-top: 14px; font-weight: 700; font-size: 1.15rem; color: #D9468F; }
  `]
})
export class MathComponent implements OnInit {
  private voice = inject(VoiceService);
  private progress = inject(ProgressService);

  private readonly emojis = ['🍓', '🦄', '🧁', '🦋', '🌸', '🐱'];
  readonly mode = signal<'contar' | 'sumar'>('contar');
  readonly currentEmoji = signal<string>('🍓');
  readonly targetAnswer = signal<number>(5);
  readonly numA = signal<number>(2);
  readonly numB = signal<number>(3);
  readonly items = signal<CountItem[]>([]);
  readonly options = signal<number[]>([]);
  readonly questionText = signal<string>('');
  readonly feedback = signal<string>('');
  private countedSoFar = 0;

  ngOnInit(): void {
    this.generateChallenge();
  }

  setMode(newMode: 'contar' | 'sumar'): void {
    this.mode.set(newMode);
    this.generateChallenge();
  }

  generateChallenge(): void {
    this.feedback.set('');
    this.countedSoFar = 0;
    const emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];
    this.currentEmoji.set(emoji);

    if (this.mode() === 'contar') {
      const count = Math.floor(Math.random() * 8) + 2;
      this.targetAnswer.set(count);
      this.items.set(Array.from({ length: count }, (_, idx) => ({
        index: idx + 1,
        emoji,
        counted: false
      })));
      const prompt = '¿Cuántas figuritas mágicas hay en pantalla? Tócalas para contar.';
      this.questionText.set(prompt);
      this.voice.speak(prompt);
    } else {
      const a = Math.floor(Math.random() * 4) + 1;
      const b = Math.floor(Math.random() * 4) + 1;
      this.numA.set(a);
      this.numB.set(b);
      this.targetAnswer.set(a + b);
      const prompt = `¿Cuánto es ${a} más ${b}?`;
      this.questionText.set(prompt);
      this.voice.speak(prompt);
    }

    const answer = this.targetAnswer();
    const opts = new Set<number>([answer]);
    while (opts.size < 3) {
      const candidate = Math.max(1, answer + (Math.floor(Math.random() * 5) - 2));
      opts.add(candidate);
    }
    this.options.set(Array.from(opts).sort((x, y) => x - y));
  }

  touchItem(item: CountItem): void {
    if (!item.counted) {
      this.countedSoFar++;
      this.items.update(list =>
        list.map(i => (i.index === item.index ? { ...i, counted: true, index: this.countedSoFar } : i))
      );
      this.voice.playNote(this.countedSoFar - 1);
      this.voice.speak(String(this.countedSoFar));
    } else {
      this.voice.playNote(item.index - 1);
      this.voice.speak(String(item.index));
    }
  }

  checkAnswer(selected: number): void {
    const child = this.progress.profile().childName;
    if (selected === this.targetAnswer()) {
      this.voice.playMagicArpeggio();
      const msg = `¡Excelente trabajo ${child}! La respuesta es ${selected}. Ganaste dos estrellas.`;
      this.feedback.set(`✨ ¡Muy bien ${child}! +2 ⭐`);
      this.voice.speak(msg);
      this.progress.addStars(2);
      setTimeout(() => this.generateChallenge(), 2600);
    } else {
      const msg = `Casi casi, ${child}. Contemos juntas otra vez con calma.`;
      this.feedback.set('🌸 ¡Inténtalo una vez más!');
      this.voice.speak(msg);
    }
  }

  repeatQuestion(): void {
    this.voice.speak(this.questionText());
  }

  repeatEmoji(emoji: string, times: number): string {
    return emoji.repeat(times);
  }
}
