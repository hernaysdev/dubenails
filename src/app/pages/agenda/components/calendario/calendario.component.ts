import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import * as moment from 'moment';
import { AgendaService } from 'src/app/services/agenda.service';
import { SharedService } from 'src/app/services/shared.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { EventsService } from 'src/app/services/events.service';

@Component({
  selector: 'app-calendario',
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.scss']
})
export class CalendarioComponent implements OnInit {


  public dias: any[] = [];
  public day: any;
  public mes: any;
  public mesNumber: any;
  public mesAgenda: any;
  public year: any;
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

  constructor(
    private agendaService: AgendaService,
    private sharedService: SharedService,
    private formBuilder: FormBuilder,
    private router: Router,
    public eventsService: EventsService
  ) {

    this.form = this.formBuilder.group({
      clienteDia: ['']
    })

    this.formGroup = this.formBuilder.group({
          usuario: [''],
        })
  }

  ngOnInit(): void {
    this.eventsService.setValorMontoTotal.subscribe(valor => {
      if(valor){
       this.totalMes(this.mesCalculo);
       this.totalUsers(this.mesCalculo)
      }
    })
    moment.locale('es');
    this.fechas();
    this.verificarUsuario();
    if(this.rolUsuario === ''){

    }
    this.sharedService.getDeleteAgenda().subscribe( res => {
      this.showModalDetalle = res;
    })
  }

  verificarUsuario() {
    this.sharedService.getRolUser().subscribe((rol) => {
      if (rol) {
        this.rolUsuario = (rol.rol) ? rol.rol : '';
        this.totalMes(this.mesAgenda);
      }
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
    const year = moment().year();
    const month = moment().month();
    this.mes = moment().format('MMMM');
    this.mesNumber = moment().month();
    this.mesAgenda = this.mesNumber;
    this.day = new Date().getDate();
    const dias = moment([year, month]).daysInMonth();

    for (let i = 1; i <= dias; i++) {
      this.dias.push({
        dia: i,
        diaName: moment([year, month, i]).format('dddd')
      });
    }
  }

  dateNext(valor: number) {
    this.formGroup.controls['usuario'].setValue('');
    this.usersFilter = []
    this.colorFilterDia = []
    this.dias = [];
    let month = this.mesNumber;
    const year = moment().year();
    month += valor;
    if (month === 12) month = 0;

    let monthNext = moment([year, month]).format('MMMM');
    this.mes = monthNext;
    const monthDay = moment([year, month]).daysInMonth();

    for (let i = 1; i <= monthDay; i++) {
      this.dias.push({
        dia: i,
        diaName: moment([year, month, i]).format('dddd')
      });
    }
    this.mesAgenda = month;

    this.totalMes(this.mesAgenda)
    this.totalUsers(this.mesAgenda) 
  }

  detalleComponents(event: any) {
    this.detalleComponent = event;
    this.showModalDetalle = false;
  }

  modalAgenda(day: any, month: string, diaName: string, eventday:any,mesNumber:any, mesAgenda:any):any {

        if( day < eventday && mesNumber === mesAgenda && this.rolUsuario !== 'admin'
          || day < eventday +1 && this.rolUsuario !== 'admin' && mesNumber === mesAgenda
          || diaName === 'domingo' && this.rolUsuario !== 'admin'){
            this.desabilitarDia = true;
            return false;
        }
    this.dia = { day, month, diaName };
    this.showModalDetalle = true;
  }

  totalMes(mes: number) {
    this.mesCalculo = mes;
    if (this.rolUsuario === 'admin') {
      this.agendaService.getTotalValorMes(mes).subscribe({
        next: (valor: number) => {
          this.sumaValorMes = valor;
          this.totalUsers(mes)
        },
        error: (error: any) => { }
      })
    }
  }

  public usuarios : any;
  totalUsers(mes: number) {
    this.mesCalculo = mes;
    if (this.rolUsuario === 'admin') {
      this.agendaService.getUsersMes(mes).subscribe({
        next: (data) => {
            this.usuarios = data
        },
        error: (error: any) => { }
      })
    }
  }


  registroExitoso(event:any){
    this.rolUsuario = event;
  }

  navigateInicio(){
    this.router.navigateByUrl('home')
  }

  searchUser(event:  any): any{
    const { usuario } = this.formGroup.value;
    console.log('.....', usuario)
   if(!usuario.trim().length){
        this.usersFilter = [];
        this.usersFilter = []
        this.colorFilterDia = []
        return false;
      }

    this.filter(usuario)
  }

  filter(usuario:string){
    let user = []
    let dias = [''];
    this.usuarios.forEach( (users:any) => {
      if(users.nombre.indexOf(usuario) === 0){
        user.push(users)
        if(!dias.includes(users.dia)){
          dias.push(users.dia)
        }
        this.usersFilter = user;
        this.colorFilterDia = dias;
      }
    })
  }

  selectUser(dia:any,usuario:any){
    this.formGroup.controls['usuario'].setValue(usuario)
    this.usersFilter = []
    this.colorFilterDia = [dia]

  }
}
