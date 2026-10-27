import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { EventsService } from 'src/app/services/events.service';
import { problemaFoto } from 'src/app/shared/validar-foto';

@Component({
  selector: 'app-actualizar-foto',
  templateUrl: './actualizar-foto.component.html',
  styleUrls: ['./actualizar-foto.component.scss']
})
export class ActualizarFotoComponent implements OnInit {
    public img : any;
    @Input('idUser') idUser: any;
    @Output('imgUser') imgUser : EventEmitter<string> = new EventEmitter();
  constructor(
    private usuariosService : UsuariosService,
    private eventsService : EventsService
  ){}

  ngOnInit(): void {
  }


  cargarImg(event:any){
    const archivo: File | undefined = event.target.files?.[0];
    this.mensajeError = problemaFoto(archivo);
    // una foto que no sirve no se guarda (y se puede volver a elegir la misma)
    this.img = this.mensajeError ? null : archivo;
    if (this.mensajeError) event.target.value = '';
  }

  mensajeOk = '';
  mensajeError = '';
  subiendo = false;

  submit(){
    this.mensajeOk = ''; this.mensajeError = '';
    if (!this.img) { this.mensajeError = 'Elige una imagen primero.'; return; }
    this.subiendo = true;
    let formData = new FormData();
    formData.append('archivo',this.img)
    this.usuariosService.cargaImg(formData , this.idUser).subscribe({next: (url:string) => {
      this.subiendo = false;
      this.imgUser.emit(url)
      this.mensajeOk = 'Tu foto se actualizó.';
      this.img = null;
    }, error: (err: any) => {
      this.subiendo = false;
      this.mensajeError = err?.error?.msg || (typeof err === 'string' ? err : '') || 'No pudimos subir la imagen. Prueba con una foto JPG o PNG.';
    }})
  }


}
