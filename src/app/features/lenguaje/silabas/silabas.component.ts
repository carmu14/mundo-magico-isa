import { Component, inject, signal, effect, untracked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../../../core/services/activity.service';
import { VoiceService } from '../../../core/services/voice.service';
import { ProgressService } from '../../../core/services/progress.service';

@Component({
  selector: 'app-silabas',
  standalone: true,
  imports: [CommonModule],
  // Enlace a la plantilla HTML y hoja de estilos SCSS del componente
  templateUrl: './silabas.component.html',
  styleUrl: './silabas.component.scss'
})
export class SilabasComponent implements OnInit {
  // Inyección del ActivityService para consultar las actividades de lenguaje en Firestore
  readonly activityService = inject(ActivityService);
  private readonly voice = inject(VoiceService);
  private readonly progress = inject(ProgressService);

  // Lista de palabras por defecto separadas por guion (-) como respaldo inicial
  private readonly palabrasPorDefecto = [
    'MA-RI-PO-SA',
    'ME-SA',
    'MO-NO',
    'PA-LO-MA',
    'PE-LO-TA',
    'SA-PO',
    'LU-NA'
  ];

  // Mapa de emojis infantiles para acompañar visualmente cada palabra
  private readonly emojisPorPalabra: Record<string, string> = {
    MARIPOSA: '🦋',
    MURCIELAGO: '🦇',
    MURCIÉLAGO: '🦇',
    MESA: '🪑',
    MONO: '🐵',
    PALOMA: '🕊️',
    PELOTA: '⚽',
    SAPO: '🐸',
    LUNA: '🌙',
    MAMA: '👩',
    MAMÁ: '👩',
    PAPA: '👨',
    PAPÁ: '👨',
    GATO: '🐱',
    PERRO: '🐶',
    CASA: '🏠',
    SOL: '☀️',
    FLOR: '🌸',
    PATO: '🦆',
    OSO: '🧸',
    ARBOL: '🌳',
    ÁRBOL: '🌳',
    PAJARO: '🐦',
    PÁJARO: '🐦',
    PLATANO: '🍌',
    PLÁTANO: '🍌',
    AVION: '✈️',
    AVIÓN: '✈️',
    LEON: '🦁',
    LEÓN: '🦁',
    RATON: '🐭',
    RATÓN: '🐭',
    CORAZON: '💖',
    CORAZÓN: '💖',
    DELFIN: '🐬',
    DELFÍN: '🐬',
    TIBURON: '🦈',
    TIBURÓN: '🦈',
    ESTRELLA: '⭐',
    UNICORNIO: '🦄',
    PRINCESA: '👑',
    CASTILLO: '🏰',
    HELADO: '🍦',
    TORTUGA: '🐢',
    CONEJO: '🐰',
    ELEFANTE: '🐘',
    JIRAFA: '🦒',
    BALLENA: '🐋',
    MANZANA: '🍎',
    FRESA: '🍓'
  };

  // Palabra original tomada al azar desde Firestore (ej. "MA-RI-PO-SA")
  readonly palabraOriginal = signal<string>('');
  // Emoji asociado a la palabra actual para darle una pista visual a la niña
  readonly emojiActual = signal<string>('🦄');
  // Sílabas en el orden correcto obtenidas con split('-')
  readonly silabasCorrectas = signal<string[]>([]);
  // Array de sílabas mezcladas que se muestran en la zona de 'Fichas'
  readonly opciones = signal<string[]>([]);
  // Array vacío inicial donde la niña va colocando las sílabas en la zona de 'Construcción'
  readonly respuesta = signal<string[]>([]);
  // Mensaje de retroalimentación en pantalla
  readonly mensaje = signal<string>('');

  constructor() {
    // Efecto reactivo que observa el Signal actividadesLenguaje()
    effect(() => {
      const actividades = this.activityService.actividadesLenguaje();
      const cargando = this.activityService.cargando();
      if (!cargando) {
        untracked(() => {
          if (actividades.length > 0 && actividades[0].palabras?.length > 0) {
            this.cargarPalabraAleatoria(actividades[0].palabras);
          } else if (this.silabasCorrectas().length === 0) {
            this.cargarPalabraAleatoria(this.palabrasPorDefecto);
          }
        });
      }
    });
  }

  ngOnInit(): void {
    // Consulta el nivel 1 de 'silabas' en Firestore al iniciar el componente
    this.activityService.cargarLenguajePorNivel(1, 'silabas');
  }

  // Selecciona una palabra al azar del array palabras y prepara las sílabas mezcladas (sin hablar automáticamente al cargar)
  cargarPalabraAleatoria(palabras: string[], hablar = false): void {
    if (!palabras || palabras.length === 0) return;

    const palabraAzar = palabras[Math.floor(Math.random() * palabras.length)].trim().toUpperCase();
    // Separa la palabra por el guion medio (-) para obtener las sílabas
    const silabas = palabraAzar.split('-').filter(Boolean);

    const palabraCompletaMayus = silabas.join('');
    this.palabraOriginal.set(palabraAzar);
    this.silabasCorrectas.set(silabas);
    this.emojiActual.set(this.emojisPorPalabra[palabraCompletaMayus] ?? '✨');
    // Mezcla las sílabas en el array de opciones y vacía el array de respuesta
    this.opciones.set(this.mezclarArray([...silabas]));
    this.respuesta.set([]);
    this.mensaje.set('');

    // Solo pronuncia la palabra si la acción fue iniciada por interacción del usuario
    if (hablar) {
      const palabraCompleta = palabraCompletaMayus.toLowerCase();
      this.voice.speak(`Forma la palabra ${palabraCompleta}`);
    }
  }

  // Algoritmo Fisher-Yates para mezclar las sílabas aleatoriamente
  private mezclarArray(items: string[]): string[] {
    const copia = [...items];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    // Si quedó en el mismo orden original y tiene más de 1 sílaba, invertimos para asegurar mezcla
    if (copia.length > 1 && copia.join('-') === items.join('-')) {
      copia.reverse();
    }
    return copia;
  }

  // Mueve la sílaba tocada de la zona de 'Fichas' (opciones) a la zona de 'Construcción' (respuesta)
  seleccionarSilaba(silaba: string, index: number): void {
    this.voice.speak(silaba.toLowerCase());

    this.respuesta.update((actual) => [...actual, silaba]);
    this.opciones.update((actual) => actual.filter((_, i) => i !== index));
    this.mensaje.set('');
  }

  // Permite devolver una sílaba de la zona de 'Construcción' a la zona de 'Fichas'
  quitarSilaba(silaba: string, index: number): void {
    this.respuesta.update((actual) => actual.filter((_, i) => i !== index));
    this.opciones.update((actual) => [...actual, silaba]);
    this.mensaje.set('');
  }

  // Limpia la zona de 'Construcción' y devuelve todas las sílabas mezcladas a 'Fichas'
  borrarRespuesta(): void {
    this.opciones.set(this.mezclarArray([...this.silabasCorrectas()]));
    this.respuesta.set([]);
    this.mensaje.set('');
  }

  // Verifica si el orden del array respuesta coincide con la palabra original
  verificarRespuesta(): boolean {
    const palabraFormadaConGuion = this.respuesta().join('-');
    const palabraFormadaSinGuion = this.respuesta().join('');
    const originalSinGuion = this.silabasCorrectas().join('');

    const esCorrecta =
      palabraFormadaConGuion === this.palabraOriginal() ||
      palabraFormadaSinGuion === originalSinGuion;

    if (esCorrecta) {
      this.voice.playMagicArpeggio();
      this.mensaje.set(`✨ ¡Muy bien! Formaste ${originalSinGuion} +2 ⭐`);
      this.voice.speak(`¡Excelente! Formaste la palabra ${originalSinGuion.toLowerCase()}.`);
      this.progress.addStars(2);

      // Carga otra palabra después de que termine la frase de felicitación
      const actividades = this.activityService.actividadesLenguaje();
      const listaPalabras =
        actividades.length > 0 && actividades[0].palabras?.length > 0
          ? actividades[0].palabras
          : this.palabrasPorDefecto;
      setTimeout(() => this.cargarPalabraAleatoria(listaPalabras), 3800);
      return true;
    } else {
      this.mensaje.set('🌸 ¡Casi! Intenta ordenar las sílabas otra vez.');
      this.voice.speak('Casi casi, intentemos ordenar las sílabas otra vez.');
      return false;
    }
  }

  // Repite en voz alta la palabra que se debe formar
  escucharPalabra(): void {
    const palabraCompleta = this.silabasCorrectas().join('').toLowerCase();
    if (palabraCompleta) {
      this.voice.speak(palabraCompleta);
    }
  }
}
