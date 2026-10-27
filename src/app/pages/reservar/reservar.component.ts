import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DiaDisponible, DisponibilidadService, Servicio, formatoDuracion, formatoHora } from 'src/app/services/disponibilidad.service';
import { AgendaService, PagoElegido } from 'src/app/services/agenda.service';
import { ContenidoService, MedioPago } from 'src/app/services/contenido.service';
import { opcionesDePago } from 'src/app/shared/pago/pago.component';
import { UsuariosService } from 'src/app/services/usuarios.service';

type Paso = 'servicio' | 'dia' | 'hora' | 'datos' | 'listo';
// varios servicios seguidos en una misma cita (igual que en la API)
export const MAX_SERVICIOS = 4;
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_ADELANTE = 3;

// Reserva guiada: servicios -> dia -> hora -> datos -> listo. Se pueden elegir varios servicios seguidos
// (una sola cita con la duracion y el precio sumados). Se puede recorrer sin cuenta;
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
  elegidos: Servicio[] = [];
  readonly maxServicios = MAX_SERVICIOS;
  // la barra de "Continuar" queda fija justo encima del menu inferior (su alto cambia en iPhone)
  altoPie = 75;
  mes: number; year: number;
  private readonly mesInicial: number; private readonly yearInicial: number;
  dias: DiaDisponible[] = [];
  blancos: number[] = [];
  dia: number | null = null;
  horas: number[] = [];
  horaElegida: number | null = null;

  usuario: { id: string; nombre: string; telefono: string; correo: string; esAdmin: boolean } | null = null;
  mostrarRegistro = false;
  form: FormGroup;
  cargando = false;
  enviando = false;
  error = '';
  // id de la cita que se esta cambiando (viene de Mis citas); null = reserva nueva
  reprogramar: string | null = null;
  // pago con captura: solo si la admin configuro algun medio de pago
  medios: MedioPago[] = [];
  porcentajes: number[] = [];
  pago: PagoElegido | null = null;
  // hora ya apartada esperando la captura (si fallo la subida, se reintenta sin volver a reservar)
  private citaApartada: string | null = null;
  pagoEnviado = false;

  constructor(
    private disponibilidad: DisponibilidadService,
    private agendaService: AgendaService,
    private usuariosService: UsuariosService,
    private contenidoService: ContenidoService,
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

  @HostListener('window:resize')
  medirPie() {
    const pie = document.querySelector('app-footer');
    const alto = pie ? Math.round(pie.getBoundingClientRect().height) : 0;
    if (alto > 0) this.altoPie = alto;
  }

  ngOnInit(): void {
    setTimeout(() => this.medirPie());
    this.reprogramar = this.route.snapshot.queryParamMap.get('reprogramar');
    this.cargando = true;
    this.disponibilidad.servicios().subscribe({
      next: (servicios) => {
        this.servicios = servicios;
        this.cargando = false;
        // ?servicio=id o id1,id2 (desde la portada o al reprogramar una cita con varios servicios)
        const ids = (this.route.snapshot.queryParamMap.get('servicio') || '').split(',').filter(Boolean);
        const elegidos = ids.map(id => servicios.find(s => s.id === id)).filter((s): s is Servicio => !!s);
        if (elegidos.length) { this.elegidos = elegidos.slice(0, MAX_SERVICIOS); this.continuar(); }
        // ?marcar=id o id1,id2 (detalle de la portada o "Quiero este diseño" del Muro): quedan marcados en el
        // paso 1 para que sume otros
        const marcar = (this.route.snapshot.queryParamMap.get('marcar') || '').split(',')
          .map(id => servicios.find(s => s.id === id)).filter((s): s is Servicio => !!s);
        if (!elegidos.length && marcar.length) this.elegidos = marcar.slice(0, MAX_SERVICIOS);
      },
      error: () => { this.cargando = false; this.error = 'No pudimos cargar los servicios. Intenta de nuevo en un momento.'; }
    });
    this.cargarUsuario();
    this.contenidoService.pagos().subscribe({
      next: ({ medios, porcentajes }) => { this.medios = medios; this.porcentajes = porcentajes; },
      error: () => { this.medios = []; },
    });
  }

  // la admin agenda sin pagar (igual que en la API)
  get conPago() { return this.medios.length > 0 && !this.reprogramar && !this.usuario?.esAdmin; }
  get opcionesPago() { return opcionesDePago(this.precioTotal, this.porcentajes); }

  get numeroPaso() { return this.pasos.indexOf(this.paso) + 1; }
  get nombreMes() { return `${MESES[this.mes]} ${this.year}`; }
  get puedeRetroceder() { return this.year > this.yearInicial || this.mes > this.mesInicial; }
  get puedeAvanzar() { return (this.year - this.yearInicial) * 12 + this.mes - this.mesInicial < MESES_ADELANTE; }
  get fechaElegida() {
    if (this.dia === null) return '';
    const f = new Date(this.year, this.mes, this.dia);
    return `${DIAS[f.getDay()]} ${this.dia} de ${MESES[this.mes]}`;
  }

  get hayServicios() { return this.elegidos.length > 0; }
  get nombreServicios() { return this.elegidos.map(s => s.nombre).join(' + '); }
  get duracionTotal() { return this.elegidos.reduce((t, s) => t + s.duracion, 0); }
  get precioTotal() { return this.elegidos.reduce((t, s) => t + s.precio, 0); }
  private get idsElegidos() { return this.elegidos.map(s => s.id).join(','); }

  estaElegido(s: Servicio) { return this.elegidos.some(e => e.id === s.id); }

  // marca o desmarca; el orden en que los elige es el orden en que se hacen
  alternarServicio(s: Servicio) {
    this.error = '';
    if (this.estaElegido(s)) { this.elegidos = this.elegidos.filter(e => e.id !== s.id); return; }
    if (this.elegidos.length >= MAX_SERVICIOS) { this.error = `Puedes elegir hasta ${MAX_SERVICIOS} servicios por cita.`; return; }
    this.elegidos = [...this.elegidos, s];
  }

  continuar() {
    if (!this.hayServicios) return;
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
    if (!this.hayServicios) return;
    this.blancos = Array(new Date(this.year, this.mes, 1).getDay()).fill(0);
    this.dias = [];
    this.cargando = true;
    this.disponibilidad.dias(this.idsElegidos, this.mes, this.year).subscribe({
      next: (dias) => { this.dias = dias; this.cargando = false; },
      error: () => { this.cargando = false; this.error = 'No pudimos cargar los días disponibles.'; }
    });
  }

  elegirDia(d: DiaDisponible) {
    if (!d.libres || !this.hayServicios) return;
    this.dia = d.dia; this.horaElegida = null; this.error = '';
    this.paso = 'hora';
    this.cargarHoras();
  }

  cargarHoras() {
    if (!this.hayServicios || this.dia === null) return;
    this.horas = [];
    this.cargando = true;
    this.disponibilidad.horas(this.idsElegidos, this.dia, this.mes, this.year).subscribe({
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
        this.usuario = { id: u.id, nombre: u.nombre, telefono: u.telefono ? String(u.telefono) : '', correo: u.correo, esAdmin: u.rol === 'admin' };
        this.form.patchValue({ nombre: this.form.value.nombre || u.nombre, telefono: this.form.value.telefono || this.usuario.telefono });
      },
      error: () => { this.usuario = null; }
    });
  }

  confirmar() {
    if (!this.usuario || !this.hayServicios || this.dia === null || this.horaElegida === null) return;
    if (this.reprogramar) return this.confirmarCambio();
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.conPago) return this.reservarConPago();
    const { nombre, telefono } = this.form.value;
    this.enviando = true;
    this.error = '';
    this.agendaService.recibirDatos(this.datosReserva(nombre, telefono)).subscribe({
      next: () => { this.enviando = false; this.paso = 'listo'; },
      error: (msg: string) => {
        this.enviando = false;
        this.error = msg || 'No pudimos guardar la reserva. Intenta de nuevo.';
        // si otra persona tomo la hora mientras tanto, se vuelve a elegir con las horas actualizadas
        if (typeof msg === 'string' && msg.includes('tomado')) { this.paso = 'hora'; this.cargarHoras(); }
      }
    });
  }

  // aparta la hora y sube la captura; queda "pago en revision" hasta que la admin lo apruebe
  reservarConPago() {
    if (!this.pago) { this.error = 'Elige cuánto pagas, el medio y adjunta la captura del pago.'; return; }
    const { nombre, telefono } = this.form.value;
    this.enviando = true;
    this.error = '';
    if (this.citaApartada) { this.subirPago(this.citaApartada); return; }
    this.agendaService.reservarConPago(this.datosReserva(nombre, telefono)).subscribe({
      next: ({ id, pago }) => {
        // la API decide si pide pago: si confirmo la reserva sin pago, no hay captura que subir
        if (!pago || !id) { this.enviando = false; this.paso = 'listo'; return; }
        this.citaApartada = id; this.subirPago(id);
      },
      error: (msg: string) => {
        this.enviando = false;
        this.error = msg || 'No pudimos apartar la hora. Intenta de nuevo.';
        if (typeof msg === 'string' && msg.includes('tomado')) { this.paso = 'hora'; this.cargarHoras(); }
      }
    });
  }

  private subirPago(id: string) {
    this.agendaService.subirPago(id, this.pago!).subscribe({
      next: () => { this.enviando = false; this.citaApartada = null; this.pagoEnviado = true; this.paso = 'listo'; },
      error: (e: { status: number; msg?: string }) => {
        this.enviando = false;
        if (e.status === 410) {
          // se acabo el tiempo y la hora se libero: hay que elegir otra
          this.citaApartada = null;
          this.error = e.msg || 'Se acabó el tiempo para adjuntar el pago. Elige la hora de nuevo.';
          this.paso = 'hora'; this.cargarHoras();
          return;
        }
        this.error = (e.msg || 'No pudimos subir la captura.') + ' Tu hora sigue apartada: vuelve a intentarlo.';
      }
    });
  }

  private datosReserva(nombre: string, telefono: string) {
    return {
      nombre: nombre.trim(),
      dia: String(this.dia),
      horaNueva: this.horaElegida,
      servicio: this.nombreServicios,
      horaServicio: this.duracionTotal,
      telefono: telefono.trim(),
      mes: this.mes,
      year: this.year,
      id: this.usuario!.id,
      nuevo: true,
      token: '',
      estado: true,
      correo: this.usuario!.correo || '',
      precio: this.precioTotal,
      // la API arma nombre, duracion y precio desde estos ids
      servicioIds: this.elegidos.map(s => s.id),
    };
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
    this.elegidos = []; this.dia = null; this.horaElegida = null; this.error = '';
    this.pago = null; this.pagoEnviado = false; this.citaApartada = null;
    this.paso = 'servicio';
  }
}
