import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProgressService } from './core/services/progress.service';
import { VoiceService } from './core/services/voice.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="app-shell">
      <header class="top-bar">
        <div class="profile-pill" (click)="greetChild()">
          <span class="avatar">{{ progress.profile().avatar }}</span>
          <div>
            <div class="child-name">{{ progress.profile().childName }}</div>
            <small class="sync-status">
              {{ progress.cloudSynced() ? '☁️ Firestore' : '📱 Modo Local' }}
            </small>
          </div>
        </div>

        <div class="actions-group">
          <div class="stars-badge">⭐ {{ progress.profile().stars }}</div>
          <button class="btn-3d btn-lilac mini-btn" (click)="showVoiceModal.set(true)">
            🧚‍♀️ Voz Dulce
          </button>
          <button class="btn-3d btn-pink mini-btn" (click)="showDadModal.set(true)">
            ⚙️
          </button>
        </div>
      </header>

      <nav class="nav-tabs">
        <a routerLink="/matematicas" routerLinkActive="active-tab" class="tab-item">
          🍓 Números
        </a>
        <a routerLink="/silabas" routerLinkActive="active-tab" class="tab-item">
          🔤 Sílabas
        </a>
        <a routerLink="/misiones" routerLinkActive="active-tab" class="tab-item">
          🌟 Misiones
        </a>
        <a routerLink="/stickers" routerLinkActive="active-tab" class="tab-item">
          👑 Stickers
        </a>
      </nav>

      <main class="main-stage">
        <router-outlet></router-outlet>
      </main>

      @if (showVoiceModal()) {
        <div class="modal-backdrop" (click)="showVoiceModal.set(false)">
          <div class="card-magic modal-box" (click)="$event.stopPropagation()">
            <h3>🧚‍♀️ Configurar Voz Femenina Dulce</h3>
            <p><small>Voz activa: {{ voice.selectedVoiceName() }}</small></p>
            <div class="preset-buttons">
              <button class="btn-3d btn-pink" (click)="voice.setStyle('hada')">🧚‍♀️ Hada Dulce</button>
              <button class="btn-3d btn-lilac" (click)="voice.setStyle('princesa')">👑 Princesita</button>
              <button class="btn-3d btn-mint" (click)="voice.setStyle('maternal')">🤱 Maternal</button>
            </div>
            <button class="btn-3d btn-sun close-btn" (click)="showVoiceModal.set(false)">Listo</button>
          </div>
        </div>
      }

      @if (showDadModal()) {
        <div class="modal-backdrop" (click)="showDadModal.set(false)">
          <div class="card-magic modal-box" (click)="$event.stopPropagation()">
            <h3>⚙️ Rincón de Papá</h3>
            <label>Nombre de tu hija:</label>
            <input class="input-magic" [(ngModel)]="tempName" placeholder="Nombre" />
            <div class="preset-buttons">
              <button class="btn-3d btn-mint" (click)="saveDadSettings()">💾 Guardar</button>
              <button class="btn-3d btn-sun" (click)="progress.addStars(5)">🎁 Regalar +5 ⭐</button>
            </div>
            <button class="btn-3d btn-pink close-btn" (click)="showDadModal.set(false)">Cerrar</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .app-shell { max-width: 680px; margin: 0 auto; padding: 12px 14px 40px; }
    .top-bar {
      display: flex; justify-content: space-between; align-items: center;
      background: white; padding: 10px 14px; border-radius: 24px;
      border: 3px solid #FFE0EC; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;
    }
    .profile-pill { display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .avatar { font-size: 2.1rem; }
    .child-name { font-weight: 700; font-size: 1.15rem; color: #D9468F; }
    .sync-status { font-size: 0.75rem; color: #7A5C85; display: block; }
    .actions-group { display: flex; align-items: center; gap: 8px; }
    .stars-badge {
      background: #FFF3C4; border: 2px solid #FFD166; padding: 6px 12px;
      border-radius: 18px; font-weight: 700; font-size: 1.1rem;
    }
    .mini-btn { padding: 8px 12px; font-size: 0.9rem; }
    .nav-tabs {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px;
    }
    .tab-item {
      text-align: center; text-decoration: none; background: white; color: #6B3FA0;
      padding: 12px 6px; border-radius: 20px; font-weight: 700; border: 3px solid #F3E8FF;
      font-size: 0.98rem;
    }
    .active-tab {
      background: #FF85A2; color: white; border-color: #E05A7A;
      box-shadow: 0 4px 0 #E05A7A;
    }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(74, 53, 79, 0.45);
      display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 50;
    }
    .modal-box { max-width: 400px; width: 100%; text-align: center; }
    .preset-buttons { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin: 14px 0; }
    .input-magic {
      width: 100%; padding: 10px 14px; border-radius: 16px; border: 2px solid #FFB3C6;
      font-family: 'Fredoka', sans-serif; font-size: 1.1rem; margin-top: 6px;
    }
    .close-btn { width: 100%; margin-top: 8px; }
  `]
})
export class AppComponent {
  readonly progress = inject(ProgressService);
  readonly voice = inject(VoiceService);

  readonly showVoiceModal = signal<boolean>(false);
  readonly showDadModal = signal<boolean>(false);
  tempName = this.progress.profile().childName;

  greetChild(): void {
    this.voice.playMagicArpeggio();
    this.voice.speak(`¡Hola ${this.progress.profile().childName}! Qué alegría jugar contigo hoy.`);
  }

  saveDadSettings(): void {
    this.progress.updateChildDetails(this.tempName, this.progress.profile().avatar);
    this.showDadModal.set(false);
  }
}
