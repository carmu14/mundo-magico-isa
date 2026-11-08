import { Injectable, signal } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, Firestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import confetti from 'canvas-confetti';

export interface DailyMission {
  id: string;
  title: string;
  icon: string;
  stars: number;
  done: boolean;
}

export interface KidProfile {
  childName: string;
  avatar: string;
  stars: number;
  streak: number;
  unlockedStickers: string[];
  missions: DailyMission[];
}

const DEFAULT_PROFILE: KidProfile = {
  childName: 'Princesa',
  avatar: '🦄',
  stars: 10,
  streak: 1,
  unlockedStickers: ['unicorn'],
  missions: [
    { id: 'teeth', title: 'Cepillarme los dientes brillosos', icon: '🪥', stars: 2, done: false },
    { id: 'toys', title: 'Guardar mis juguetes en su lugar', icon: '🧸', stars: 3, done: false },
    { id: 'book', title: 'Practicar mis sílabas y un cuento', icon: '📖', stars: 3, done: false },
    { id: 'math', title: 'Resolver 3 retos de números', icon: '🍓', stars: 4, done: false }
  ]
};

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private firestore: Firestore | null = null;
  private readonly storageKey = 'mundo_magico_profile_v1';

  readonly profile = signal<KidProfile>(this.loadLocal());
  readonly cloudSynced = signal<boolean>(false);

  constructor() {
    this.initFirestoreSync();
  }

  private loadLocal(): KidProfile {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  private initFirestoreSync(): void {
    if (!environment.firebase.apiKey || environment.firebase.apiKey === 'TU_API_KEY') return;
    try {
      const app = getApps().length ? getApps()[0] : initializeApp(environment.firebase);
      this.firestore = getFirestore(app);
      const ref = doc(this.firestore, 'profiles', environment.profileId);
      onSnapshot(ref, snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data() as KidProfile;
          this.profile.set(data);
          localStorage.setItem(this.storageKey, JSON.stringify(data));
          this.cloudSynced.set(true);
        } else {
          this.saveProfile(this.profile());
        }
      });
    } catch {
      this.cloudSynced.set(false);
    }
  }

  private async saveProfile(updated: KidProfile): Promise<void> {
    this.profile.set(updated);
    localStorage.setItem(this.storageKey, JSON.stringify(updated));

    if (!this.firestore || environment.firebase.apiKey === 'TU_API_KEY') return;
    try {
      const ref = doc(this.firestore, 'profiles', environment.profileId);
      await setDoc(ref, updated, { merge: true });
      this.cloudSynced.set(true);
    } catch {
      this.cloudSynced.set(false);
    }
  }

  addStars(amount: number): void {
    const current = this.profile();
    this.saveProfile({ ...current, stars: current.stars + amount });
    this.launchConfetti();
  }

  toggleMission(missionId: string): number {
    const current = this.profile();
    let starsDelta = 0;
    const missions = current.missions.map(m => {
      if (m.id === missionId) {
        const nextDone = !m.done;
        starsDelta = nextDone ? m.stars : -m.stars;
        return { ...m, done: nextDone };
      }
      return m;
    });

    this.saveProfile({
      ...current,
      stars: Math.max(0, current.stars + starsDelta),
      missions
    });

    if (starsDelta > 0) this.launchConfetti();
    return starsDelta;
  }

  unlockSticker(stickerId: string, cost: number): boolean {
    const current = this.profile();
    if (current.unlockedStickers.includes(stickerId) || current.stars < cost) {
      return false;
    }
    this.saveProfile({
      ...current,
      stars: current.stars - cost,
      unlockedStickers: [...current.unlockedStickers, stickerId]
    });
    this.launchConfetti();
    return true;
  }

  updateChildDetails(childName: string, avatar: string): void {
    const current = this.profile();
    this.saveProfile({ ...current, childName: childName.trim() || 'Princesa', avatar });
  }

  launchConfetti(): void {
    confetti({
      particleCount: 70,
      spread: 65,
      origin: { y: 0.7 },
      colors: ['#FF85A2', '#B388EB', '#56E39F', '#FFD166']
    });
  }
}
