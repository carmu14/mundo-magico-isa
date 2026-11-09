import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

// Interfaz que define la estructura de una actividad matemática en Firestore
export interface ActividadMatematica {
  id?: string;
  tipo: string;
  nivel: string;
  operacion: string;
  rango: number[];
}

// Interfaz que define la estructura de una actividad de lenguaje en Firestore
export interface ActividadLenguaje {
  id?: string;
  tipo: string;
  nivel: string;
  operacion: string;
  palabras: string[];
  cuadricula?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  // Inyección de la instancia de Firestore provista en app.config.ts
  private readonly firestore = inject(Firestore);

  // Signal público que almacena la lista de actividades matemáticas obtenidas
  readonly actividadesMath = signal<ActividadMatematica[]>([]);
  // Signal público que almacena la lista de actividades de lenguaje obtenidas
  readonly actividadesLenguaje = signal<ActividadLenguaje[]>([]);
  // Signal público para controlar el estado de carga de la consulta
  readonly cargando = signal<boolean>(false);

  // Consulta en Firestore las actividades de matemáticas de tipo 'suma' para el nivel indicado
  async cargarSumasPorNivel(nivel: number): Promise<void> {
    this.cargando.set(true);
    try {
      // Referencia a la colección 'actividades' y construcción del query con filtros
      const actividadesRef = collection(this.firestore, 'actividades');
      const q = query(
        actividadesRef,
        where('tipo', '==', 'matematicas'),
        where('operacion', '==', 'suma'),
        where('nivel', '==', nivel)
      );

      // Ejecución de la consulta y transformación de documentos al modelo ActividadMatematica
      const querySnapshot = await getDocs(q);
      const resultados: ActividadMatematica[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ActividadMatematica, 'id'>)
      }));

      // Actualización del Signal con los resultados obtenidos
      this.actividadesMath.set(resultados);
    } catch (error) {
      console.error('Error al cargar las sumas por nivel:', error);
      this.actividadesMath.set([]);
    } finally {
      // Finaliza el estado de carga sin importar si hubo éxito o error
      this.cargando.set(false);
    }
  }

  // Consulta en Firestore las actividades de lenguaje según el nivel y la operación solicitada
  async cargarLenguajePorNivel(nivel: number, operacion: string): Promise<void> {
    this.cargando.set(true);
    try {
      // Referencia a la colección 'actividades' y construcción del query para lenguaje
      const actividadesRef = collection(this.firestore, 'actividades');
      const q = query(
        actividadesRef,
        where('tipo', '==', 'lenguaje'),
        where('operacion', '==', operacion),
        where('nivel', '==', nivel)
      );

      // Ejecución de la consulta y transformación de documentos al modelo ActividadLenguaje
      const querySnapshot = await getDocs(q);
      const resultados: ActividadLenguaje[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ActividadLenguaje, 'id'>)
      }));

      // Actualización del Signal de lenguaje con los resultados obtenidos
      this.actividadesLenguaje.set(resultados);
    } catch (error) {
      console.error('Error al cargar las actividades de lenguaje por nivel:', error);
      this.actividadesLenguaje.set([]);
    } finally {
      // Reutiliza el Signal cargando para finalizar el estado de carga
      this.cargando.set(false);
    }
  }
}
