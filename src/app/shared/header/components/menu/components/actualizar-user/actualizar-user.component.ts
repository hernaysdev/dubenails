import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { SharedService } from 'src/app/services/shared.service';
import { EventsService } from 'src/app/services/events.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-actualizar-user',
  templateUrl: './actualizar-user.component.html',
  styleUrls: ['./actualizar-user.component.scss']
})
export class ActualizarUserComponent implements OnInit {
  public formRegister: FormGroup;
  public usuario: any[] = [];
  constructor(
    private formBuilder: FormBuilder,
    private usuariosService: UsuariosService,
    private sharedService: SharedService,
    private eventsService: EventsService
  ) {
    this.formRegister = this.formBuilder.group({
      nombre: ['', [Validators.required]],
      correo: ['', [Validators.required]],
      password: ['', [Validators.required]],
      password2: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      direccion: ['', [Validators.required]]
    })
  }

  ngOnInit(): void {

    this.dataUsuario()
  }


  dataUsuario() {
    this.sharedService.getDataUsuario().subscribe((data: any) => {
      this.usuario.push(data);
      this.formRegister.controls['nombre'].setValue(data.nombre)
      this.formRegister.controls['telefono'].setValue(data.telefono)
      this.formRegister.controls['direccion'].setValue(data.direccion)
      this.formRegister.controls['correo'].setValue(data.correo)
    })
  }

  enviar() {
    const { nombre , telefono , direccion , correo } = this.formRegister.value;
      const nombreFormat = nombre.replaceAll(' ', '_');
       const body = {
        nombre: nombreFormat , telefono , direccion , correo
       }
     this.usuariosService.actualizarUsuario(body , this.usuario[0].id).subscribe({next: (data:any) => {
         this.usuario[0].nombre = nombre;
         this.usuario[0].telefono = telefono;
         this.usuario[0].direccion = direccion;
         this.usuario[0].correo = correo;
       this.sharedService.setDataUsuario(this.usuario[0])
       this.eventsService.alertMessage('success','Actualizado con Exito');
     }, error: (err) => {
       this.eventsService.alertMessage('error',`${err}`);
     }}) 
  }



}
