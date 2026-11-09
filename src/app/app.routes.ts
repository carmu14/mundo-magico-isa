import { Routes } from '@angular/router';
import { MathComponent } from './features/math/math.component';
import { SyllablesComponent } from './features/syllables/syllables.component';
// Importación del nuevo componente Standalone de sílabas ordenables conectado a Firestore
import { SilabasComponent } from './features/lenguaje/silabas/silabas.component';
import { MissionsComponent } from './features/missions/missions.component';
import { StickersComponent } from './features/stickers/stickers.component';

export const routes: Routes = [
  { path: '', redirectTo: 'matematicas', pathMatch: 'full' },
  { path: 'matematicas', component: MathComponent },
  // Ruta principal de sílabas y ruta específica de lenguaje/silabas
  { path: 'silabas', component: SilabasComponent },
  { path: 'lenguaje/silabas', component: SilabasComponent },
  { path: 'silabas-piano', component: SyllablesComponent },
  { path: 'misiones', component: MissionsComponent },
  { path: 'stickers', component: StickersComponent }
];
