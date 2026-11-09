import { EnvironmentProviders, makeEnvironmentProviders, InjectionToken } from '@angular/core';
import { FirebaseApp, FirebaseOptions, getApps, initializeApp as firebaseInitializeApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';

// Token de inyección para la instancia principal de FirebaseApp
export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');

// Inicializa FirebaseApp reutilizando la instancia existente o aplicando un projectId de respaldo si está vacío
export function initializeApp(options: FirebaseOptions): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  const safeOptions: FirebaseOptions = {
    ...options,
    projectId: options.projectId || 'mundo-magico-demo'
  };
  return firebaseInitializeApp(safeOptions);
}

// Proveedor de entorno para registrar FirebaseApp en Angular
export function provideFirebaseApp(fn: () => FirebaseApp): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: FIREBASE_APP,
      useFactory: fn
    }
  ]);
}

// Proveedor de entorno para registrar el servicio Firestore asegurando que FirebaseApp se inicialice antes
export function provideFirestore(fn: () => Firestore): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: Firestore,
      deps: [FIREBASE_APP],
      useFactory: () => fn()
    }
  ]);
}
