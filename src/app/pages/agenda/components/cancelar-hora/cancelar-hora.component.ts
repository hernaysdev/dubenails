import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AgendaService } from 'src/app/services/agenda.service';
import { EventsService } from 'src/app/services/events.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-cancelar-hora',
  templateUrl: './cancelar-hora.component.html',
  styleUrls: ['./cancelar-hora.component.scss']
})
export class CancelarHoraComponent implements OnInit{
@Input('dia') dia : any ;
@Input('nombre') nombre : string = '';
@Input('telefono') telefono : any;
@Input('botonCancelars') botonCancelars : any ;
@Input('servicio') servicio: any;
@Input('hora') hora: any;
@Input('mes') mes: any;
@Output('returnData') returnData : EventEmitter<any> = new EventEmitter();
public telefonoPrivado = false;
public modalCancelar : boolean = false;
public day : any = '';
public botonCancelar : boolean = false;
  constructor(
    private agendaService : AgendaService,
    private eventsService : EventsService,
    private sharedService: SharedService
  ) {
    this.day = new Date().getDate();
  }

  ngOnInit() {
    this.botonCancelar =  this.botonCancelars ;
  }

   
  cancelar(){
    this.modalCancelar = true;
  }

  cancelarOperacion(valor:boolean){
      const body = {
        dia : this.dia.day , 
        nombre : this.nombre, 
        mes: this.mes,
        servicio: this.servicio,
        hora: this.hora
      }
      if(valor){
        this.agendaService.borrarHora(body).subscribe({next: (resp) => {
          this.eventsService.successDatos.emit(true);
          this.eventsService.setValorMontoTotal.emit(true);
          this.sharedService.setDeleteAgenda(false)
       },
    error : () => {

    }})
      }
      this.modalCancelar = false;
  }


}
