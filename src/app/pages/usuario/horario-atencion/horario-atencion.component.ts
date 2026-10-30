import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContenidoService, DiaHorario, Horario } from 'src/app/services/contenido.service';

/** 6:00 a 24:00 cada media hora (en decimales, como la agenda) */
export const OPCIONES_HORA = Array.from({ length: 37 }, (_, i) => 6 + i * 0.5);
export const textoHora = (h: number) => `${Math.floor(h)}:${h % 1 ? '30' : '00'}`;

// en pantalla la semana parte el lunes; en la API el indice 0 es el domingo
const ORDEN = [1, 2, 3, 4, 5, 6, 0];
const NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface Fila { i: number; nombre: string; abierto: boolean; abre: number; cierra: number; conAlmuerzo: boolean; almuerzo: [number, number]; }

/** Revisa la semana antes de guardar (la API valida lo mismo). Devuelve el error en español o ''. */
export const revisarSemana = (filas: Fila[]): string => {
  for (const f of filas.filter(x => x.abierto)) {
    if (f.cierra <= f.abre) return `El ${f.nombre.toLowerCase()} debe cerrar después de abrir.`;
    if (f.conAlmuerzo && (f.almuerzo[1] <= f.almuerzo[0] || f.almuerzo[0] <= f.abre || f.almuerzo[1] >= f.cierra)) {
      return `El almuerzo del ${f.nombre.toLowerCase()} debe quedar dentro del horario.`;
    }
  }
  return filas.some(f => f.abierto) ? '' : 'Deja al menos un día abierto.';
};

// Admin: horario de atención. Define qué días y horas pueden reservar las clientas (la admin puede agendar fuera de él).
@Component({
  selector: 'app-horario-atencion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horario-atencion.component.html',
  styleUrls: ['./horario-atencion.component.scss']
})
export class HorarioAtencionComponent implements OnInit {
  filas: Fila[] = [];
  cargando = true;
  guardando = false;
  mensajeOk = '';
  mensajeError = '';
  readonly opciones = OPCIONES_HORA;
  readonly texto = textoHora;

  constructor(private contenidoService: ContenidoService) { }

  ngOnInit(): void {
    this.contenidoService.horario().subscribe(h => { this.usar(h); this.cargando = false; });
  }

  private usar(h: Horario) {
    this.filas = ORDEN.map(i => {
      const d: DiaHorario | null = h.dias[i];
      return {
        i,
        nombre: NOMBRES[i],
        abierto: !!d,
        abre: d?.abre ?? 9,
        cierra: d?.cierra ?? 19,
        conAlmuerzo: !!d?.almuerzo,
        almuerzo: d?.almuerzo ? [...d.almuerzo] as [number, number] : [13, 14],
      };
    });
  }

  private cambio() { this.mensajeOk = ''; this.mensajeError = ''; }

  alternar(f: Fila) { f.abierto = !f.abierto; this.cambio(); }
  alternarAlmuerzo(f: Fila) { f.conAlmuerzo = !f.conAlmuerzo; this.cambio(); }
  elegir(f: Fila, campo: 'abre' | 'cierra' | 'almuerzo0' | 'almuerzo1', evento: Event) {
    const v = Number((evento.target as HTMLSelectElement).value);
    if (campo === 'almuerzo0') f.almuerzo = [v, f.almuerzo[1]];
    else if (campo === 'almuerzo1') f.almuerzo = [f.almuerzo[0], v];
    else f[campo] = v;
    this.cambio();
  }

  /** copia el horario del lunes a martes-sabado (lo mas comun) */
  copiarLunes() {
    const lunes = this.filas[0];
    for (const f of this.filas.slice(1, 6)) {
      Object.assign(f, { abierto: lunes.abierto, abre: lunes.abre, cierra: lunes.cierra, conAlmuerzo: lunes.conAlmuerzo, almuerzo: [...lunes.almuerzo] });
    }
    this.cambio();
    this.mensajeOk = 'Copiado a martes–sábado. Toca "Guardar horario" para aplicarlo.';
  }

  guardar() {
    this.cambio();
    const error = revisarSemana(this.filas);
    if (error) { this.mensajeError = error; return; }
    const dias: (DiaHorario | null)[] = Array(7).fill(null);
    for (const f of this.filas) {
      dias[f.i] = f.abierto ? { abre: f.abre, cierra: f.cierra, almuerzo: f.conAlmuerzo ? f.almuerzo : null } : null;
    }
    this.guardando = true;
    this.contenidoService.guardarHorario({ dias }).subscribe({
      next: (h) => { this.guardando = false; this.usar(h); this.mensajeOk = 'Horario guardado. Las clientas ya reservan con el nuevo horario.'; },
      error: (msg: string) => { this.guardando = false; this.mensajeError = msg; },
    });
  }
}
