import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConfirmarService, ReservaPorConfirmar } from 'src/app/services/confirmar.service';
import { formatoHora } from 'src/app/services/disponibilidad.service';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

type Vista = 'cargando' | 'pendiente' | 'confirmada' | 'rechazada' | 'otro-horario' | 'vencida' | 'invalido' | 'error';

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
    this.enviando = true;
    this.confirmarService.responder(this.token, accion).subscribe({
      next: ({ estado }) => {
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
}
