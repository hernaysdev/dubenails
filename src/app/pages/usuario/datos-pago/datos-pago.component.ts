import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContenidoService, MedioPagoAdmin } from 'src/app/services/contenido.service';

export const MAX_MEDIOS = 8;

// Admin: medios de pago que ve la clienta al reservar. Puede agregar, renombrar, activar o
// desactivar y eliminar. Si no hay ninguno activo, la reserva no pide pago.
@Component({
  selector: 'app-datos-pago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './datos-pago.component.html',
  styleUrls: ['./datos-pago.component.scss']
})
export class DatosPagoComponent implements OnInit {
  medios: MedioPagoAdmin[] = [];
  cargando = true;
  guardando = false;
  // indice del medio que se esta por eliminar (pide confirmacion)
  eliminando: number | null = null;
  mensajeOk = '';
  mensajeError = '';
  readonly maxMedios = MAX_MEDIOS;

  constructor(private contenidoService: ContenidoService) { }

  ngOnInit(): void {
    this.contenidoService.pagosAdmin().subscribe({
      next: (m) => { this.medios = m; this.cargando = false; },
      error: () => { this.cargando = false; this.mensajeError = 'No pudimos cargar los datos de pago.'; },
    });
  }

  get hayActivos() { return this.medios.some(m => m.activo); }

  private cambio() { this.mensajeOk = ''; this.mensajeError = ''; }

  alternar(m: MedioPagoAdmin) { m.activo = !m.activo; this.cambio(); }
  escribirNombre(m: MedioPagoAdmin, evento: Event) { m.nombre = (evento.target as HTMLInputElement).value; this.cambio(); }
  escribirDatos(m: MedioPagoAdmin, evento: Event) { m.datos = (evento.target as HTMLTextAreaElement).value; this.cambio(); }

  agregar() {
    if (this.medios.length >= MAX_MEDIOS) return;
    this.medios = [...this.medios, { nombre: '', datos: '', activo: true }];
    this.cambio();
  }

  eliminar(i: number) {
    this.medios = this.medios.filter((_, k) => k !== i);
    this.eliminando = null;
    this.cambio();
    this.mensajeOk = 'Medio eliminado. Toca "Guardar" para aplicar el cambio.';
  }

  guardar() {
    this.cambio();
    const sinNombre = this.medios.find(m => !m.nombre.trim());
    if (sinNombre) { this.mensajeError = 'Cada medio de pago necesita un nombre.'; return; }
    const sinDatos = this.medios.find(m => m.activo && !m.datos.trim());
    if (sinDatos) { this.mensajeError = `Escribe los datos de ${sinDatos.nombre} o desactívalo.`; return; }
    const nombres = this.medios.map(m => m.nombre.trim().toLowerCase());
    const repetido = nombres.find((n, i) => nombres.indexOf(n) !== i);
    if (repetido) { this.mensajeError = 'Hay dos medios con el mismo nombre.'; return; }
    this.guardando = true;
    this.contenidoService.guardarPagos(this.medios).subscribe({
      next: (r: any) => {
        this.guardando = false;
        // la API asigna el id a los medios nuevos
        if (Array.isArray(r?.medios)) this.medios = r.medios;
        this.mensajeOk = this.hayActivos ? 'Guardado. Las reservas ahora piden la captura del pago.' : 'Guardado. Sin medios activos, las reservas no piden pago.';
      },
      error: (msg: string) => { this.guardando = false; this.mensajeError = msg; },
    });
  }
}
