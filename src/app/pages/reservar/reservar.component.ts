import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DiaDisponible, DisponibilidadService, Servicio, formatoDuracion, formatoHora } from 'src/app/services/disponibilidad.service';
import { AgendaService } from 'src/app/services/agenda.service';
import { UsuariosService } from 'src/app/services/usuarios.service';

type Paso = 'servicio' | 'dia' | 'hora' | 'datos' | 'listo';
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_ADELANTE = 3;

// Reserva guiada: servicio -> dia -> hora -> datos -> listo. Se puede recorrer sin cuenta;
// la sesion se pide en el paso de datos. La disponibilidad viene de /api/disponibilidad.
@Component({
  selector: 'app-reservar',
  templateUrl: './reservar.component.html',
  styleUrls: ['./reservar.component.scss']
})
export class ReservarComponent implements OnInit {
  paso: Paso = 'servicio';
  readonly pasos: Paso[] = ['servicio', 'dia', 'hora', 'datos'];
  readonly hora = formatoHora;
  readonly duracion = formatoDuracion;

  servicios: Servicio[] = [];
  servicio: Servicio | null = null;
  mes: number; year: number;
  private readonly mesInicial: number; private readonly yearInicial: number;
  dias: DiaDisponible[] = [];
  blancos: number[] = [];
  dia: number | null = null;
  horas: number[] = [];
  horaElegida: number | null = null;

  usuario: { id: string; nombre: string; telefono: string; correo: string } | null = null;
  mostrarRegistro = false;
  form: FormGroup;
  cargando = false;
  enviando = false;
  error = '';
  // id de la cita que se esta cambiando (viene de Mis citas); null = reserva nueva
  reprogramar: string | null = null;

  constructor(
    private disponibilidad: DisponibilidadService,
    private agendaService: AgendaService,
    private usuariosService: UsuariosService,
    private route: ActivatedRoute,
    private router: Router,
    fb: FormBuilder,
  ) {
    const hoy = new Date();
    this.mes = this.mesInicial = hoy.getMonth();
    this.year = this.yearInicial = hoy.getFullYear();
    this.form = fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9+\s()-]{7,20}$/)]],
    });
  }

  ngOnInit(): void {
    this.reprogramar = this.route.snapshot.queryParamMap.get('reprogramar');
    this.cargando = true;
    this.disponibilidad.servicios().subscribe({
      next: (servicios) => {
        this.servicios = servicios;
        this.cargando = false;
        const id = this.route.snapshot.queryParamMap.get('servicio');
        const elegido = servicios.find(s => s.id === id);
        if (elegido) this.elegirServicio(elegido);
      },
      error: () => { this.cargando = false; this.error = 'No pudimos cargar los servicios. Intenta de nuevo en un momento.'; }
    });
    this.cargarUsuario();
  }

  get numeroPaso() { return this.pasos.indexOf(this.paso) + 1; }
  get nombreMes() { return `${MESES[this.mes]} ${this.year}`; }
  get puedeRetroceder() { return this.year > this.yearInicial || this.mes > this.mesInicial; }
  get puedeAvanzar() { return (this.year - this.yearInicial) * 12 + this.mes - this.mesInicial < MESES_ADELANTE; }
  get fechaElegida() {
    if (this.dia === null) return '';
    const f = new Date(this.year, this.mes, this.dia);
    return `${DIAS[f.getDay()]} ${this.dia} de ${MESES[this.mes]}`;
  }

  elegirServicio(s: Servicio) {
    this.servicio = s;
    this.dia = null; this.horaElegida = null; this.error = '';
    this.paso = 'dia';
    this.cargarDias();
  }

  cambiarMes(delta: number) {
    const fecha = new Date(this.year, this.mes + delta, 1);
    this.mes = fecha.getMonth(); this.year = fecha.getFullYear();
    this.dia = null;
    this.cargarDias();
  }

  cargarDias() {
    if (!this.servicio) return;
    this.blancos = Array(new Date(this.year, this.mes, 1).getDay()).fill(0);
    this.dias = [];
    this.cargando = true;
    this.disponibilidad.dias(this.servicio.id, this.mes, this.year).subscribe({
      next: (dias) => { this.dias = dias; this.cargando = false; },
      error: () => { this.cargando = false; this.error = 'No pudimos cargar los días disponibles.'; }
    });
  }

  elegirDia(d: DiaDisponible) {
    if (!d.libres || !this.servicio) return;
    this.dia = d.dia; this.horaElegida = null; this.error = '';
    this.paso = 'hora';
    this.cargarHoras();
  }

  cargarHoras() {
    if (!this.servicio || this.dia === null) return;
    this.horas = [];
    this.cargando = true;
    this.disponibilidad.horas(this.servicio.id, this.dia, this.mes, this.year).subscribe({
      next: (horas) => { this.horas = horas; this.cargando = false; },
      error: () => { this.cargando = false; this.error = 'No pudimos cargar las horas.'; }
    });
  }

  elegirHora(h: number) {
    this.horaElegida = h;
    this.error = '';
    this.paso = 'datos';
  }

  volver() {
    const anterior: Record<Paso, Paso> = { servicio: 'servicio', dia: 'servicio', hora: 'dia', datos: 'hora', listo: 'listo' };
    this.paso = anterior[this.paso];
    this.error = '';
  }

  cargarUsuario() {
    const token = localStorage.getItem('token');
    if (!token) { this.usuario = null; return; }
    this.usuariosService.getUsuario(token).subscribe({
      next: (u: any) => {
        this.usuario = { id: u.id, nombre: u.nombre, telefono: u.telefono ? String(u.telefono) : '', correo: u.correo };
        this.form.patchValue({ nombre: this.form.value.nombre || u.nombre, telefono: this.form.value.telefono || this.usuario.telefono });
      },
      error: () => { this.usuario = null; }
    });
  }

  confirmar() {
    if (!this.usuario || !this.servicio || this.dia === null || this.horaElegida === null) return;
    if (this.reprogramar) return this.confirmarCambio();
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { nombre, telefono } = this.form.value;
    this.enviando = true;
    this.error = '';
    this.agendaService.recibirDatos({
      nombre: nombre.trim(),
      dia: String(this.dia),
      horaNueva: this.horaElegida,
      servicio: this.servicio.nombre,
      horaServicio: this.servicio.duracion,
      telefono: telefono.trim(),
      mes: this.mes,
      year: this.year,
      id: this.usuario.id,
      nuevo: true,
      token: '',
      estado: true,
      correo: this.usuario.correo || '',
      precio: this.servicio.precio,
    }).subscribe({
      next: () => { this.enviando = false; this.paso = 'listo'; },
      error: (msg: string) => {
        this.enviando = false;
        this.error = msg || 'No pudimos guardar la reserva. Intenta de nuevo.';
        // si otra persona tomo la hora mientras tanto, se vuelve a elegir con las horas actualizadas
        if (typeof msg === 'string' && msg.includes('tomado')) { this.paso = 'hora'; this.cargarHoras(); }
      }
    });
  }

  confirmarCambio() {
    if (!this.reprogramar || this.dia === null || this.horaElegida === null) return;
    this.enviando = true;
    this.error = '';
    this.agendaService.reprogramarMiCita(this.reprogramar, { dia: this.dia, mes: this.mes, year: this.year, hora: this.horaElegida }).subscribe({
      next: () => { this.enviando = false; this.paso = 'listo'; },
      error: (msg: string) => {
        this.enviando = false;
        this.error = msg || 'No pudimos cambiar la cita. Intenta de nuevo.';
        if (typeof msg === 'string' && msg.includes('tomado')) { this.paso = 'hora'; this.cargarHoras(); }
      }
    });
  }

  reservarOtra() {
    if (this.reprogramar) { this.router.navigate(['/mis-citas']); return; }
    this.servicio = null; this.dia = null; this.horaElegida = null; this.error = '';
    this.paso = 'servicio';
  }
}
