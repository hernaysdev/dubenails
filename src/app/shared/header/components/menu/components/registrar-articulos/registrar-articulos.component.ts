import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup , FormBuilder ,  Validators } from '@angular/forms';
import * as moment from 'moment';
import { ArticulosService } from 'src/app/services/articulos.service';
import { EventsService } from 'src/app/services/events.service';

@Component({
  selector: 'app-registrar-articulos',
  templateUrl: './registrar-articulos.component.html',
  styleUrls: ['./registrar-articulos.component.scss']
})
export class RegistrarArticulosComponent implements OnInit {
  public formArticulos : FormGroup;
  public img : any;
  @Input('idUser') idUser :any;
  @Output('success') success : EventEmitter<any> = new EventEmitter();

  constructor(
    private formBuilder : FormBuilder,
    private articulosService :ArticulosService,
    private eventsService : EventsService
  ) {
    this.formArticulos = this.formBuilder.group({
      nombre:[''],
      descripcion:['']
    })
   }

  ngOnInit(): void {
  }

  cargarImg(event:any){
    this.img = event.target.files[0];
  }

  enviar(){
    moment.locale('es');
    const fecha = moment().format('MMMM Do YYYY, h:mm:ss a');
    const { nombre , descripcion } = this.formArticulos.value;
    /* this.carga = true; */
    let formData = new FormData();
    formData.append('archivo',this.img)
    formData.append('nombre',nombre)
    formData.append('fecha',fecha)
    formData.append('descripcion',descripcion)
    formData.append('id', this.idUser)
    this.articulosService.saveArticulos(formData).subscribe({next: (data) => {
      this.success.emit(true);
      this.eventsService.cargaArticulos.emit(data);
      this.eventsService.alertMessage('success','Articulo Guardado');
    }, error: (err) => {
      this.eventsService.alertMessage('error','No se pudo registrar el Articulo')
       /*
      this.carga = false;
      this.message = 'No se pudo cargar la imagen...'; */
    }})
  }
}
