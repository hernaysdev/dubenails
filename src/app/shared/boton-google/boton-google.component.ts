import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, Output, ViewChild } from '@angular/core';
import { environment } from 'src/environments/environment';

// Boton oficial de Google Identity Services. Emite la credencial (ID token) que se envia a /api/auth/google.
// Se usa en login ("Continuar con Google") y en registro ("Registrarse con Google").
@Component({
  selector: 'app-boton-google',
  template: '<div #contenedor class="google" *ngIf="habilitado"></div>',
  styles: ['.google { display: flex; justify-content: center; min-height: 44px; }'],
})
export class BotonGoogleComponent implements AfterViewInit {
  @Input() texto: 'continue_with' | 'signup_with' | 'signin_with' = 'continue_with';
  @Output() credencial = new EventEmitter<string>();
  @ViewChild('contenedor') contenedor?: ElementRef<HTMLDivElement>;
  readonly habilitado = !!environment.googleClientId;

  constructor(private zone: NgZone) { }

  ngAfterViewInit(): void {
    this.render();
  }

  // el script de Google carga async (index.html): se espera hasta ~10s a que este disponible
  private render(intentos = 0) {
    if (!this.habilitado || !this.contenedor) return;
    const google = (window as any).google;
    if (!google?.accounts?.id) {
      if (intentos < 50) setTimeout(() => this.render(intentos + 1), 200);
      return;
    }
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      // Google llama fuera de Angular: se vuelve a la zona para que se actualice la vista
      callback: (respuesta: any) => this.zone.run(() => this.credencial.emit(respuesta.credential)),
    });
    google.accounts.id.renderButton(this.contenedor.nativeElement, {
      theme: 'outline', size: 'large', text: this.texto, locale: 'es', width: 280,
    });
  }
}
