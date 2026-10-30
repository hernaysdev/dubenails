import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { NovedadesService } from 'src/app/services/novedades.service';
import * as moment from 'moment';
import { AgendaService } from 'src/app/services/agenda.service';
import { SharedService } from 'src/app/services/shared.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { EventsService } from 'src/app/services/events.service';
import { firstValueFrom } from 'rxjs';
import { ContenidoService } from 'src/app/services/contenido.service';

@Component({
  selector: 'app-calendario',
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.scss']
})
export class CalendarioComponent implements OnInit, OnDestroy {


  public dias: any[] = [];
  public day: any;
  public mes: any;
  public mesActual: any;
  public mesAgenda: any;
  public year!: number;
  public modalRegisters: boolean = false;
  public dataAgenda: any[] = [];
  public selectDia: any;
  public cargandoData: boolean = false;
  public detalleComponent: boolean = false;
  public clienteDay: any;
  public sumaValorMes: number = 0;
  public rolUsuario: string = '';
  @Output('telefono') telefono: EventEmitter<any> = new EventEmitter();
  @Output('loginAdmin') loginAdmin: EventEmitter<any> = new EventEmitter();
  @Output('dia') dia: any;
  public showModalDetalle: boolean = false;
  public form: FormGroup;
  public diaHabilitado: boolean = true;
  mesCalculo: any;
  desabilitarDia: boolean = false;
  public formGroup: FormGroup<any>;
  usersFilter: any = [];
  colorFilterDia: any = [];
  infoYear: string = '';
  // grilla de 7 columnas (domingo primero): huecos antes del dia 1
  readonly semana = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  private readonly nombresDias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  get blancos(): number[] {
    const i = this.nombresDias.indexOf(String(this.dias[0]?.diaName || '').toLowerCase());
    return Array(i > 0 ? i : 0).fill(0);
  }
  esHoy(dia: number) { return dia === this.day && this.mesActual === this.mesAgenda && this.yearActual === this.year; }
  // la agenda muestra 3 meses: el anterior, el actual y el siguiente
  get desfaseMes(): number { return (this.year - this.yearActual) * 12 + this.mesAgenda - this.mesActual; }
  get puedeRetroceder(): boolean { return this.desfaseMes > -1; }
  get puedeAvanzar(): boolean { return this.desfaseMes < 1; }
  // hay una clienta buscada con citas este mes (la guia muestra su color solo entonces)
  get hayFiltro(): boolean { return this.colorFilterDia.some((d: any) => d !== '' && d != null); }
  yearActual!: number;

  constructor(
    private agendaService: AgendaService,
    private sharedService: SharedService,
    private formBuilder: FormBuilder,
    private router: Router,
    public eventsService: EventsService,
    private novedades: NovedadesService,
    private contenido: ContenidoService
  ) {

    this.form = this.formBuilder.group({
      clienteDia: ['']
    })

    this.formGroup = this.formBuilder.group({
      usuario: [''],
    })
  }

  private subNovedades?: Subscription;

  ngOnDestroy(): void { this.subNovedades?.unsubscribe(); }

  ngOnInit() {
    // horario de atencion editable (Contacto → Horario): marca los dias cerrados y arma las horas al agendar
    this.contenido.horario().subscribe();
    // una clienta agendo o cancelo: se actualizan el total del mes y el detalle del dia abierto
    // la esta viendo: el globo de Agenda vuelve a cero (tambien si llega algo mientras mira)
    this.novedades.marcarAgendaVista();
    this.subNovedades = this.novedades.cambios$.subscribe(c => {
      if (c !== 'agenda') return;
      this.eventsService.successDatos.emit(true);
      this.eventsService.setValorMontoTotal.emit(true);
      this.novedades.marcarAgendaVista();
    });
    moment.locale('es');
    this.fechas();
    this.verificarUsuario();

    this.eventsService.setValorMontoTotal.subscribe(async (valor) => {
      if (valor) {
        this.totalUsers(this.mesCalculo)
        await this.totalMes(this.mesCalculo, this.year, this.rolUsuario);
      }
    })
    this.sharedService.getDeleteAgenda().subscribe(res => {
      this.showModalDetalle = res;
    })
  }


  // el rol llega async (menu consulta /auth/authorization): vale null hasta que responde,
  // por eso se escucha en vez de leerlo una sola vez
  verificarUsuario() {
    this.sharedService.getRolUser().subscribe((rol) => {
      if (rol === null || rol === undefined) return;
      this.rolUsuario = rol?.rol ?? '';
      this.totalMes(this.mesAgenda, this.year, this.rolUsuario);
    })
  }

  modalRegister(dia: any) {
    this.selectDia = dia;
    if (dia >= this.day) {
      this.modalRegisters = true;
    }
  }

  hideModalRegister(event: any) {
    this.modalRegisters = event;
  }

  fechas() {
    this.year = moment().year();
    this.yearActual = this.year;
    this.infoYear = this.year.toString()
    const month = moment().month();
    this.mes = moment().format('MMMM');
    this.mesActual = moment().month();
    this.mesAgenda = this.mesActual;
    this.day = new Date().getDate();
    const dias = moment([this.year, month]).daysInMonth();

    for (let i = 1; i <= dias; i++) {
      this.dias.push({
        dia: i,
        diaName: moment([this.year, month, i]).format('dddd')
      });
    }
  }

  dateNext(valor: number) {
    // reinicia los valores de todo
    this.formGroup.controls['usuario'].setValue('');
    this.usersFilter = []
    this.colorFilterDia = []
    this.dias = [];
    console.log('this.mesActual: ', this.mesActual)
    let month = this.mesAgenda;

    if (valor === 1 && month === 11) this.year++ // cambia al siguiente year
    console.log('mes arriba:', month)

    // sube mes a mes
    if (valor === 1) month += valor;
    else month--; // regresa el mes

    if (valor === 0 && month === -1) {
      month = 11 // controla cuando cambia de year y regresa y colocar enero en -1
      this.year--
    }

    if (month === 12) month = 0; // cuando el mes es 12 transforma a 0 para iniciar en enero

    console.log('month', month)
    let monthNext = moment([this.year, month]).format('MMMM');
    this.mes = monthNext;
    const monthDay = moment([this.year, month]).daysInMonth();

    for (let i = 1; i <= monthDay; i++) {
      this.dias.push({
        dia: i,
        diaName: moment([this.year, month, i]).format('dddd')
      });
    }

    console.log('this.mes: ', this.mes)
    this.mesAgenda = month;
    console.log('this.mesAgenda: ', this.mesAgenda)
    this.infoYear = this.year.toString(); // solo info
    this.totalMes(this.mesAgenda, this.year, this.rolUsuario)
    this.totalUsers(this.mesAgenda)
  }

  detalleComponents(event: any) {
    this.detalleComponent = event;
    this.showModalDetalle = false;
  }

  /** dia sin atencion segun el horario vigente (por nombre: 'domingo', 'lunes'…) */
  diaCerrado(diaName: string): boolean {
    const i = this.nombresDias.indexOf(String(diaName || '').toLowerCase());
    return i >= 0 && !this.contenido.horarioVigente.dias[i];
  }

  modalAgenda(day: any, month: string, diaName: string, eventday: any, mesActual: any, mesAgenda: any): any {

    const esMesEnCurso = mesActual === mesAgenda && this.yearActual === this.year;
    if (day < eventday && esMesEnCurso && this.rolUsuario !== 'admin'
      || day < eventday + 1 && this.rolUsuario !== 'admin' && esMesEnCurso
      || this.diaCerrado(diaName) && this.rolUsuario !== 'admin') {
      this.desabilitarDia = true;
      return false;
    }
    this.dia = { day, month, diaName, year: this.year };
    this.showModalDetalle = true;
  }

  async totalMes(mes: number, year: number, rol: string) {
    try {
      this.mesCalculo = mes;
      if (rol === 'admin') {
        const valor = await firstValueFrom(this.agendaService.getTotalValorMes(mes, year))
        this.sumaValorMes = valor;
        this.totalUsers(mes);
        return false;
      }
    } catch (err) {
      throw err;
    }
    return false;
  }

  public usuarios: any;
  totalUsers(mes: number) {
    console.log('entra de nuevo a esta funcion')
    const year = this.year;
    this.mesCalculo = mes;
    if (this.rolUsuario === 'admin') {
      this.agendaService.getUsersMes(mes, year).subscribe({
        next: (data) => {
          console.log('Usuarios data:', data)
          this.usuarios = data
        },
        error: (error: any) => { }
      })
    }
  }


  registroExitoso(event: any) {
    this.rolUsuario = event;
  }

  navigateInicio() {
    this.router.navigateByUrl('home')
  }

  searchUser(event: any): any {
    const { usuario } = this.formGroup.value;
    console.log('.....', usuario)
    if (!usuario.trim().length) {
      this.usersFilter = [];
      this.usersFilter = []
      this.colorFilterDia = []
      return false;
    }

    this.filter(usuario)
  }

  filter(usuario: string) {
    let user = []
    let dias = [''];
    console.log('usuarios', this.usuarios)
    this.usuarios.forEach((users: any) => {
      if (users.nombre.indexOf(usuario) === 0) {
        user.push(users)
        if (!dias.includes(users.dia)) {
          dias.push(users.dia)
        }
        this.usersFilter = user;
        this.colorFilterDia = dias;
      }
    })
  }

  selectUser(dia: any, usuario: any) {
    this.formGroup.controls['usuario'].setValue(usuario)
    this.usersFilter = []
    this.colorFilterDia = [dia]

  }
}
