import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AgendaService } from 'src/app/services/agenda.service';
import { formatoHora } from 'src/app/services/disponibilidad.service';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export interface MiCita {
  id: string; servicio: string; servicioId: string | null;
  dia: number; mes: number; year: number; hora: number; tramo: number;
  valor: number | null; puedeModificar: boolean;
  // solo para la admin
  clienta?: string; telefono?: string; correo?: string; sinCuenta?: boolean;
}

// Clienta: sus proximas citas (cancelar o reprogramar hasta 24 h antes).
// Admin: todas las reservas agrupadas por dia, sin el limite de 24 h.
@Component({
  selector: 'app-mis-citas',
  templateUrl: './mis-citas.component.html',
  styleUrls: ['./mis-citas.component.scss']
})
export class MisCitasComponent implements OnInit {
  citas: MiCita[] = [];
  dias: { fecha: string; citas: MiCita[] }[] = [];
  esAdmin = false;
  cargando = true;
  error = '';
  aviso = '';
  confirmando: string | null = null;
  readonly hora = formatoHora;

  constructor(private agendaService: AgendaService, private router: Router) { }

  ngOnInit(): void { this.cargar(); }

  cargar() {
    this.cargando = true;
    this.agendaService.misCitas().subscribe({
      next: ({ citas, esAdmin }) => { this.esAdmin = esAdmin; this.citas = citas; this.agrupar(); this.cargando = false; },
      error: () => { this.cargando = false; this.error = 'No pudimos cargar las citas. Intenta de nuevo.'; }
    });
  }

  fecha(c: MiCita) {
    return `${DIAS[new Date(c.year, c.mes, c.dia).getDay()]} ${c.dia} de ${MESES[c.mes]}`;
  }

  private agrupar() {
    const grupos = new Map<string, MiCita[]>();
    for (const c of this.citas) {
      const f = this.fecha(c);
      grupos.set(f, [...(grupos.get(f) || []), c]);
    }
    this.dias = [...grupos].map(([fecha, citas]) => ({ fecha, citas }));
  }

  cancelar(c: MiCita) {
    this.error = ''; this.aviso = '';
    this.agendaService.cancelarMiCita(c.id).subscribe({
      next: () => {
        this.confirmando = null;
        this.citas = this.citas.filter(x => x.id !== c.id);
        this.agrupar();
        this.aviso = this.esAdmin
          ? `Cancelamos la cita de ${c.clienta} del ${this.fecha(c)} a las ${this.hora(c.hora)}.`
          : `Cancelamos tu cita del ${this.fecha(c)}. El horario quedó libre.`;
      },
      error: (msg: string) => { this.confirmando = null; this.error = msg || 'No pudimos cancelar la cita.'; }
    });
  }

  reprogramar(c: MiCita) {
    if (!c.servicioId) return;
    this.router.navigate(['/reservar'], { queryParams: { servicio: c.servicioId, reprogramar: c.id } });
  }
}
