import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { EventsService } from 'src/app/services/events.service';

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
    this.img = event.target.files[0];
  }

  submit(){
    let formData = new FormData();
    formData.append('archivo',this.img)
    this.usuariosService.cargaImg(formData , this.idUser).subscribe({next: (url:string) => {
      this.imgUser.emit(url)
      this.eventsService.alertMessage('success','Imagen cargada con Exito');
      this.img = null;
    }, error: (err) => {
      this.eventsService.alertMessage('error','No se pudo cargar la Imagen');
    }})
  }


}
