import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup , FormBuilder ,  Validators } from '@angular/forms';
import * as moment from 'moment';
import { ArticulosService } from 'src/app/services/articulos.service';
import { EventsService } from 'src/app/services/events.service';
import { problemaFoto } from 'src/app/shared/validar-foto';

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
    const archivo: File | undefined = event.target.files?.[0];
    this.mensajeError = problemaFoto(archivo);
    // una foto que no sirve no se guarda (y se puede volver a elegir la misma)
    this.img = this.mensajeError ? null : archivo;
    if (this.mensajeError) event.target.value = '';
  }

  mensajeError = '';
  enviando = false;

  enviar(){
    this.mensajeError = '';
    const valores = this.formArticulos.value;
    if (!valores.nombre?.trim() || !valores.descripcion?.trim()) { this.mensajeError = 'Escribe un título y una descripción.'; return; }
    if (!this.img) { this.mensajeError = 'Elige una foto para la publicación.'; return; }
    this.enviando = true;
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
      this.enviando = false;
      this.success.emit(true);
      this.eventsService.cargaArticulos.emit(data);
      this.eventsService.alertMessage('success','Publicado en el Muro');
    }, error: (err: any) => {
      this.enviando = false;
      this.mensajeError = err?.error?.msg || (typeof err === 'string' ? err : '') || 'No pudimos publicar. Revisa la foto e intenta de nuevo.';
       /*
      this.carga = false;
      this.message = 'No se pudo cargar la imagen...'; */
    }})
  }
}
