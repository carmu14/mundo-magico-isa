import { Routes } from '@angular/router';
import { MathComponent } from './features/math/math.component';
import { SyllablesComponent } from './features/syllables/syllables.component';
import { MissionsComponent } from './features/missions/missions.component';
import { StickersComponent } from './features/stickers/stickers.component';

export const routes: Routes = [
  { path: '', redirectTo: 'matematicas', pathMatch: 'full' },
  { path: 'matematicas', component: MathComponent },
  { path: 'silabas', component: SyllablesComponent },
  { path: 'misiones', component: MissionsComponent },
  { path: 'stickers', component: StickersComponent }
];
