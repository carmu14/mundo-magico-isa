import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressService } from '../../core/services/progress.service';
import { VoiceService } from '../../core/services/voice.service';

interface StickerItem {
  id: string;
  name: string;
  emoji: string;
  cost: number;
}

@Component({
  selector: 'app-stickers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-magic">
      <h2 class="title">👑 Mi Álbum de Stickers Mágicos</h2>
      <p class="subtitle">Canjea tus estrellas por stickers brillantes:</p>

      <div class="stickers-grid">
        @for (s of catalog; track s.id) {
          <div
            class="sticker-card"
            [class.unlocked]="isUnlocked(s.id)"
            (click)="handleStickerTap(s)">
            <div class="sticker-emoji">{{ s.emoji }}</div>
            <div class="sticker-name">{{ s.name }}</div>
            @if (isUnlocked(s.id)) {
              <span class="badge-owned">✨ ¡Desbloqueado!</span>
            } @else {
              <button class="btn-3d btn-sun buy-btn">⭐ {{ s.cost }}</button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .title { text-align: center; color: #6B3FA0; margin: 0; }
    .subtitle { text-align: center; color: #7A5C85; margin-bottom: 16px; }
    .stickers-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(135px, 1fr)); gap: 14px;
    }
    .sticker-card {
      background: #FFF9FB; border: 3px dashed #FFD6E4; border-radius: 22px;
      padding: 14px; text-align: center; cursor: pointer;
    }
    .sticker-card.unlocked {
      background: linear-gradient(135deg, #FFF0F5, #F3E8FF);
      border: 3px solid #B388EB;
    }
    .sticker-emoji { font-size: 3.2rem; filter: grayscale(0.85); opacity: 0.6; transition: 0.25s; }
    .sticker-card.unlocked .sticker-emoji { filter: none; opacity: 1; transform: scale(1.08); }
    .sticker-name { font-weight: 700; margin: 8px 0; }
    .badge-owned { font-size: 0.85rem; color: #7C3AED; font-weight: 700; }
    .buy-btn { padding: 6px 14px; font-size: 0.95rem; }
  `]
})
export class StickersComponent {
  readonly progress = inject(ProgressService);
  private voice = inject(VoiceService);

  readonly catalog: StickerItem[] = [
    { id: 'unicorn', name: 'Unicornio Iris', emoji: '🦄', cost: 5 },
    { id: 'fairy', name: 'Hada Dulce', emoji: '🧚‍♀️', cost: 6 },
    { id: 'kitten', name: 'Gatita Princesa', emoji: '🐱', cost: 8 },
    { id: 'rainbow', name: 'Arcoíris Mágico', emoji: '🌈', cost: 10 },
    { id: 'castle', name: 'Castillo Rosa', emoji: '🏰', cost: 12 },
    { id: 'crown', name: 'Corona Real', emoji: '👑', cost: 15 }
  ];

  isUnlocked(id: string): boolean {
    return this.progress.profile().unlockedStickers.includes(id);
  }

  handleStickerTap(s: StickerItem): void {
    if (this.isUnlocked(s.id)) {
      this.voice.playMagicArpeggio();
      this.voice.speak(`¡Qué hermoso brilla tu sticker de ${s.name}!`);
      return;
    }
    const ok = this.progress.unlockSticker(s.id, s.cost);
    if (ok) {
      this.voice.playMagicArpeggio();
      this.voice.speak(`¡Bravo! Desbloqueaste el sticker de ${s.name}.`);
    } else {
      this.voice.speak(`Necesitas ${s.cost} estrellas para desbloquear ${s.name}. ¡Sigue jugando!`);
    }
  }
}
