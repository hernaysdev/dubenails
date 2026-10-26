import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConfirmarService, ReservaPorConfirmar } from 'src/app/services/confirmar.service';
import { formatoHora } from 'src/app/services/disponibilidad.service';
import { PagoElegido } from 'src/app/services/agenda.service';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

type Vista = 'cargando' | 'pendiente' | 'confirmada' | 'rechazada' | 'otro-horario' | 'vencida' | 'invalido' | 'error' | 'en-revision';

// La clienta abre el link que le mando la admin y confirma (o no) la hora apartada. Sin cuenta.
@Component({
  selector: 'app-confirmar',
  templateUrl: './confirmar.component.html',
  styleUrls: ['./confirmar.component.scss']
})
export class ConfirmarComponent implements OnInit {
  vista: Vista = 'cargando';
  reserva: ReservaPorConfirmar | null = null;
  enviando = false;
  confirmandoRechazo = false;
  error = '';
  pago: PagoElegido | null = null;
  // si la cita no tiene correo, la clienta puede dejarlo para recibir los avisos
  correo = '';
  // la cita ya tiene correo y la clienta quiere poner otro
  cambiandoCorreo = false;
  private token = '';
  readonly hora = formatoHora;

  constructor(private route: ActivatedRoute, private confirmarService: ConfirmarService) { }

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.confirmarService.ver(this.token).subscribe({
      next: (r) => {
        this.reserva = r;
        this.vista = r.estado === 'pendiente' && r.pideOtroHorario ? 'otro-horario' : r.estado;
      },
      error: (e) => this.vista = e.status === 404 ? 'invalido' : 'error',
    });
  }

  // si la admin configuro medios de pago, se confirma adjuntando la captura
  get conPago() { return !!this.reserva?.pago?.requerido; }
  get pagoRechazado() { return this.reserva?.pago?.estado === 'rechazado'; }
  get pideCorreo() { return !!this.reserva && (!this.reserva.tieneCorreo || this.cambiandoCorreo); }
  get correoValido() { return !this.correo.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo.trim()); }
  // hay a donde avisarle (correo de la cita o el que acaba de dejar)
  get conCorreo() { return !!this.reserva?.tieneCorreo; }

  get fecha() {
    const r = this.reserva!;
    return `${DIAS[new Date(r.year, r.mes, r.dia).getDay()]} ${r.dia} de ${MESES[r.mes]}`;
  }

  get whatsappSalon() {
    const numero = (this.reserva?.whatsapp || '').replace(/\D/g, '');
    return numero ? `https://wa.me/${numero}` : '';
  }

  get mapa() {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.reserva?.direccion || '')}`;
  }

  responder(accion: 'aceptar' | 'rechazar' | 'otro-horario') {
    this.error = '';
    if (accion === 'aceptar' && !this.correoValido) { this.error = 'Revisa tu correo o déjalo en blanco.'; return; }
    this.enviando = true;
    this.confirmarService.responder(this.token, accion, accion === 'aceptar' ? this.correo.trim() : '', this.cambiandoCorreo).subscribe({
      next: ({ estado }) => {
        if (accion === 'aceptar') this.marcarCorreo();
        this.enviando = false;
        this.confirmandoRechazo = false;
        this.vista = accion === 'otro-horario' && estado === 'pendiente' ? 'otro-horario' : estado;
      },
      error: (e) => {
        this.enviando = false;
        if (e.status === 410) { this.vista = 'vencida'; return; }
        if (e.status === 404) { this.vista = 'invalido'; return; }
        this.error = e.msg || 'No pudimos guardar tu respuesta. Intenta de nuevo.';
      },
    });
  }

  enviarPago() {
    if (!this.pago) { this.error = 'Elige cuánto pagas, el medio y adjunta la captura del pago.'; return; }
    if (!this.correoValido) { this.error = 'Revisa tu correo o déjalo en blanco.'; return; }
    this.error = '';
    this.enviando = true;
    this.confirmarService.subirPago(this.token, this.pago, this.correo.trim(), this.cambiandoCorreo).subscribe({
      next: () => { this.enviando = false; this.marcarCorreo(); this.vista = 'en-revision'; },
      error: (e) => {
        this.enviando = false;
        if (e.status === 410) { this.vista = 'vencida'; return; }
        if (e.status === 404) { this.vista = 'invalido'; return; }
        this.error = e.msg || 'No pudimos subir la captura. Intenta de nuevo.';
      },
    });
  }

  private marcarCorreo() {
    if (this.reserva && this.correo.trim()) this.reserva.tieneCorreo = true;
  }
}
