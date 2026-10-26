import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { EventsService } from 'src/app/services/events.service';
import { SharedService } from 'src/app/services/shared.service';
import { Router } from '@angular/router';

// Registro corto: nombre, correo, telefono y clave. El alias lo genera la API a partir del nombre.
// valida el correo sin considerar espacios al inicio o al final (el autocompletado del celular los agrega)
const correoValido = (c: AbstractControl) => Validators.email({ value: String(c.value ?? '').trim() } as AbstractControl);

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent implements OnInit {
  // a donde ir despues de registrarse; null = quedarse (lo usa el flujo de reserva)
  @Input() destino: string | null = '/agenda';
  public formRegister: FormGroup;
  public messageError = '';
  public enviando = false;
  public verClave = false;
  @Output() registroExitoso = new EventEmitter();
  @Output('userActive') userActive: EventEmitter<any> = new EventEmitter();
  router = inject(Router)
  constructor(
    private formBuilder: FormBuilder,
    private usuariosService: UsuariosService,
    private eventsService: EventsService,
    private sharedService: SharedService
  ) {
    this.formRegister = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
      correo: ['', [Validators.required, correoValido]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    })
  }

  ngOnInit(): void {
  }

  invalido(campo: string) {
    const c = this.formRegister.get(campo);
    return !!c && c.invalid && c.touched;
  }

  enviar() {
    this.messageError = '';
    if (this.formRegister.invalid) {
      this.formRegister.markAllAsTouched();
      this.messageError = 'Revisa los campos marcados.';
      return;
    }
    const { nombre, correo, password, telefono } = this.formRegister.value;
    const body = {
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase(),
      password,
      telefono,
    }
    this.enviando = true;
    this.usuariosService.saveUsuarios(body).subscribe({
      next: () => this.login(body.correo, password),
      error: (error: any) => {
        this.enviando = false;
        this.messageError = typeof error === 'string' && error ? error : 'No pudimos crear la cuenta. Intenta de nuevo.';
      }
    })
  }

  // con Google la API crea la cuenta (o vincula una existente) y devuelve la sesion
  registroGoogle(credencial: string) {
    this.messageError = '';
    this.enviando = true;
    this.usuariosService.loginGoogle(credencial).subscribe({
      next: (data: any) => this.iniciarSesion(data),
      error: (error: any) => {
        this.enviando = false;
        this.messageError = error?.msg || 'No pudimos registrarte con Google. Intenta de nuevo.';
      }
    })
  }

  private iniciarSesion(data: any) {
    this.enviando = false;
    localStorage.setItem('token', data?.token);
    this.sharedService.setRolUser(data);
    this.eventsService.showRegistro.emit(data);
    this.userActive.emit(true)
    this.registroExitoso.emit(true)
    if (this.destino) this.router.navigate([this.destino])
    this.eventsService.cerrarModalLogin.emit(false);
  }

  // despues de registrarse entra con el correo (el alias puede haber cambiado si estaba repetido)
  login(correo: string, clave: string) {
    this.usuariosService.autorizacionUser({ nombre: correo, password: clave }).subscribe({
      next: (data: any) => this.iniciarSesion(data),
      error: () => {
        this.enviando = false;
        this.messageError = 'Tu cuenta se creó, pero no pudimos iniciar sesión. Entra con tu correo y clave.';
      }
    })
  }
}
