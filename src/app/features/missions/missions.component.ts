import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressService, DailyMission } from '../../core/services/progress.service';
import { VoiceService } from '../../core/services/voice.service';

@Component({
  selector: 'app-missions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-magic">
      <h2 class="title">🌟 Mis Misiones del Día</h2>
      <p class="subtitle">Toca cada tarea cuando la hayas completado:</p>

      <div class="missions-list">
        @for (m of progress.profile().missions; track m.id) {
          <div class="mission-row" [class.done]="m.done" (click)="toggle(m)">
            <span class="mission-icon">{{ m.icon }}</span>
            <div class="mission-info">
              <div class="mission-title">{{ m.title }}</div>
              <div class="mission-reward">+{{ m.stars }} estrellas ⭐</div>
            </div>
            <button class="check-circle">
              {{ m.done ? '✅' : '⬜' }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .title { text-align: center; color: #6B3FA0; margin: 0; }
    .subtitle { text-align: center; color: #7A5C85; margin-bottom: 16px; }
    .missions-list { display: flex; flex-direction: column; gap: 12px; }
    .mission-row {
      display: flex; align-items: center; gap: 12px; background: #FFF9FB;
      border: 3px solid #FFE0EC; border-radius: 22px; padding: 12px 16px; cursor: pointer;
      transition: transform 0.15s;
    }
    .mission-row.done { background: #E8FDF5; border-color: #56E39F; }
    .mission-icon { font-size: 2.2rem; }
    .mission-info { flex: 1; }
    .mission-title { font-weight: 700; font-size: 1.1rem; }
    .mission-reward { font-size: 0.9rem; color: #D97706; font-weight: 600; }
    .check-circle { background: none; border: none; font-size: 1.8rem; cursor: pointer; }
  `]
})
export class MissionsComponent {
  readonly progress = inject(ProgressService);
  private voice = inject(VoiceService);

  toggle(mission: DailyMission): void {
    const delta = this.progress.toggleMission(mission.id);
    const child = this.progress.profile().childName;
    if (delta > 0) {
      this.voice.playMagicArpeggio();
      this.voice.speak(`¡Felicidades ${child}! Completaste ${mission.title} y ganaste ${mission.stars} estrellas.`);
    }
  }
}
