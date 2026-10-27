import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { EventsService } from 'src/app/services/events.service';
import { despuesDeComprimir, problemaFoto } from 'src/app/shared/validar-foto';
import { comprimirImagen, PARA_PERFIL } from 'src/app/shared/comprimir-imagen';

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


  // la foto se comprime en el navegador antes de subirla (cualquier foto sirve)
  async cargarImg(event:any){
    const archivo: File | undefined = event.target.files?.[0];
    event.target.value = '';
    this.mensajeError = problemaFoto(archivo);
    if (this.mensajeError || !archivo) { this.img = null; return; }
    this.subiendo = true;
    const comprimida = await comprimirImagen(archivo, PARA_PERFIL);
    this.subiendo = false;
    this.mensajeError = despuesDeComprimir(comprimida);
    this.img = this.mensajeError ? null : comprimida;
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
