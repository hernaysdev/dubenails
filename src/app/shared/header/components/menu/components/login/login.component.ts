import { AfterViewInit, Component, ElementRef, EventEmitter, inject, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup , FormBuilder ,  Validators } from '@angular/forms';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { EventsService } from 'src/app/services/events.service';
import { SharedService } from 'src/app/services/shared.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
 @Output('userActive')  userActive : EventEmitter<any> = new EventEmitter();
 @ViewChild('googleBtn') googleBtn?: ElementRef<HTMLDivElement>;
  // a donde ir despues de iniciar sesion; null = quedarse (lo usa el flujo de reserva)
  @Input() destino: string | null = '/agenda';
  public formLogin : FormGroup ;
  public msgError : string = '';
  public googleHabilitado = !!environment.googleClientId;
  router = inject(Router)
  private zone = inject(NgZone)
  constructor(
    private formBuilder : FormBuilder,
    private usuariosService : UsuariosService,
    private eventsService : EventsService,
    private sharedService : SharedService
  ) { 
    this.formLogin = this.formBuilder.group({
      usuario : ['', [Validators.required , Validators.minLength(3)]],
      clave  : ['',  [Validators.required , Validators.minLength(6)]] 
     } )
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.renderBotonGoogle();
  }

  login(){
    if (this.formLogin.invalid) { this.msgError = 'Escribe tu correo (o usuario) y tu clave.'; return; }
    this.msgError = '';
    const { usuario , clave } = this.formLogin.value;
    // con correo se envia tal cual; con alias se normaliza como se guardan
    const entrada = usuario.trim();
    const nombre = entrada.includes('@') ? entrada.toLowerCase() : entrada.replaceAll(' ','_').toLowerCase();
      const body  = {
        nombre , password :clave
      }
    this.usuariosService.autorizacionUser(body).subscribe({
      next: (data:any) => this.iniciarSesion(data),
      error: (error) => {
        this.msgError = error?.msg || 'No pudimos iniciar sesión. Intenta de nuevo.';
      }
    })
  }

  loginGoogle(credential: string) {
    this.msgError = '';
    this.usuariosService.loginGoogle(credential).subscribe({
      next: (data: any) => this.iniciarSesion(data),
      error: (error: any) => {
        this.msgError = error?.msg || 'No se pudo iniciar sesión con Google';
      }
    })
  }

  private iniciarSesion(data: any) {
    localStorage.setItem('token' , data?.token );
    this.sharedService.setRolUser(data);
    this.eventsService.cerrarModalLogin.emit(false);
    this.eventsService.showRegistro.emit(true)
    this.userActive.emit(true)
    if (this.destino) this.router.navigate([this.destino])
  }

  // el script de Google carga async (index.html): se espera hasta ~10s a que este disponible
  private renderBotonGoogle(intentos = 0) {
    if (!this.googleHabilitado || !this.googleBtn) return;
    const google = (window as any).google;
    if (!google?.accounts?.id) {
      if (intentos < 50) setTimeout(() => this.renderBotonGoogle(intentos + 1), 200);
      return;
    }
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      // el callback lo llama Google fuera de Angular: se vuelve a la zona para que se actualice la vista
      callback: (respuesta: any) => this.zone.run(() => this.loginGoogle(respuesta.credential)),
    });
    google.accounts.id.renderButton(this.googleBtn.nativeElement, {
      theme: 'outline', size: 'large', text: 'continue_with', locale: 'es', width: 280,
    });
  }

}
