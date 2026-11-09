import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
// Importación de getFirestore del SDK modular de Firebase
import { getFirestore } from 'firebase/firestore';
// Proveedores personalizados de Firebase/Firestore compatibles con Angular 22 DI
import { provideFirebaseApp, provideFirestore, initializeApp } from './core/firebase.providers';
import { routes } from './app.routes';

// Configuración temporal de Firebase (pendiente de llenar con las credenciales reales del proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyBG3Ivp0yjbxvN1GwWGkHkoh3EgVaPRYCo",
  authDomain: "mi-mundo-magico-90715.firebaseapp.com",
  projectId: "mi-mundo-magico-90715",
  storageBucket: "mi-mundo-magico-90715.firebasestorage.app",
  messagingSenderId: "221012304368",
  appId: "1:221012304368:web:4e35368b70695685be7d35",
  measurementId: "G-SMH330M1FX"
};

export const appConfig: ApplicationConfig = {
  providers: [
    // Proveedor de rutas de la aplicación
    provideRouter(routes),
    // Inicializa la aplicación de Firebase y la registra en el inyector de dependencias
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    // Registra la instancia de Firestore para poder usar inject(Firestore) en los servicios
    provideFirestore(() => getFirestore()),
    // Configuración del Service Worker para funcionamiento PWA
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
