import { Component, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AgendaService } from 'src/app/services/agenda.service';
import { EventsService } from 'src/app/services/events.service';
import { SharedService } from 'src/app/services/shared.service';
import { PagoService } from 'src/app/services/pago.service';
import * as moment from 'moment';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { animate, animation, keyframes, state, style, transition, trigger, ɵBrowserAnimationBuilder } from '@angular/animations';

@Component({
  selector: 'app-modal-register',
  templateUrl: './modal-register.component.html',
  animations: [

    // ejemplo de animacion con keyframes

    // trigger('w', [
    //   transition('false => true', [
    //     animate('0.75s', keyframes([
    //       style({
    //         'display': 'flex',
    //         'transition': '500ms'
    //       })
    //     ]))
    //   ]),
    //   state('false', style( { background : 'red'}))
    // ]),

    // ejemplo de animacion por estados 

    // trigger('event', [
    //   state('start', style({
    //     background: 'red'
    //   })),
    //   state('end', style({
    //     background: 'blue'
    //   })),
    //   transition('start => end', animate('10s') )
    // ]),

    // animacion por objectos que se insentar o remueven con condicionales ( for , if )
    trigger('MyInsertRemoveTrigger', [
      transition(':enter', [
        style({opacity: 0}),
        animate('300ms', style({opacity: 1}))
      ]),

    ])
  ],
  styleUrls: ['./modal-register.component.scss']
})
export class ModalRegisterComponent implements OnInit {
  @Output('registerModal') registerModal: EventEmitter<any> = new EventEmitter();
  @Output('cerrarDetalle') cerrarDetalle: EventEmitter<any> = new EventEmitter();
  @Output('dato') dato: EventEmitter<any> = new EventEmitter();
  @Input('dia') dia: any;
  @Input('horas') horas: any;
  @Input('horasCopias') horasCopias: any;
  showModal: boolean = false;
  serviceSelection: string = '';
  hourSelection: string = '';
  mes: any;
  findUsuario: string = '';
  findEmail: string = '';
  public listEmail: any[] = [];
  public typeConsult: string = '';
  captur: ElementRef<HTMLInputElement> = '' as any;

  public formGroup: FormGroup<any>;
  public lista: any[] = [
    { nombre: 'Manicura (solo limpieza)', numberServicio: 1 },
    { nombre: 'Manicura luxury', numberServicio: 1.5 },
    { nombre: 'kapping gel', numberServicio: 1.5 },
    { nombre: 'Acrilicas', numberServicio: 2.5 },
    { nombre: 'Polygel', numberServicio: 2 },
    { nombre: 'Pedicura clasica', numberServicio: 1.5 },
    { nombre: 'Pedicura + kapping', numberServicio: 2 },
    { nombre: 'Retoque', numberServicio: 1 },
    { nombre: 'Retiro esmaltado', numberServicio: 0.5 },
    { nombre: 'Retiro acrilica o poligel', numberServicio: 0.5 }
  ];
  public success: boolean = false;
  public error: string = '';
  public horaDisponible: string = '';
  public listaHora: string[] = [
    '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '13.5'
    , '14', '14.5', '15', '15.5', '16', '16.5', '17', '17.5', '18', '18.5', '19', '19.5'];
  public modalHoras: boolean = false;
  public horaSelecciona: number = 0;
  public modalServicios: boolean = false;
  public idUser: string = '';
  public rol: string = '';
  public token: string = '';
  public anima : boolean = false;


  constructor(
    private formBuilder: FormBuilder,
    private agendaService: AgendaService,
    private eventsService: EventsService,
    private sharedService: SharedService,
    private pagoService: PagoService,
    private usuariosService: UsuariosService
  ) {
    moment.locale('es');
    this.formGroup = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      servicio: ['Seleccione un servicio...', [Validators.required]],
      hora: ['Seleccione una hora...', [Validators.required, Validators.minLength(2)]],
      telefono: [''],
      correo: ['']
    })
  }

  ngOnInit(): void {
    this.cambiosForm();
    this.setDataCliente();

    let contador = 0.5;
    this.horas.forEach((h: any) => {
      for (let i = 0; i < 10; i++) {
        if (h.horaInicio < h.horaFin) {
          this.listaHora = this.listaHora.filter(hora => hora != h.horaInicio);
        }
        h.horaInicio = h.horaInicio + contador;
      }
    })
  }

  hideModal() {
    this.registerModal.emit(false);
  }

  formatearServicio(servicio: string) {
    let numberServicio = 0;
    switch (servicio) {
      case 'Manicura (solo limpieza)': numberServicio = 1; break;
      case 'Manicura luxury': numberServicio = 1.5; break;
      case 'kapping gel': numberServicio = 1.5; break;
      case 'Acrilicas': numberServicio = 2.5; break;
      case 'Polygel': numberServicio = 2; break;
      case 'Pedicura clasica': numberServicio = 1.5; break;
      case 'Pedicura + kapping': numberServicio = 2; break;
      case 'Retoque': numberServicio = 1; break;
      case 'Retiro acrilica o poligel': numberServicio = 0.5; break;
      case 'Retiro esmaltado': numberServicio = 0.5; break;
    }
    return numberServicio;
  }

  handleModal() {
    const year = moment().year();
    this.mes = moment([year, this.dia.month]).format('MMMM');
    this.showModal = true;
    const { servicio } = this.formGroup.value;
    this.serviceSelection = servicio;
  }

  async enviarDatos() {
    this.formGroup.controls['nombre'].enable();
    this.formGroup.controls['telefono'].enable();
    this.formGroup.controls['correo'].enable();
    const { nombre, servicio, telefono, correo } = this.formGroup.value;
    const dia = Number(this.dia.day);
    const mes = Number(this.dia.month);
    const hora = Number(this.horaSelecciona);
    const horaServicio = this.lista.filter(e => e.nombre === servicio)[0].numberServicio;
    this.traerData(Number(hora), nombre, servicio, dia, horaServicio, telefono, mes, correo)
  }

  async traerData(horaNueva: number, nombre: string, servicio: string, dia: number, horaServicio: number, telefono: any, mes: number, correo: any) {
    this.agendaService.getDatosDay(this.dia).subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          const tramos = data.map((element: any) => {
            return { horaInicio: element.hora, horaFin: element.tramo, dia: Number(element.dia), mes: element.mes }
          })
          for (let horasDB of tramos) {

            /*  const tiempoServicio = horasDB.horaFin - horasDB.horaInicio; */
            if (dia === horasDB.dia && mes === horasDB.mes && horaNueva === horasDB.horaInicio ||
              dia === horasDB.dia && mes === horasDB.mes && horaNueva > horasDB.horaInicio && horaNueva + horaServicio < horasDB.horaFin ||
              dia === horasDB.dia && mes === horasDB.mes && horaNueva < horasDB.horaInicio && horaNueva + horaServicio > horasDB.horaInicio) {
              this.showModal = false;
              const formatearHoraServicio = (String(horaServicio).length > 1) ? String(horaServicio).split('.')[0] + ':30' : horaServicio;
              this.horaDisponible = `Servicio ${servicio} demora ${formatearHoraServicio}hrs esta chocando con otra hora revisa la agenda e intenta de nuevo.`;
              this.success = false;
            }
          }
        }
        if (this.horaDisponible === '') {
          this.agendarHora(nombre, horaNueva, servicio, dia, horaServicio, telefono, mes, this.idUser, correo);
          this.cerrarDetalle.emit(false);
        }

      }, error: (error: any) => {
        this.showModal = false;
        if (error === 'No se encontraron registros.') {
          this.agendarHora(nombre, horaNueva, servicio, dia, horaServicio, telefono, mes, this.idUser, correo)
        }
      }
    })
  }

  cambiosForm() {
    this.formGroup.controls['nombre'].valueChanges.subscribe(valor => {
      if (valor.length >= 1)
        this.success = false;

    })
    this.formGroup.controls['hora'].valueChanges.subscribe(valor => {
      if (valor.length >= 1)
        this.success = false;

    })

    this.formGroup.controls['servicio'].valueChanges.subscribe(valor => {
      if (valor.length >= 1)
        this.success = false;
    })
  }

  mostrarHoras() {
    this.modalHoras = true;
  }

  hideModalHoras() {
    this.modalHoras = false;
  }

  SeleccionHora(event: any) {
    this.hourSelection = event.innerText;
    this.horaDisponible = '';
    const evento = event.innerText.split(':');
    this.formGroup.controls['hora'].setValue(
      (evento[1].includes('3')) ? evento[0] + ':30' :
        evento[0] + ':00'
    );
    this.horaSelecciona = (evento[1].includes('3')) ? Number(evento[0] + '.5') : Number(evento[0]);
    this.modalHoras = false;
  }

  mostrarServicios() {
    this.modalServicios = true;
  }

  hideModalServicios() {
    this.modalServicios = false;
  }

  SeleccionServicio(event: any) {
    this.formGroup.controls['servicio'].setValue(event.innerText);
    this.modalServicios = false;
  }

  agendarHora(nombre: string, horaNueva: any, servicio: string, dia: number, horaServicio: any, telefono: any, mes: number, id: string, correo: any) {
    /* if (!this.lista.includes(servicio)) {
      this.horaDisponible = 'El servicio es obligatorio';
      this.success = false;
      return
    } */

    const nuevo = (this.rol === 'admin') ? false : true;
    const token = this.token;
    const estado = true;
    // const estado = (this.rol === 'admin') ? true : false;
    this.agendaService.recibirDatos({ nombre, horaNueva, servicio, dia, horaServicio, telefono, mes, id, nuevo, token, estado, correo }).subscribe({
      next: (msg: string) => {
        this.formGroup.controls['nombre'].setValue('');
        this.formGroup.controls['hora'].setValue('');
        this.formGroup.controls['servicio'].setValue('');
        this.formGroup.controls['telefono'].setValue('');
        this.formGroup.controls['correo'].setValue('');
        this.success = true;
        this.error = '';
        this.eventsService.alertMessage('success', 'Registrado con Exito')
        this.eventsService.successDatos.emit(true);
        this.eventsService.setValorMontoTotal.emit(true);
        this.setDataCliente();
        this.registerModal.emit(false);
      },
      error: (msg: string) => {
        this.showModal = false;
        this.error = msg;
        this.success = false;
        this.eventsService.alertMessage('error', msg)
      }

    })
  }


  setDataCliente() {
    this.sharedService.getRolUser().subscribe(data => {
      if (data) {
        this.idUser = data.id;
        this.rol = data.rol;
        if (data?.nombre && data?.rol !== 'admin') {
          this.formGroup.controls['nombre'].disable();
          this.formGroup.controls['nombre'].setValue(data.nombre);
          if (data?.correo) {
            this.formGroup.controls['correo'].disable();
            this.formGroup.controls['correo'].setValue(data.correo);
          }
          if (data?.telefono) {
            this.formGroup.controls['telefono'].disable();
            this.formGroup.controls['telefono'].setValue(data.telefono);
          }
        }
      }
    })
  }


  async pagar() {
    const dia = this.dia.day;
    const mes = this.dia.month;
    const hora = String(this.horaSelecciona);
    const correo = this.formGroup.controls['correo'].getRawValue();
    const tokenUsuario = localStorage.getItem('token') as string;
    this.pagoService.generarPago(correo, tokenUsuario, mes, dia, hora).subscribe({
      next: (data: any) => {
        this.token = data.token;
        this.enviarDatos();
        if (this.horaDisponible.length === 0) {
          setTimeout(() => {
            open(data.urlRedirect);
          }, 500)
        }

      }, error: (error) => {
      }
    })
  }

  closeModal() {
    this.showModal = false;
  }

  find(event: any, type: string): any {
     if(type === 'correo'){
     const  { correo } = this.formGroup.value;
      this.findEmail = correo;
      this.typeConsult = 'correo';
      if(!correo.trim().length){
        this.listEmail = [];
        return false
      };
      this.findUsers(this.findEmail, type);
    }else{
      const  { nombre } = this.formGroup.value;
      this.findUsuario = nombre;
      this.typeConsult = 'nombre';
      if(!nombre.trim().length) {
        this.listEmail = [];
        return false
      };
      this.findUsers(this.findUsuario, type);
    }
  }


  findUsers(search: any, type: string){
    this.usuariosService.findUsuarioExpress(search, type).subscribe({
      next: (value: any) => {
        if (value === typeof toString()) {
          this.formGroup.controls['correo'].setValue('');
          this.formGroup.controls['telefono'].setValue('');
          this.formGroup.controls['nombre'].setValue('');
          this.listEmail = [];
          this.findUsuario = '';
        } else {
          this.listEmail = value.usuarios;
        }
      },
      error(err) {

      },
    })
  }

  selectData(email: any, nombre: any, telefono: any) {
    this.formGroup.controls['correo'].setValue(email);
    this.formGroup.controls['nombre'].setValue(nombre);
    this.formGroup.controls['telefono'].setValue(telefono);
    this.findUsuario = nombre;
    this.findEmail = email;
    this.typeConsult = '';
    this.listEmail = []
  }

  OnWobbleStart(){
    this.anima = true;
  }
}
