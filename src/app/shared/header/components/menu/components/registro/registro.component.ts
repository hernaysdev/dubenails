import { Component, EventEmitter, Inject, model, OnInit, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { EventsService } from 'src/app/services/events.service';
import { SharedService } from 'src/app/services/shared.service';
@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent implements OnInit {
  public formRegister: FormGroup;
  public messageError: any;
  public messageExito: string = '';
  @Output() registroExitoso = new EventEmitter();
  @Output('userActive') userActive: EventEmitter<any> = new EventEmitter();
  constructor(
    private formBuilder: FormBuilder,
    private usuariosService: UsuariosService,
    private eventsService: EventsService,
    private sharedService: SharedService
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
  }

  enviar() {
    this.messageError = '';
    this.messageExito = '';
    const { nombre,
      correo,
      password,
      password2,
      telefono,
      direccion } = this.formRegister.value;

    if (password !== password2) {
      this.messageError = 'las contraseñas no coinciden';
      return
    }
    const body = {
      nombre: nombre.toLowerCase(),
      correo: correo.toLowerCase(),
      password,
      telefono,
      rol: 'user',
      direccion: direccion.toLowerCase()
    }
    this.usuariosService.saveUsuarios(body).subscribe(({
      next: (data) => {
        this.eventsService.alertMessage('success', 'Registrado con Exito');
        this.login(nombre,password)
        this.reset()
        setTimeout(() => {
          this.registroExitoso.emit(true)
        },1500)
      }, error: (error) => {
        this.eventsService.alertMessage('error', error)
        this.reset()
      }
    }))
  }


  reset() {
    this.formRegister.controls['nombre'].setValue('')
    this.formRegister.controls['correo'].setValue('')
    this.formRegister.controls['password'].setValue('')
    this.formRegister.controls['password2'].setValue('')
    this.formRegister.controls['telefono'].setValue('')
    this.formRegister.controls['direccion'].setValue('')
  }

  login(usuario: string, clave: string) {
    const body = {
      nombre: usuario.toLowerCase(), password: clave
    }
    this.usuariosService.autorizacionUser(body).subscribe({
      next: (data: any) => {
        localStorage.setItem('token', data?.token);
        this.sharedService.setRolUser(data);
        this.eventsService.showRegistro.emit(data);
        this.userActive.emit(true)
        this.eventsService.cerrarModalLogin.emit(false);
      }
    })
  }
}
