import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContenidoService, MedioPagoAdmin } from 'src/app/services/contenido.service';

// Admin: medios de pago que ve la clienta al reservar (con sus datos). Si no hay ninguno activo,
// la reserva no pide pago.
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
  mensajeOk = '';
  mensajeError = '';

  constructor(private contenidoService: ContenidoService) { }

  ngOnInit(): void {
    this.contenidoService.pagosAdmin().subscribe({
      next: (m) => { this.medios = m; this.cargando = false; },
      error: () => { this.cargando = false; this.mensajeError = 'No pudimos cargar los datos de pago.'; },
    });
  }

  get hayActivos() { return this.medios.some(m => m.activo); }

  alternar(m: MedioPagoAdmin) { m.activo = !m.activo; this.mensajeOk = ''; }
  escribir(m: MedioPagoAdmin, evento: Event) { m.datos = (evento.target as HTMLTextAreaElement).value; this.mensajeOk = ''; }

  guardar() {
    this.mensajeOk = ''; this.mensajeError = '';
    const sinDatos = this.medios.find(m => m.activo && !m.datos.trim());
    if (sinDatos) { this.mensajeError = `Escribe los datos de ${sinDatos.nombre} o desactívalo.`; return; }
    this.guardando = true;
    this.contenidoService.guardarPagos(this.medios).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeOk = this.hayActivos ? 'Guardado. Las reservas ahora piden la captura del pago.' : 'Guardado. Sin medios activos, las reservas no piden pago.';
      },
      error: (msg: string) => { this.guardando = false; this.mensajeError = msg; },
    });
  }
}
