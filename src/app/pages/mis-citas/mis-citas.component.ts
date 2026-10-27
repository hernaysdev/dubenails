import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NovedadesService } from 'src/app/services/novedades.service';
import { AgendaService, LinkConfirmacion, PagoCita } from 'src/app/services/agenda.service';
import { dinero } from 'src/app/shared/pago/pago.component';
import { formatoHora } from 'src/app/services/disponibilidad.service';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export interface MiCita {
  id: string; servicio: string; servicioId: string | null; servicioIds?: string[];
  dia: number; mes: number; year: number; hora: number; tramo: number;
  valor: number | null; puedeModificar: boolean;
  // solo para la admin
  clienta?: string; telefono?: string; correo?: string; sinCuenta?: boolean;
  // reserva por confirmar (link a la clienta)
  porConfirmar?: boolean; vence?: string | null; venceTexto?: string; pideOtroHorario?: boolean;
  // pago con captura (null si la cita no lo pide)
  pago?: PagoCita | null;
}

// Clienta: sus proximas citas (cancelar o reprogramar hasta 24 h antes).
// Admin: todas las reservas agrupadas por dia, sin el limite de 24 h.
@Component({
  selector: 'app-mis-citas',
  templateUrl: './mis-citas.component.html',
  styleUrls: ['./mis-citas.component.scss']
})
export class MisCitasComponent implements OnInit, OnDestroy {
  citas: MiCita[] = [];
  dias: { fecha: string; citas: MiCita[] }[] = [];
  esAdmin = false;
  cargando = true;
  error = '';
  aviso = '';
  confirmando: string | null = null;
  // admin: cita en la que confirma apartar con link, y links listos para compartir por cita
  apartando: string | null = null;
  enviandoLink: string | null = null;
  linkDe: Record<string, LinkConfirmacion | undefined> = {};
  readonly hora = formatoHora;
  readonly dinero = dinero;
  readonly HORAS_PARA_CONFIRMAR = 6;
  // admin: revision del pago en un modal con la captura
  revisando: MiCita | null = null;
  captura: string | null = null;
  cargandoCaptura = false;
  rechazandoPago = false;
  motivo = '';
  procesandoPago = false;
  errorPago = '';

  constructor(private agendaService: AgendaService, private router: Router, private novedades: NovedadesService) { }

  private subNovedades?: Subscription;

  ngOnInit(): void {
    // al agendar "por confirmar" desde la agenda se llega aqui con el link listo para compartir
    const nuevo = history.state?.linkNuevo;
    if (nuevo?.citaId && nuevo?.link) this.linkDe[nuevo.citaId] = nuevo.link;
    this.cargar();
    // la esta viendo: el globo de Agenda vuelve a cero (tambien si llega algo mientras mira)
    this.novedades.marcarAgendaVista();
    // una clienta agendo, pago o cancelo (o la admin movio la cita): se actualiza sola
    this.subNovedades = this.novedades.cambios$.subscribe(c => {
      if (c !== 'agenda') return;
      this.cargar(true);
      this.novedades.marcarAgendaVista();
    });
  }

  // silencioso: al actualizarse sola no muestra "Cargando…" (la lista sigue a la vista)
  cargar(silencioso = false) {
    if (!silencioso) this.cargando = true;
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

  enviarLink(c: MiCita) {
    this.error = ''; this.aviso = '';
    this.enviandoLink = c.id;
    this.agendaService.enviarLink(c.id).subscribe({
      next: (link) => {
        this.enviandoLink = null; this.apartando = null;
        this.linkDe[c.id] = link;
        c.porConfirmar = true; c.vence = link.vence; c.venceTexto = link.venceTexto; c.pideOtroHorario = false;
      },
      error: (msg: string) => { this.enviandoLink = null; this.apartando = null; this.error = msg || 'No pudimos crear el link.'; }
    });
  }

  textoPago(c: MiCita) {
    const p = c.pago;
    if (!p) return '';
    const detalle = p.monto !== null ? ` · ${p.porcentaje}% · ${dinero(p.monto)} · ${p.medio}` : '';
    switch (p.estado) {
      case 'esperando-captura': return 'Esperando la captura del pago';
      case 'en-revision': return this.esAdmin ? `Pago para revisar${detalle}` : 'Pago en revisión: te avisaremos al confirmarla';
      case 'aprobado': return `Pagado${detalle}${p.capturaBorrada ? ' (captura eliminada a los 60 días)' : ''}`;
      case 'rechazado': return this.esAdmin ? `Pago rechazado (${p.motivoRechazo}): esperando otra captura` : `Pago rechazado: ${p.motivoRechazo}. Revisa tu correo para subir otra captura.`;
    }
  }

  abrirRevision(c: MiCita) {
    this.cerrarRevision();
    this.revisando = c;
    this.cargandoCaptura = true;
    this.agendaService.verCaptura(c.id).subscribe({
      next: (imagen) => { this.cargandoCaptura = false; this.captura = URL.createObjectURL(imagen); },
      error: () => { this.cargandoCaptura = false; this.errorPago = 'No pudimos cargar la captura. Intenta de nuevo.'; },
    });
  }

  cerrarRevision() {
    if (this.captura) URL.revokeObjectURL(this.captura);
    this.captura = null; this.revisando = null;
    this.rechazandoPago = false; this.motivo = ''; this.errorPago = ''; this.procesandoPago = false;
  }

  aprobarPago() {
    const c = this.revisando;
    if (!c?.pago) return;
    this.procesandoPago = true; this.errorPago = '';
    this.agendaService.aprobarPago(c.id).subscribe({
      next: () => {
        c.pago!.estado = 'aprobado'; c.porConfirmar = false; c.venceTexto = '';
        this.aviso = `Pago aprobado: la cita de ${c.clienta} quedó confirmada.`;
        this.cerrarRevision();
      },
      error: (msg: string) => { this.procesandoPago = false; this.errorPago = msg || 'No pudimos aprobar el pago.'; },
    });
  }

  rechazarPago() {
    const c = this.revisando;
    if (!c?.pago) return;
    if (!this.motivo.trim()) { this.errorPago = 'Escribe el motivo para que la clienta sepa qué corregir.'; return; }
    this.procesandoPago = true; this.errorPago = '';
    this.agendaService.rechazarPago(c.id, this.motivo.trim()).subscribe({
      next: ({ venceTexto, correoEnviado }) => {
        c.pago!.estado = 'rechazado'; c.pago!.motivoRechazo = this.motivo.trim(); c.venceTexto = venceTexto;
        this.aviso = correoEnviado
          ? `Le avisamos a ${c.clienta} por correo. Tiene hasta las ${venceTexto} para subir otra captura.`
          : `${c.clienta} no tiene correo: avísale por WhatsApp. Tiene hasta las ${venceTexto} para subir otra captura.`;
        this.cerrarRevision();
      },
      error: (msg: string) => { this.procesandoPago = false; this.errorPago = msg || 'No pudimos rechazar el pago.'; },
    });
  }

  ngOnDestroy() { this.cerrarRevision(); this.subNovedades?.unsubscribe(); }

  reprogramar(c: MiCita) {
    if (!c.servicioId) return;
    // con varios servicios se buscan horas donde quepan todos
    const servicio = c.servicioIds?.length ? c.servicioIds.join(',') : c.servicioId;
    this.router.navigate(['/reservar'], { queryParams: { servicio, reprogramar: c.id } });
  }
}
